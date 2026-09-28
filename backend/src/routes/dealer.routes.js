const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getExpiryStatus } = require('../utils/expiry');

// GET /api/dealers (Owner and Staff can list dealers)
router.get('/', authMiddleware, roleMiddleware(['OWNER', 'STAFF']), async (req, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        batches: { select: { id: true, remainingQuantity: true, initialQuantity: true, soldQuantity: true } },
        purchaseOrders: {
          include: {
            items: { select: { quantity: true } }
          }
        }
      },
      orderBy: { companyName: 'asc' }
    });

    const enriched = dealers.map((d) => {
      const pendingPOs = d.purchaseOrders.filter(
        (po) => po.status === 'PENDING' || po.status === 'APPROVED' || po.status === 'DISPATCHED'
      );
      const tabletsToDispatch = pendingPOs.reduce(
        (sum, po) => sum + po.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0
      );
      const totalStockInStore = d.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);

      return {
        id: d.id,
        companyName: d.companyName,
        contactPerson: d.contactPerson,
        phone: d.phone,
        email: d.email,
        gstin: d.gstin,
        dlNumber: d.dlNumber,
        address: d.address,
        status: d.user.status,
        totalBatchesSupplied: d.batches.length,
        totalOrders: d.purchaseOrders.length,
        pendingOrders: pendingPOs.length,
        tabletsToDispatch,
        totalStockInStore
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dealers', details: error.message });
  }
});

