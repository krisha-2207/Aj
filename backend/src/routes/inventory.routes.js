const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getExpiryStatus } = require('../utils/expiry');

// GET /api/inventory (Available to Owner and Staff, each batch row returned separately)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, expiryStatus, stockStatus, sortBy = 'expiryDate', sortOrder = 'asc' } = req.query;

    const where = {};
    if (category && category !== 'ALL') {
      where.medicine = { category };
    }

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { medicine: { name: { contains: search, mode: 'insensitive' } } },
        { medicine: { productId: { contains: search, mode: 'insensitive' } } },
        { medicine: { genericName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const batches = await prisma.medicineBatch.findMany({
      where,
      include: {
        medicine: true,
        dealer: true
      },
      orderBy: sortBy === 'name' ? { medicine: { name: sortOrder } } : { [sortBy]: sortOrder }
    });

    // Enrich batches with dynamic status
    let enriched = batches.map((batch) => {
      const expiry = getExpiryStatus(batch.expiryDate);

      let currentStockStatus = 'IN_STOCK';
      if (batch.remainingQuantity <= 0) {
        currentStockStatus = 'OUT_OF_STOCK';
      } else if (batch.remainingQuantity <= batch.medicine.minStockLevel) {
        currentStockStatus = 'LOW_STOCK';
      }

      return {
        id: batch.id,
        batchNumber: batch.batchNumber,
        productId: batch.medicine.productId,
        medicineId: batch.medicine.id,
        medicineName: batch.medicine.name,
        genericName: batch.medicine.genericName,
        category: batch.medicine.category,
        manufacturer: batch.medicine.manufacturer,
        supplierName: batch.dealer ? batch.dealer.companyName : 'Direct / Local Supply',
        initialQuantity: batch.initialQuantity,
        soldQuantity: batch.soldQuantity,
        remainingQuantity: batch.remainingQuantity,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        receivedDate: batch.receivedDate,
        minStockLevel: batch.medicine.minStockLevel,
        stockStatus: currentStockStatus,
        expiryStatus: expiry.status,
        expiryLabel: expiry.label,
        expiryColor: expiry.color, // 'RED', 'GREEN', 'DARK_RED'
        daysRemaining: expiry.daysRemaining,
        isExpired: expiry.isExpired,
        isExpiringSoon: expiry.isExpiringSoon
      };
    });

    // Apply post-enrichment filters
    if (expiryStatus && expiryStatus !== 'ALL') {
      enriched = enriched.filter((b) => b.expiryStatus === expiryStatus);
    }

    if (stockStatus && stockStatus !== 'ALL') {
      enriched = enriched.filter((b) => b.stockStatus === stockStatus);
    }

    // Overall metrics summary
    const summary = {
      totalBatches: batches.length,
      safeBatches: batches.filter((b) => getExpiryStatus(b.expiryDate).status === 'SAFE').length,
      expiringSoonBatches: batches.filter((b) => getExpiryStatus(b.expiryDate).status === 'EXPIRING_SOON').length,
      expiredBatches: batches.filter((b) => getExpiryStatus(b.expiryDate).status === 'EXPIRED').length,
      lowStockBatches: batches.filter((b) => b.remainingQuantity > 0 && b.remainingQuantity <= b.medicine.minStockLevel).length,
      outOfStockBatches: batches.filter((b) => b.remainingQuantity <= 0).length
    };

    res.json({
      summary,
      batches: enriched
    });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// POST /api/inventory/batches (Add new batch)
router.post('/batches', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const {
      medicineId,
      batchNumber,
      dealerId,
      initialQuantity,
      purchasePrice,
      sellingPrice,
      mfgDate,
      expiryDate
    } = req.body;

    if (!medicineId || !batchNumber || !initialQuantity || !purchasePrice || !sellingPrice || !expiryDate) {
      return res.status(400).json({ error: 'Missing required batch fields' });
    }

    const qty = parseInt(initialQuantity, 10);
    if (qty <= 0) {
      return res.status(400).json({ error: 'Initial quantity must be greater than 0' });
    }

    const existingBatch = await prisma.medicineBatch.findUnique({
      where: {
        medicineId_batchNumber: {
          medicineId,
          batchNumber: batchNumber.trim().toUpperCase()
        }
      }
    });

    if (existingBatch) {
      return res.status(409).json({ error: `Batch number '${batchNumber}' already exists for this medicine.` });
    }

    const newBatch = await prisma.medicineBatch.create({
      data: {
        medicineId,
        batchNumber: batchNumber.trim().toUpperCase(),
        dealerId: dealerId || null,
        pharmacyId: req.user.pharmacyId,
        initialQuantity: qty,
        soldQuantity: 0,
        remainingQuantity: qty,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        mfgDate: new Date(mfgDate || Date.now()),
        expiryDate: new Date(expiryDate)
      },
      include: {
        medicine: true,
        dealer: true
      }
    });

    res.status(201).json(newBatch);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ error: 'Failed to create batch', details: error.message });
  }
});

module.exports = router;
