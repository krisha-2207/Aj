const { GoogleGenAI } = require('@google/genai');
const prisma = require('../utils/prisma');
const { getExpiryStatus } = require('../utils/expiry');

const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Jx0MdFRBF5NGNxPugRDFoUIhq5tvnL9rvt8MuyRi8pcQ';
const ai = new GoogleGenAI({ apiKey });

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'];

/**
 * Robust LLM generation with fallback across models and retry
 */
async function generateWithFallback({ contents, config = {} }) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed (${err.message}). Trying fallback model...`);
    }
  }
  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

/**
 * 1. Tool: Search Inventory & Available Batches with Multi-term Splitting
 */
async function searchInventoryTool({ query = '', unexpiredOnly = true }) {
  try {
    let tokens = [query.trim()];
    if (query && (query.includes(' and ') || query.includes(',') || query.includes('&') || query.includes('/'))) {
      tokens = query
        .split(/,|\band\b|&|\//i)
        .map((t) => t.trim())
        .filter((t) => t.length > 1);
    }

    const orClauses = [];
    tokens.forEach((t) => {
      if (t) {
        orClauses.push({ batchNumber: { contains: t, mode: 'insensitive' } });
        orClauses.push({ medicine: { name: { contains: t, mode: 'insensitive' } } });
        orClauses.push({ medicine: { genericName: { contains: t, mode: 'insensitive' } } });
        orClauses.push({ medicine: { category: { contains: t, mode: 'insensitive' } } });
      }
    });

    const where = orClauses.length > 0 ? { OR: orClauses } : {};

    const batches = await prisma.medicineBatch.findMany({
      where,
      include: {
        medicine: true,
        dealer: true
      },
      orderBy: { expiryDate: 'asc' }
    });

    const results = batches.map((batch) => {
      const expiry = getExpiryStatus(batch.expiryDate);
      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        productId: batch.medicine?.productId,
        medicineId: batch.medicine?.id,
        medicineName: batch.medicine?.name,
        genericName: batch.medicine?.genericName,
        category: batch.medicine?.category,
        dosageForm: batch.medicine?.dosageForm,
        strength: batch.medicine?.strength,
        manufacturer: batch.medicine?.manufacturer,
        dosageUsage: batch.medicine?.dosageUsage,
        remainingQuantity: batch.remainingQuantity,
        sellingPrice: `₹${batch.sellingPrice}`,
        purchasePrice: `₹${batch.purchasePrice}`,
        expiryDate: batch.expiryDate,
        expiryStatus: expiry.status, // SAFE, EXPIRING_SOON, EXPIRED
        daysToExpiry: expiry.daysRemaining,
        supplier: batch.dealer?.companyName || 'Direct Supply'
      };
    });

    if (unexpiredOnly) {
      return results.filter((r) => r.expiryStatus !== 'EXPIRED' && r.remainingQuantity > 0);
    }
    return results;
  } catch (error) {
    console.error('Error in searchInventoryTool:', error);
    return { error: error.message };
  }
}

/**
 * 2. Dedicated Tool: Get Comprehensive Medicine Details & Stock Profile
 */
async function getMedicineDetailsTool({ query }) {
  try {
    if (!query || !query.trim()) {
      return { error: 'Please provide a medicine name or generic molecule.' };
    }

    let tokens = [query.trim()];
    if (query.includes(' and ') || query.includes(',') || query.includes('&') || query.includes('/')) {
      tokens = query
        .split(/,|\band\b|&|\//i)
        .map((t) => t.trim())
        .filter((t) => t.length > 1);
    }

    const orClauses = [];
    tokens.forEach((t) => {
      orClauses.push({ name: { contains: t, mode: 'insensitive' } });
      orClauses.push({ genericName: { contains: t, mode: 'insensitive' } });
      orClauses.push({ productId: { contains: t, mode: 'insensitive' } });
      orClauses.push({ category: { contains: t, mode: 'insensitive' } });
    });

    const medicines = await prisma.medicine.findMany({
      where: { OR: orClauses },
      include: {
        batches: {
          include: { dealer: true },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    if (!medicines || medicines.length === 0) {
      return {
        found: false,
        searchedQuery: query,
        message: `No medicine records found matching "${query}" in the database.`
      };
    }

    const detailedList = medicines.map((med) => {
      const allBatches = (med.batches || []).map((b) => {
        const exp = getExpiryStatus(b.expiryDate);
        return {
          batchNumber: b.batchNumber,
          remainingQuantity: b.remainingQuantity,
          soldQuantity: b.soldQuantity,
          sellingPrice: `₹${b.sellingPrice}`,
          purchasePrice: `₹${b.purchasePrice}`,
          expiryDate: b.expiryDate,
          expiryStatus: exp.status, // SAFE, EXPIRING_SOON, EXPIRED
          daysToExpiry: exp.daysRemaining,
          supplier: b.dealer?.companyName || 'Direct Supply'
        };
      });

      const validBatches = allBatches.filter((b) => b.expiryStatus !== 'EXPIRED' && b.remainingQuantity > 0);
      const totalAvailableStock = validBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);

      return {
        medicineId: med.id,
        productId: med.productId,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        dosageForm: med.dosageForm || 'Tablet',
        strength: med.strength || 'N/A',
        manufacturer: med.manufacturer || 'Standard Pharma',
        dosageUsage: med.dosageUsage || 'As advised by doctor',
        minStockLevel: med.minStockLevel || 10,
        gstRate: `${med.gstRate || 12}%`,
        totalAvailableStock,
        stockStatus: totalAvailableStock <= 0 ? 'OUT_OF_STOCK' : totalAvailableStock <= med.minStockLevel ? 'LOW_STOCK' : 'IN_STOCK',
        unexpiredBatchesCount: validBatches.length,
        batches: allBatches
      };
    });

    return {
      found: true,
      count: detailedList.length,
      medicines: detailedList
    };
  } catch (error) {
    console.error('Error in getMedicineDetailsTool:', error);
    return { error: error.message };
  }
}

/**
 * 3. Tool: Find In-Stock Substitute & Therapeutic Alternative Tablets for Low Stock / Out-of-Stock Items
 */
async function findSubstitutesAndAlternativesTool({ medicineName = '' }) {
  try {
    const allMedicines = await prisma.medicine.findMany({
      include: {
        batches: {
          where: { remainingQuantity: { gt: 0 } },
          include: { dealer: true },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    const inStockList = [];
    allMedicines.forEach((m) => {
      const validBatches = (m.batches || []).filter((b) => getExpiryStatus(b.expiryDate).status !== 'EXPIRED');
      const totalQty = validBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      if (totalQty > 0) {
        inStockList.push({
          id: m.id,
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          dosageForm: m.dosageForm,
          strength: m.strength,
          manufacturer: m.manufacturer,
          usage: m.dosageUsage,
          totalInStock: totalQty,
          earliestBatch: validBatches[0]
            ? {
                batchNumber: validBatches[0].batchNumber,
                sellingPrice: `₹${validBatches[0].sellingPrice}`,
                expiryDate: validBatches[0].expiryDate,
                remainingQuantity: validBatches[0].remainingQuantity,
                supplier: validBatches[0].dealer?.companyName || 'Direct Supply'
              }
            : null
        });
      }
    });

    const targetMed = allMedicines.find((m) =>
      m.name.toLowerCase().includes(medicineName.toLowerCase()) ||
      m.genericName.toLowerCase().includes(medicineName.toLowerCase())
    );

    return {
      targetRequestedMedicine: targetMed
        ? {
            name: targetMed.name,
            genericName: targetMed.genericName,
            category: targetMed.category,
            dosageForm: targetMed.dosageForm,
            strength: targetMed.strength,
            usage: targetMed.dosageUsage,
            totalStock: (targetMed.batches || []).reduce((sum, b) => sum + (b.remainingQuantity || 0), 0)
          }
        : { name: medicineName },
      allInStockMedicinesInPharmacy: inStockList
    };
  } catch (error) {
    console.error('Error in findSubstitutesAndAlternativesTool:', error);
    return { error: error.message };
  }
}

/**
 * 4. Tool: Get Low Stock and Expiring Soon Batches
 */
async function getStockAlertsTool() {
  try {
    const batches = await prisma.medicineBatch.findMany({
      include: { medicine: true, dealer: true },
      orderBy: { expiryDate: 'asc' }
    });

    const lowStock = [];
    const expiringSoon = [];
    const expired = [];

    batches.forEach(b => {
      const exp = getExpiryStatus(b.expiryDate);
      const minStock = b.medicine?.minStockLevel || 10;
      
      const item = {
        batchNumber: b.batchNumber,
        medicineName: b.medicine?.name,
        genericName: b.medicine?.genericName,
        remainingQuantity: b.remainingQuantity,
        minStockLevel: minStock,
        expiryDate: b.expiryDate,
        daysToExpiry: exp.daysRemaining,
        supplier: b.dealer?.companyName || 'Direct',
        supplierPhone: b.dealer?.phone || 'N/A'
      };

      if (exp.status === 'EXPIRED') {
        expired.push(item);
      } else if (exp.status === 'EXPIRING_SOON') {
        expiringSoon.push(item);
      }

      if (b.remainingQuantity <= minStock && exp.status !== 'EXPIRED') {
        lowStock.push(item);
      }
    });

    return {
      totalBatchesChecked: batches.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 15),
      expiringSoonCount: expiringSoon.length,
      expiringSoonItems: expiringSoon.slice(0, 15),
      expiredCount: expired.length,
      expiredItems: expired.slice(0, 10)
    };
  } catch (error) {
    console.error('Error in getStockAlertsTool:', error);
    return { error: error.message };
  }
}

/**
 * 3. Tool: Create Draft Purchase Order for Low Stock
 */
async function createDraftPOTool({ dealerId, items, notes = 'Auto-generated by Krisha AI Reorder Agent' }) {
  try {
    if (!dealerId) {
      const dealers = await prisma.dealer.findMany({ where: { status: 'ACTIVE' }, take: 1 });
      if (dealers.length > 0) {
        dealerId = dealers[0].id;
      } else {
        return { error: 'No active dealer found in system to assign PO.' };
      }
    }

    const orderNumber = `PO-AI-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    const validatedItems = [];
    for (const item of items) {
      const med = await prisma.medicine.findUnique({ where: { id: item.medicineId } });
      if (med) {
        const qty = parseInt(item.quantity) || 50;
        const unitCost = parseFloat(item.unitCost) || parseFloat(med.mrp * 0.7) || 50;
        const total = qty * unitCost;
        totalAmount += total;
        validatedItems.push({
          medicineId: med.id,
          quantity: qty,
          unitCost,
          totalPrice: total
        });
      }
    }

    if (validatedItems.length === 0) {
      return { error: 'No valid medicines specified for purchase order.' };
    }

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        dealerId,
        status: 'PENDING',
        totalAmount,
        notes,
        items: {
          create: validatedItems
        }
      },
      include: {
        dealer: true,
        items: {
          include: { medicine: true }
        }
      }
    });

    return {
      success: true,
      orderNumber: createdPO.orderNumber,
      poId: createdPO.id,
      dealer: createdPO.dealer?.companyName,
      totalAmount: `₹${createdPO.totalAmount.toLocaleString('en-IN')}`,
      status: createdPO.status,
      itemsCount: createdPO.items.length,
      message: `Purchase Order ${createdPO.orderNumber} successfully created in DRAFT (PENDING) status.`
    };
  } catch (error) {
    console.error('Error in createDraftPOTool:', error);
    return { error: error.message };
  }
}