// GET /api/dealers/near-expiry-returns (Fetches all tablets with < 2 months to expiry in pharmacy)
router.get('/near-expiry-returns', authMiddleware, roleMiddleware(['OWNER', 'STAFF']), async (req, res) => {
  try {
    const allBatches = await prisma.medicineBatch.findMany({
      where: {
        remainingQuantity: { gt: 0 }
      },
      include: {
        medicine: true,
        dealer: true
      },
      orderBy: { expiryDate: 'asc' }
    });

    const now = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const nearExpiryBatches = [];
    let totalTablets = 0;
    let totalRefundAmount = 0;
    let totalGstReversal = 0;

    allBatches.forEach((batch) => {
      const expDate = new Date(batch.expiryDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Less than 2 months (<= 60 days) or already expired
      if (diffDays <= 60) {
        const exp = getExpiryStatus(batch.expiryDate);
        const refund = Number((batch.remainingQuantity * batch.purchasePrice).toFixed(2));
        const gst = Number((refund * 0.12).toFixed(2));

        totalTablets += batch.remainingQuantity;
        totalRefundAmount += refund;
        totalGstReversal += gst;

        nearExpiryBatches.push({
          id: batch.id,
          batchNumber: batch.batchNumber,
          medicineId: batch.medicineId,
          productId: batch.medicine?.productId || 'MED',
          medicineName: batch.medicine?.name || 'Medicine',
          genericName: batch.medicine?.genericName || '',
          dosageForm: batch.medicine?.dosageForm || 'Tablet',
          strength: batch.medicine?.strength || '',
          category: batch.medicine?.category || 'General',
          initialQuantity: batch.initialQuantity,
          soldQuantity: batch.soldQuantity,
          remainingQuantity: batch.remainingQuantity,
          purchasePrice: batch.purchasePrice,
          sellingPrice: batch.sellingPrice,
          refundAmount: refund,
          gstReversal: gst,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          daysRemaining: diffDays,
          isExpired: diffDays <= 0,
          expiryStatus: exp.status,
          expiryLabel: exp.label,
          expiryColor: exp.color,
          dealerId: batch.dealerId,
          dealerName: batch.dealer?.companyName || 'Direct Supply',
          dealerContact: batch.dealer?.contactPerson || '',
          dealerPhone: batch.dealer?.phone || '',
          dealerEmail: batch.dealer?.email || '',
          dealerGstin: batch.dealer?.gstin || ''
        });
      }
    });

    res.json({
      summary: {
        totalBatchesCount: nearExpiryBatches.length,
        totalTabletsCount: totalTablets,
        totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
        totalGstReversal: Number(totalGstReversal.toFixed(2)),
        totalReclaimableValue: Number((totalRefundAmount + totalGstReversal).toFixed(2))
      },
      batches: nearExpiryBatches
    });
  } catch (error) {
    console.error('Fetch near-expiry returns error:', error);
    res.status(500).json({ error: 'Failed to fetch near-expiry returns', details: error.message });
  }
});

// GET /api/dealers/:id/dispatch-details (Owner & Staff can view full dispatch requirements & tablets for a dealer)
router.get('/:id/dispatch-details', authMiddleware, roleMiddleware(['OWNER', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        user: true,
        batches: {
          include: { medicine: true },
          orderBy: { receivedDate: 'desc' }
        },
        purchaseOrders: {
          include: {
            items: { include: { medicine: true } }
          },
          orderBy: { orderDate: 'desc' }
        }
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Pending dispatches from Purchase Orders
    const pendingOrders = dealer.purchaseOrders.filter(
      (po) => po.status === 'PENDING' || po.status === 'APPROVED' || po.status === 'DISPATCHED'
    );

    const pendingDispatches = [];
    let totalPoTablets = 0;

    pendingOrders.forEach((po) => {
      po.items.forEach((item) => {
        totalPoTablets += item.quantity;
        pendingDispatches.push({
          id: item.id,
          orderId: po.id,
          orderNumber: po.orderNumber,
          orderDate: po.orderDate,
          orderStatus: po.status,
          medicineId: item.medicineId,
          productId: item.medicine?.productId || 'MED',
          medicineName: item.medicine?.name || 'Medicine',
          genericName: item.medicine?.genericName || '',
          dosageForm: item.medicine?.dosageForm || 'Tablet',
          strength: item.medicine?.strength || '',
          batchNumber: item.batchNumber,
          tabletsToDispatch: item.quantity,
          purchasePrice: item.purchasePrice,
          totalCost: item.purchasePrice * item.quantity,
          expectedExpiry: item.expiryDate
        });
      });
    });

    // Medicines supplied by this dealer that are Low Stock or Out of Stock in pharmacy
    const suppliedMedIds = new Set(dealer.batches.map((b) => b.medicineId));
    const allMeds = await prisma.medicine.findMany({
      include: { batches: true }
    });

    const activePoMedIds = new Set(pendingDispatches.map((p) => p.medicineId));
    const replenishmentNeeds = [];
    let totalRecommendedTablets = 0;

    allMeds.forEach((med) => {
      const isDealerMed = suppliedMedIds.has(med.id);
      const currentStock = med.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);

      if (isDealerMed && currentStock <= med.minStockLevel) {
        const isOutOfStock = currentStock === 0;
        const requiredQty = Math.max(50, (med.minStockLevel * 4) - currentStock);
        const hasActiveOrder = activePoMedIds.has(med.id);

        if (!hasActiveOrder) {
          totalRecommendedTablets += requiredQty;
        }

        replenishmentNeeds.push({
          medicineId: med.id,
          productId: med.productId,
          medicineName: med.name,
          genericName: med.genericName,
          dosageForm: med.dosageForm || 'Tablet',
          strength: med.strength || '',
          minStockLevel: med.minStockLevel,
          currentStock,
          recommendedTablets: requiredQty,
          reason: isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK',
          urgency: isOutOfStock ? 'CRITICAL' : 'HIGH',
          hasActiveOrder,
          estimatedCost: (med.batches[0]?.purchasePrice || 25.0) * requiredQty
        });
      }
    });

    // Near-Expiry Batches (< 2 Months) supplied by this specific dealer
    const now = new Date();
    const nearExpiryBatches = [];
    let totalNearExpiryTablets = 0;
    let totalNearExpiryRefund = 0;

    dealer.batches.forEach((b) => {
      if (b.remainingQuantity > 0) {
        const expDate = new Date(b.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 60) {
          const exp = getExpiryStatus(b.expiryDate);
          const refund = Number((b.remainingQuantity * b.purchasePrice).toFixed(2));
          totalNearExpiryTablets += b.remainingQuantity;
          totalNearExpiryRefund += refund;

          nearExpiryBatches.push({
            id: b.id,
            medicineId: b.medicineId,
            productId: b.medicine?.productId || 'MED',
            medicineName: b.medicine?.name || 'Medicine',
            genericName: b.medicine?.genericName || '',
            dosageForm: b.medicine?.dosageForm || 'Tablet',
            strength: b.medicine?.strength || '',
            batchNumber: b.batchNumber,
            remainingQuantity: b.remainingQuantity,
            purchasePrice: b.purchasePrice,
            sellingPrice: b.sellingPrice,
            refundAmount: refund,
            gstReversal: Number((refund * 0.12).toFixed(2)),
            expiryDate: b.expiryDate,
            daysRemaining: diffDays,
            isExpired: diffDays <= 0,
            expiryStatus: exp.status,
            expiryLabel: exp.label,
            expiryColor: exp.color
          });
        }
      }
    });

    // Batches currently in pharmacy store
    const suppliedBatches = dealer.batches.map((b) => {
      const exp = getExpiryStatus(b.expiryDate);
      return {
        id: b.id,
        productId: b.medicine.productId,
        medicineName: b.medicine.name,
        dosageForm: b.medicine.dosageForm || 'Tablet',
        batchNumber: b.batchNumber,
        initialQuantity: b.initialQuantity,
        soldQuantity: b.soldQuantity,
        remainingQuantity: b.remainingQuantity,
        purchasePrice: b.purchasePrice,
        sellingPrice: b.sellingPrice,
        expiryDate: b.expiryDate,
        expiryStatus: exp.status,
        expiryLabel: exp.label,
        expiryColor: exp.color
      };
    });

    const totalStockInPharmacy = dealer.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
    const totalTabletsSupplied = dealer.batches.reduce((sum, b) => sum + b.initialQuantity, 0);
    const totalTabletsSold = dealer.batches.reduce((sum, b) => sum + b.soldQuantity, 0);

    res.json({
      dealer: {
        id: dealer.id,
        companyName: dealer.companyName,
        contactPerson: dealer.contactPerson,
        phone: dealer.phone,
        email: dealer.email,
        gstin: dealer.gstin,
        dlNumber: dealer.dlNumber,
        address: dealer.address
      },
      summary: {
        totalTabletsToDispatch: totalPoTablets,
        totalRecommendedTablets,
        grandTotalDispatchNeed: totalPoTablets + totalRecommendedTablets,
        pendingOrdersCount: pendingOrders.length,
        totalBatchesSupplied: dealer.batches.length,
        totalStockInPharmacy,
        totalTabletsSupplied,
        totalTabletsSold,
        nearExpiryTabletsCount: totalNearExpiryTablets,
        nearExpiryRefundAmount: Number(totalNearExpiryRefund.toFixed(2)),
        nearExpiryBatchesCount: nearExpiryBatches.length
      },
      pendingDispatches,
      replenishmentNeeds,
      nearExpiryBatches,
      suppliedBatches
    });
  } catch (error) {
    console.error('Fetch dealer dispatch details error:', error);
    res.status(500).json({ error: 'Failed to fetch dealer dispatch details', details: error.message });
  }
});

// GET /api/dealers/my-portal/data (For logged in DEALER)
router.get('/my-portal/data', authMiddleware, roleMiddleware(['DEALER']), async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true,
        batches: {
          include: { medicine: true },
          orderBy: { receivedDate: 'desc' }
        },
        purchaseOrders: {
          include: {
            items: { include: { medicine: true } }
          },
          orderBy: { orderDate: 'desc' }
        }
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const pharmacy = await prisma.pharmacy.findFirst();

    // Enrich batches with dynamic expiry
    const enrichedBatches = dealer.batches.map((batch) => {
      const exp = getExpiryStatus(batch.expiryDate);
      return {
        id: batch.id,
        productId: batch.medicine.productId,
        medicineName: batch.medicine.name,
        category: batch.medicine.category,
        manufacturer: batch.medicine.manufacturer,
        batchNumber: batch.batchNumber,
        initialQuantity: batch.initialQuantity,
        soldQuantity: batch.soldQuantity,
        remainingQuantity: batch.remainingQuantity,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        supplyDate: batch.receivedDate,
        expiryStatus: exp.status,
        expiryLabel: exp.label,
        expiryColor: exp.color,
        pharmacyName: pharmacy ? pharmacy.name : 'PharmaFlow Pharmacy'
      };
    });

    // Summary stats
    const stats = {
      totalBatches: dealer.batches.length,
      totalSuppliedItems: dealer.batches.reduce((acc, b) => acc + b.initialQuantity, 0),
      currentStockInPharmacy: dealer.batches.reduce((acc, b) => acc + b.remainingQuantity, 0),
      pendingOrdersCount: dealer.purchaseOrders.filter((po) => po.status === 'PENDING').length,
      confirmedOrdersCount: dealer.purchaseOrders.filter((po) => po.status === 'APPROVED' || po.status === 'DISPATCHED').length,
      deliveredOrdersCount: dealer.purchaseOrders.filter((po) => po.status === 'RECEIVED' || po.status === 'COMPLETED').length
    };

    res.json({
      dealer: {
        id: dealer.id,
        companyName: dealer.companyName,
        contactPerson: dealer.contactPerson,
        phone: dealer.phone,
        email: dealer.email,
        gstin: dealer.gstin,
        dlNumber: dealer.dlNumber,
        address: dealer.address,
        assignedPharmacy: pharmacy
      },
      stats,
      batches: enrichedBatches,
      orders: dealer.purchaseOrders
    });
  } catch (error) {
    console.error('Fetch dealer portal error:', error);
    res.status(500).json({ error: 'Failed to fetch dealer portal data', details: error.message });
  }
});