/**
 * 4. Tool: Check Clinical Drug-Drug Interactions & Warnings
 */
async function checkDrugInteractionsTool({ medicineNames = [] }) {
  if (!medicineNames || medicineNames.length === 0) {
    return { hasAlert: false, warnings: [] };
  }

  const prompt = `You are an expert clinical pharmacist in India. Analyze the following list of prescribed medicines for potential risks:
Medicines: ${medicineNames.join(', ')}

Please evaluate:
1. Drug-Drug Interactions (Major, Moderate, Minor)
2. Duplicate Active Ingredients / Therapeutic Duplication (e.g. two paracetamol brands like Dolo & Crocin)
3. Critical Patient Precautions & Directions (e.g., take with food, avoid alcohol)

Return a structured JSON with:
{
  "hasInteractions": boolean,
  "riskLevel": "SAFE" | "MODERATE" | "HIGH",
  "alerts": [
    {
      "type": "INTERACTION" | "DUPLICATION" | "PRECAUTION",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "title": "Short title",
      "description": "Clear clinical explanation",
      "recommendation": "What the pharmacist should do"
    }
  ],
  "summary": "Brief 1-2 sentence clinical summary"
}`;

  try {
    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error in checkDrugInteractionsTool:', error);
    return {
      hasInteractions: false,
      riskLevel: 'SAFE',
      alerts: [],
      summary: 'No critical interactions identified.'
    };
  }
}