// GET /api/dealers/requirements (Automated Low Stock & Out of Stock requirements)
router.get('/requirements', authMiddleware, roleMiddleware(['DEALER', 'OWNER']), async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: {
        batches: true
      },
      orderBy: { name: 'asc' }
    });

    // Check existing pending POs to avoid duplicate alarms
    const activePOs = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED', 'DISPATCHED'] }
      },
      include: {
        items: true,
        dealer: { select: { companyName: true } }
      }
    });

    const activePoMedicineIds = new Set();
    const poDetailsMap = {};
    activePOs.forEach((po) => {
      po.items.forEach((item) => {
        activePoMedicineIds.add(item.medicineId);
        poDetailsMap[item.medicineId] = {
          orderNumber: po.orderNumber,
          status: po.status,
          dealerName: po.dealer.companyName
        };
      });
    });

    const requirements = [];

    medicines.forEach((med) => {
      const currentStock = med.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);

      if (currentStock <= med.minStockLevel) {
        const isOutOfStock = currentStock === 0;
        const requiredQty = Math.max(50, (med.minStockLevel * 4) - currentStock);
        const hasActiveOrder = activePoMedicineIds.has(med.id);

        requirements.push({
          id: `REQ-${med.productId}`,
          medicineId: med.id,
          productId: med.productId,
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm || 'Tablet',
          strength: med.strength || '',
          manufacturer: med.manufacturer,
          minStockLevel: med.minStockLevel,
          currentStock,
          recommendedQuantity: requiredQty,
          reason: isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK',
          urgency: isOutOfStock ? 'CRITICAL' : 'HIGH',
          hasActiveOrder,
          orderInfo: hasActiveOrder ? poDetailsMap[med.id] : null,
          estimatedCost: (med.batches[0]?.purchasePrice || 25.0) * requiredQty
        });
      }
    });

    res.json(requirements);
  } catch (error) {
    console.error('Fetch dealer requirements error:', error);
    res.status(500).json({ error: 'Failed to fetch requirements', details: error.message });
  }
});

// POST /api/dealers/requirements/:medicineId/accept (Dealer accepts requirement & creates/confirms dispatch)
router.post('/requirements/:medicineId/accept', authMiddleware, roleMiddleware(['DEALER']), async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { batchNumber, quantity, purchasePrice, sellingPrice, expiryDate } = req.body;

    const dealer = await prisma.dealer.findUnique({
      where: { userId: req.user.id }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const med = await prisma.medicine.findUnique({
      where: { id: medicineId },
      include: { batches: true }
    });

    if (!med) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const pharmacy = await prisma.pharmacy.findFirst();
    const qty = parseInt(quantity || 50, 10);
    const pPrice = parseFloat(purchasePrice || med.batches[0]?.purchasePrice || 20.0);
    const sPrice = parseFloat(sellingPrice || med.batches[0]?.sellingPrice || 35.0);
    const cleanBatch = (batchNumber || `DLR-${Date.now().toString().slice(-6)}`).trim().toUpperCase();

    // Default expiry 18 months ahead if not provided
    const expDate = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000);

    // Create a Purchase Order with status DISPATCHED directly from dealer
    const currentYear = new Date().getFullYear();
    const poCount = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${currentYear}-${String(poCount + 1).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        dealerId: dealer.id,
        pharmacyId: pharmacy ? pharmacy.id : null,
        status: 'DISPATCHED',
        totalAmount: pPrice * qty,
        notes: `Automated replenishment for ${med.name} accepted by ${dealer.companyName}`,
        items: {
          create: {
            medicineId: med.id,
            batchNumber: cleanBatch,
            quantity: qty,
            purchasePrice: pPrice,
            sellingPrice: sPrice,
            mfgDate: new Date(),
            expiryDate: expDate
          }
        }
      },
      include: {
        items: { include: { medicine: true } }
      }
    });

    res.status(201).json({
      message: `Requirement accepted! Consignment Order ${po.orderNumber} generated and marked as DISPATCHED.`,
      purchaseOrder: po
    });
  } catch (error) {
    console.error('Accept requirement error:', error);
    res.status(500).json({ error: 'Failed to process requirement', details: error.message });
  }
});

// POST /api/dealers/my-portal/supply (Dealer directly registers new batch supply)
router.post('/my-portal/supply', authMiddleware, roleMiddleware(['DEALER']), async (req, res) => {
  try {
    const {
      medicineId,
      batchNumber,
      quantity,
      purchasePrice,
      sellingPrice,
      mfgDate,
      expiryDate
    } = req.body;

    if (!medicineId || !batchNumber || !quantity || !purchasePrice || !sellingPrice || !expiryDate) {
      return res.status(400).json({ error: 'All supply fields are required' });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: req.user.id }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const pharmacy = await prisma.pharmacy.findFirst();

    const qty = parseInt(quantity, 10);
    const cleanBatch = batchNumber.trim().toUpperCase();

    // Check if batch already exists in pharmacy
    let batch = await prisma.medicineBatch.findUnique({
      where: {
        medicineId_batchNumber: {
          medicineId,
          batchNumber: cleanBatch
        }
      }
    });

    if (batch) {
      batch = await prisma.medicineBatch.update({
        where: { id: batch.id },
        data: {
          initialQuantity: { increment: qty },
          remainingQuantity: { increment: qty },
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
          dealerId: dealer.id,
          expiryDate: new Date(expiryDate)
        },
        include: { medicine: true }
      });
    } else {
      batch = await prisma.medicineBatch.create({
        data: {
          medicineId,
          batchNumber: cleanBatch,
          dealerId: dealer.id,
          pharmacyId: pharmacy ? pharmacy.id : null,
          initialQuantity: qty,
          soldQuantity: 0,
          remainingQuantity: qty,
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
          mfgDate: new Date(mfgDate || Date.now()),
          expiryDate: new Date(expiryDate),
          receivedDate: new Date()
        },
        include: { medicine: true }
      });
    }

    res.status(201).json({
      message: `Successfully supplied ${qty} units of ${batch.medicine.name} (Batch ${cleanBatch}). Automatically added to Pharmacy Inventory.`,
      batch
    });
  } catch (error) {
    console.error('Dealer supply error:', error);
    res.status(500).json({ error: 'Failed to record dealer supply', details: error.message });
  }
});