/**
 * 5. Tool: Get Financial & Store Metrics Summary (Owner only)
 */
async function getStoreMetricsTool({ period = '30d' }) {
  try {
    const bills = await prisma.bill.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalSales = bills.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalBills = bills.length;

    const medicines = await prisma.medicine.findMany({
      include: { batches: true }
    });

    let totalStockUnits = 0;
    let totalStockValuation = 0;
    medicines.forEach(m => {
      (m.batches || []).forEach(b => {
        totalStockUnits += b.remainingQuantity || 0;
        totalStockValuation += (b.remainingQuantity || 0) * (b.purchasePrice || 0);
      });
    });

    return {
      totalRevenue: `₹${totalSales.toLocaleString('en-IN')}`,
      totalBillsCount: totalBills,
      totalStockUnits,
      inventoryValuationPurchase: `₹${Math.round(totalStockValuation).toLocaleString('en-IN')}`,
      totalMedicinesInCatalog: medicines.length
    };
  } catch (error) {
    console.error('Error in getStoreMetricsTool:', error);
    return { error: error.message };
  }
}

/**
 * Vision Agent: Scan & Parse Doctor's Prescription (OCR + FEFO Stock Matcher)
 */
async function parsePrescriptionVision({ base64Data, mimeType = 'image/jpeg' }) {
  try {
    const allMeds = await prisma.medicine.findMany({
      include: {
        batches: {
          where: { remainingQuantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    const stockCatalogBrief = allMeds.map(m => {
      const validBatches = (m.batches || []).filter(b => getExpiryStatus(b.expiryDate).status !== 'EXPIRED');
      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        mrp: m.mrp,
        availableQuantity: validBatches.reduce((acc, b) => acc + b.remainingQuantity, 0),
        earliestBatch: validBatches[0] ? {
          batchId: validBatches[0].id,
          batchNumber: validBatches[0].batchNumber,
          sellingPrice: validBatches[0].sellingPrice,
          expiryDate: validBatches[0].expiryDate,
          remainingQuantity: validBatches[0].remainingQuantity
        } : null
      };
    });

    const prompt = `You are an AI Clinical Pharmacist Assistant for an Indian Medical Store.
Analyze this medical prescription image accurately, even if it contains doctor handwriting or shorthand (e.g. "Tab Paracetamol 650mg TDS x 5d", "Cap Amox 500 BD").

Here is the current pharmacy inventory catalog for reference matching:
${JSON.stringify(stockCatalogBrief.slice(0, 30))}

TASK:
1. Extract Doctor Name, Patient Name, Diagnosis / Date if legible.
2. Extract all prescribed drugs, strengths, dosage frequency (e.g., 1-0-1), duration (e.g., 5 days), and calculate total required units.
3. Match each prescribed drug to the closest matching item in the provided pharmacy inventory catalog.
4. If matched, attach the medicine ID and earliest FEFO unexpired batch details.
5. If not matched in catalog, mark "matchedInStock": false and provide the generic suggestion.
6. Provide clinical notes or safety warnings (e.g., "Antibiotic course - take after meals").

Return ONLY valid JSON with this exact structure:
{
  "doctorName": string or null,
  "patientName": string or null,
  "prescriptionDate": string or null,
  "detectedItems": [
    {
      "prescribedName": "Medicine as written",
      "dosage": "e.g. 1-0-1 (Twice daily)",
      "duration": "e.g. 5 days",
      "calculatedQuantity": number,
      "matchedInStock": boolean,
      "medicineId": "id string if matched, else null",
      "matchedMedicineName": "matched store name",
      "batchId": "earliest FEFO batch id if available, else null",
      "batchNumber": "batch number",
      "unitPrice": number,
      "availableStock": number,
      "directions": "e.g. Take after food"
    }
  ],
  "safetyNotes": ["list of clinical warnings or instructions"],
  "confidenceScore": "HIGH" | "MEDIUM" | "LOW"
}`;

    const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

    const response = await generateWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    return parsed;
  } catch (error) {
    console.error('Error in parsePrescriptionVision:', error);
    throw new Error(`Prescription analysis failed: ${error.message}`);
  }
}

function extractTextFromResponse(resp) {
  if (!resp) return '';
  if (typeof resp.text === 'string' && resp.text.trim()) return resp.text;
  const parts = resp.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text).filter(Boolean).join('\n');
}

/**
 * Main Conversational Agent with Dynamic Tool Execution
 */
async function runPharmacyAgent({ userMessage, chatHistory = [], userRole = 'PHARMACY_OWNER' }) {
  try {
    const tools = [
      {
        name: 'find_substitutes_and_alternatives',
        description: 'Find and recommend clinical, generic, and brand substitute tablets currently IN STOCK in the pharmacy for out-of-stock, low-stock, or sold medicines, including reasons, pharmacological mechanism, and dosage advice',
        parameters: {
          type: 'OBJECT',
          properties: {
            medicineName: { type: 'STRING', description: 'The medicine name to find substitutes or alternatives for (e.g. Paracetamol, Amoxicillin, Pantoprazole)' }
          },
          required: ['medicineName']
        }
      },
      {
        name: 'get_medicine_details',
        description: 'Get comprehensive clinical profile and inventory stock details for one or multiple medicines from the store database (manufacturer, usage, strength, available stock, unexpired FEFO batches, pricing in ₹, supplier)',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Medicine name or names to look up (e.g. "Paracetamol", "Amoxicillin", "Dolo 650")' }
          },
          required: ['query']
        }
      },
      {
        name: 'search_inventory',
        description: 'Search medicine catalog, stock levels, unexpired batches, and pricing in the pharmacy',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Medicine name, generic name, category, or batch number' },
            unexpiredOnly: { type: 'BOOLEAN', description: 'Whether to only return unexpired stock' }
          }
        }
      },
      {
        name: 'get_stock_alerts',
        description: 'Get list of low stock items needing reorder, batches expiring soon (RED status <= 60 days), and expired items',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'check_drug_interactions',
        description: 'Clinically evaluate drug-drug interactions, duplicate molecules, and precautions for a list of medicine names',
        parameters: {
          type: 'OBJECT',
          properties: {
            medicineNames: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Array of medicine names to evaluate'
            }
          },
          required: ['medicineNames']
        }
      }
    ];

    if (userRole === 'PHARMACY_OWNER' || userRole === 'ADMIN') {
      tools.push(
        {
          name: 'get_store_metrics',
          description: 'Get financial summary, total sales revenue, total stock units, inventory valuation in INR',
          parameters: {
            type: 'OBJECT',
            properties: {
              period: { type: 'STRING', description: 'Time range, e.g., 30d, 7d' }
            }
          }
        },
        {
          name: 'create_draft_purchase_order',
          description: 'Autonomously create a draft Purchase Order for low stock medicines to a dealer',
          parameters: {
            type: 'OBJECT',
            properties: {
              dealerId: { type: 'STRING', description: 'Optional specific dealer ID' },
              items: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    medicineId: { type: 'STRING', description: 'ID of the medicine' },
                    quantity: { type: 'INTEGER', description: 'Quantity units/strips to reorder' },
                    unitCost: { type: 'NUMBER', description: 'Estimated purchase cost per unit' }
                  },
                  required: ['medicineId', 'quantity']
                },
                description: 'List of medicine items to order'
              },
              notes: { type: 'STRING', description: 'Order reason or remarks' }
            },
            required: ['items']
          }
        }
      );
    }

    const systemInstruction = `You are Krisha AI — an intelligent, highly knowledgeable Pharmacy & Medical Supply Management Agent for Indian medical stores.
User Role: ${userRole}.
Currency: Indian Rupees (₹).
Rules:
1. Always use available database tools to look up real medicines, stock, and batches before answering.
2. When asked about alternatives or substitutes for low stock or sold medicines, invoke find_substitutes_and_alternatives or get_medicine_details.
3. For medicine alternatives, always provide:
   - **Currently In-Stock Alternative Options** from the store database
   - **Medical & Pharmacological Reason** for the recommendation (e.g. higher strength, identical active molecule, or therapeutic equivalent NSAID/Antibiotic)
   - **Dosage & Clinical Directions**
   - **Precautions & Patient Warnings** (liver/kidney/gastric contraindications)
4. Be concise, structured with clear Markdown headers, bold highlights, and bullet points.
5. Format all prices in ₹ (e.g. ₹25.00).`;

    let contents = [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    if (chatHistory && chatHistory.length > 0) {
      const formattedHistory = chatHistory.slice(-6).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg.content || '' }]
      }));
      contents = [...formattedHistory, { role: 'user', parts: [{ text: userMessage }] }];
    }

    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: tools }]
      }
    });

    const candidates = response.candidates || [];
    const modelContent = candidates[0]?.content;
    const functionCalls = (modelContent?.parts || [])
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall);

    if (functionCalls.length > 0) {
      const functionResponseParts = [];
      const executedNames = [];
      let lastToolData = null;

      for (const call of functionCalls) {
        const fnName = call.name;
        const fnArgs = call.args || {};
        executedNames.push(fnName);

        let toolResult = null;
        if (fnName === 'find_substitutes_and_alternatives') {
          toolResult = await findSubstitutesAndAlternativesTool(fnArgs);
        } else if (fnName === 'get_medicine_details') {
          toolResult = await getMedicineDetailsTool(fnArgs);
        } else if (fnName === 'search_inventory') {
          toolResult = await searchInventoryTool(fnArgs);
        } else if (fnName === 'get_stock_alerts') {
          toolResult = await getStockAlertsTool();
        } else if (fnName === 'check_drug_interactions') {
          toolResult = await checkDrugInteractionsTool(fnArgs);
        } else if (fnName === 'get_store_metrics') {
          toolResult = await getStoreMetricsTool(fnArgs);
        } else if (fnName === 'create_draft_purchase_order') {
          toolResult = await createDraftPOTool(fnArgs);
        } else {
          toolResult = { message: 'Tool executed successfully.' };
        }

        lastToolData = toolResult;
        functionResponseParts.push({
          functionResponse: {
            name: fnName,
            response: { result: toolResult }
          }
        });
      }

      const secondResponse = await generateWithFallback({
        contents: [
          ...contents,
          modelContent,
          {
            role: 'user',
            parts: functionResponseParts
          }
        ],
        config: {
          systemInstruction: systemInstruction + '\n\nIMPORTANT: Based on the database tools results above, write a detailed, professional, beautifully formatted answer explaining the medicine details, in-stock alternatives available in our pharmacy, clinical reasons, and dosage instructions in rich Markdown. Do not call any further tools.'
        }
      });

      const replyText = extractTextFromResponse(secondResponse) || `Executed ${executedNames.join(', ')} successfully.`;

      return {
        reply: replyText,
        toolExecuted: executedNames.join(', '),
        toolData: lastToolData
      };
    }

    const replyText = extractTextFromResponse(response) || 'I analyzed your request.';
    return {
      reply: replyText,
      toolExecuted: null,
      toolData: null
    };
  } catch (error) {
    console.error('Error in runPharmacyAgent:', error);
    return {
      reply: `AI Agent encountered an issue: ${error.message}. Please verify settings.`,
      error: true
    };
  }
}

module.exports = {
  runPharmacyAgent,
  parsePrescriptionVision,
  checkDrugInteractionsTool,
  searchInventoryTool,
  getMedicineDetailsTool,
  getStockAlertsTool,
  createDraftPOTool,
  getStoreMetricsTool
};