// GET /api/dealers/delivery-bills (Get all Delivery Bills / Consignment Challans for dealer)
router.get('/delivery-bills', authMiddleware, roleMiddleware(['DEALER', 'OWNER']), async (req, res) => {
  try {
    let dealer;
    if (req.user.role === 'DEALER') {
      dealer = await prisma.dealer.findUnique({
        where: { userId: req.user.id },
        include: {
          batches: {
            include: { medicine: true },
            orderBy: { receivedDate: 'desc' }
          },
          purchaseOrders: {
            include: {
              items: { include: { medicine: true } }
            },
            orderBy: { orderDate: 'desc' }
          }
        }
      });
    } else {
      // Owner can view any dealer or all delivery bills
      const dealerId = req.query.dealerId;
      if (dealerId) {
        dealer = await prisma.dealer.findUnique({
          where: { id: dealerId },
          include: {
            batches: {
              include: { medicine: true },
              orderBy: { receivedDate: 'desc' }
            },
            purchaseOrders: {
              include: {
                items: { include: { medicine: true } }
              },
              orderBy: { orderDate: 'desc' }
            }
          }
        });
      } else {
        dealer = await prisma.dealer.findFirst({
          include: {
            batches: {
              include: { medicine: true },
              orderBy: { receivedDate: 'desc' }
            },
            purchaseOrders: {
              include: {
                items: { include: { medicine: true } }
              },
              orderBy: { orderDate: 'desc' }
            }
          }
        });
      }
    }

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const pharmacy = await prisma.pharmacy.findFirst();
    const ownerUser = await prisma.user.findFirst({ where: { role: 'OWNER' } });

    const pharmacyData = {
      name: pharmacy?.name || 'PharmaFlow Retail Medical Store',
      address: pharmacy?.address || '#42, 100ft Ring Road, Indiranagar, Bengaluru, Karnataka - 560038',
      phone: pharmacy?.phone || '+91 80 2528 9000',
      email: pharmacy?.email || 'contact@pharmaflow.com',
      gstin: pharmacy?.gstin || '29AAAAA0000A1Z5',
      dlNumber: pharmacy?.dlNumber || 'KA-B1-20B-102934 / 21B-102935',
      ownerName: ownerUser?.name || 'Dr. Krisha Patel (Owner & Lead Pharmacist)',
      ownerEmail: ownerUser?.email || 'owner@apollocare.com',
      ownerPhone: ownerUser?.phone || '+91 98765 00112'
    };

    const deliveryPersonnel = [
      { name: 'Ramesh Kumar', phone: '+91 98450 12345', vehicleNo: 'KA-04-E-8921 (Mahindra Bolero Maxi)', deliveryAgentId: 'DLV-AGT-104' },
      { name: 'Suresh Patil', phone: '+91 99801 54321', vehicleNo: 'KA-01-MJ-4521 (Tata Ace Gold)', deliveryAgentId: 'DLV-AGT-108' },
      { name: 'Vikas Sharma', phone: '+91 97412 98765', vehicleNo: 'KA-51-AB-3344 (Eicher Pro Delivery)', deliveryAgentId: 'DLV-AGT-112' }
    ];

    const bills = [];

    // 1. Generate bills from Purchase Orders
    dealer.purchaseOrders.forEach((po, idx) => {
      const pIndex = idx % deliveryPersonnel.length;
      const dp = deliveryPersonnel[pIndex];
      const items = (po.items || []).map((it) => {
        const lineBase = it.quantity * it.purchasePrice;
        const gstRate = 0.12;
        const lineGst = lineBase * gstRate;
        return {
          id: it.id,
          medicineName: it.medicine?.name || 'Medicine',
          productId: it.medicine?.productId || 'MED',
          category: it.medicine?.category || 'General',
          dosageForm: it.medicine?.dosageForm || 'Tablet',
          manufacturer: it.medicine?.manufacturer || 'Pharma Ltd',
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          purchasePrice: it.purchasePrice,
          sellingPrice: it.sellingPrice || (it.purchasePrice * 1.5),
          mfgDate: it.mfgDate,
          expiryDate: it.expiryDate,
          hsnCode: '30049099',
          gstRate: 12,
          lineBase,
          lineGst,
          lineTotal: lineBase + lineGst
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineBase, 0);
      const totalGst = items.reduce((sum, item) => sum + item.lineGst, 0);
      const grandTotal = subtotal + totalGst;
      const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

      const billNumber = `DL-CHALLAN-${po.orderNumber.replace('PO-', '')}`;
      const consignmentId = `CNSG-${po.orderNumber.replace(/[^0-9]/g, '').slice(-5) || '99120'}`;
      const verificationCode = `VCODE-${po.id.slice(-6).toUpperCase()}`;

      bills.push({
        id: `bill-po-${po.id}`,
        sourceType: 'PURCHASE_ORDER',
        referenceId: po.id,
        orderNumber: po.orderNumber,
        billNumber,
        consignmentId,
        verificationCode,
        dispatchDate: po.orderDate,
        expectedDeliveryDate: new Date(new Date(po.orderDate).getTime() + 24 * 60 * 60 * 1000),
        status: po.status === 'RECEIVED' || po.status === 'COMPLETED' ? 'DELIVERED_VERIFIED' : (po.status === 'DISPATCHED' ? 'IN_TRANSIT' : 'PREPARING_DISPATCH'),
        dealer: {
          id: dealer.id,
          companyName: dealer.companyName,
          contactPerson: dealer.contactPerson,
          phone: dealer.phone,
          email: dealer.email,
          gstin: dealer.gstin,
          dlNumber: dealer.dlNumber,
          address: dealer.address
        },
        pharmacy: pharmacyData,
        deliveryPerson: dp,
        items,
        totalUnits,
        subtotal: Number(subtotal.toFixed(2)),
        cgst: Number((totalGst / 2).toFixed(2)),
        sgst: Number((totalGst / 2).toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        notes: po.notes || 'Dealer Delivery Challan & Consignment Stock Verification Bill'
      });
    });

    // 2. Generate bills from Direct Batch Supplies
    // Group batches by supply date (or chunk of 3-5)
    const directBatches = dealer.batches || [];
    if (directBatches.length > 0) {
      // Chunk batches into groups of 3 for distinct consignment bills
      const chunkSize = 3;
      for (let i = 0; i < directBatches.length; i += chunkSize) {
        const batchChunk = directBatches.slice(i, i + chunkSize);
        const pIndex = (i / chunkSize) % deliveryPersonnel.length;
        const dp = deliveryPersonnel[pIndex];
        const firstBatch = batchChunk[0];

        const items = batchChunk.map((b) => {
          const lineBase = b.initialQuantity * b.purchasePrice;
          const lineGst = lineBase * 0.12;
          return {
            id: b.id,
            medicineName: b.medicine?.name || 'Medicine',
            productId: b.medicine?.productId || 'MED',
            category: b.medicine?.category || 'General',
            dosageForm: b.medicine?.dosageForm || 'Tablet',
            manufacturer: b.medicine?.manufacturer || 'Pharma Ltd',
            batchNumber: b.batchNumber,
            quantity: b.initialQuantity,
            purchasePrice: b.purchasePrice,
            sellingPrice: b.sellingPrice,
            mfgDate: b.mfgDate,
            expiryDate: b.expiryDate,
            hsnCode: '30049099',
            gstRate: 12,
            lineBase,
            lineGst,
            lineTotal: lineBase + lineGst
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.lineBase, 0);
        const totalGst = items.reduce((sum, item) => sum + item.lineGst, 0);
        const grandTotal = subtotal + totalGst;
        const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

        const billIndex = String(Math.floor(i / chunkSize) + 1).padStart(3, '0');
        const billNumber = `DL-CHALLAN-2026-${billIndex}`;
        const consignmentId = `CNSG-DIR-${billIndex}`;
        const verificationCode = `VCODE-DIR-${firstBatch.id.slice(-6).toUpperCase()}`;

        bills.push({
          id: `bill-batch-${firstBatch.id}`,
          sourceType: 'DIRECT_SUPPLY',
          referenceId: firstBatch.id,
          orderNumber: `SUPPLY-DIR-${billIndex}`,
          billNumber,
          consignmentId,
          verificationCode,
          dispatchDate: firstBatch.receivedDate,
          expectedDeliveryDate: firstBatch.receivedDate,
          status: 'DELIVERED_VERIFIED',
          dealer: {
            id: dealer.id,
            companyName: dealer.companyName,
            contactPerson: dealer.contactPerson,
            phone: dealer.phone,
            email: dealer.email,
            gstin: dealer.gstin,
            dlNumber: dealer.dlNumber,
            address: dealer.address
          },
          pharmacy: pharmacyData,
          deliveryPerson: dp,
          items,
          totalUnits,
          subtotal: Number(subtotal.toFixed(2)),
          cgst: Number((totalGst / 2).toFixed(2)),
          sgst: Number((totalGst / 2).toFixed(2)),
          totalGst: Number(totalGst.toFixed(2)),
          grandTotal: Number(grandTotal.toFixed(2)),
          notes: 'Direct Dealer Stock Replenishment & Verified Delivery Challan'
        });
      }
    }

    res.json(bills);
  } catch (error) {
    console.error('Fetch dealer delivery bills error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery bills', details: error.message });
  }
});

module.exports = router;

