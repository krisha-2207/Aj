const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getExpiryStatus } = require('../utils/expiry');

// GET /api/medicines (All authenticated roles can view medicine catalog)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productId: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        batches: {
          include: {
            dealer: true
          },
          orderBy: {
            expiryDate: 'asc' // FEFO default
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Compute aggregated stock info for each medicine
    const result = medicines.map((med) => {
      let totalStock = 0;
      let totalSold = 0;
      let safeStock = 0;
      let expiringSoonStock = 0;
      let expiredStock = 0;

      const enrichedBatches = med.batches.map((batch) => {
        const expiryInfo = getExpiryStatus(batch.expiryDate);
        totalStock += batch.remainingQuantity;
        totalSold += batch.soldQuantity;

        if (expiryInfo.isExpired) {
          expiredStock += batch.remainingQuantity;
        } else if (expiryInfo.isExpiringSoon) {
          expiringSoonStock += batch.remainingQuantity;
        } else {
          safeStock += batch.remainingQuantity;
        }

        return {
          ...batch,
          expiryStatus: expiryInfo.status,
          expiryLabel: expiryInfo.label,
          expiryColor: expiryInfo.color,
          daysRemaining: expiryInfo.daysRemaining
        };
      });

      return {
        ...med,
        totalStock,
        totalSold,
        safeStock,
        expiringSoonStock,
        expiredStock,
        isLowStock: totalStock <= med.minStockLevel,
        batches: enrichedBatches
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines', details: error.message });
  }
});

// GET /api/medicines/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const med = await prisma.medicine.findUnique({
      where: { id: req.params.id },
      include: {
        batches: {
          include: { dealer: true },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    if (!med) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const enrichedBatches = med.batches.map((batch) => {
      const expiryInfo = getExpiryStatus(batch.expiryDate);
      return {
        ...batch,
        expiryStatus: expiryInfo.status,
        expiryLabel: expiryInfo.label,
        expiryColor: expiryInfo.color,
        daysRemaining: expiryInfo.daysRemaining
      };
    });

    res.json({ ...med, batches: enrichedBatches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medicine details', details: error.message });
  }
});

// POST /api/medicines (Owner only)
router.post('/', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const { productId, name, genericName, category, manufacturer, hsnCode, gstRate, unit, minStockLevel } = req.body;

    if (!productId || !name || !category || !manufacturer) {
      return res.status(400).json({ error: 'Product ID, name, category, and manufacturer are required' });
    }

    const existing = await prisma.medicine.findUnique({
      where: { productId: productId.trim().toUpperCase() }
    });

    if (existing) {
      return res.status(409).json({ error: `Product ID '${productId}' already exists.` });
    }

    const newMed = await prisma.medicine.create({
      data: {
        productId: productId.trim().toUpperCase(),
        name: name.trim(),
        genericName: genericName ? genericName.trim() : null,
        category: category.trim(),
        manufacturer: manufacturer.trim(),
        hsnCode: hsnCode ? hsnCode.trim() : '3004',
        gstRate: Number(gstRate) || 12.0,
        unit: unit ? unit.trim() : 'Strip',
        minStockLevel: Number(minStockLevel) || 15
      }
    });

    res.status(201).json(newMed);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ error: 'Failed to create medicine', details: error.message });
  }
});

// PUT /api/medicines/:id (Owner only)
router.put('/:id', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const { name, genericName, category, manufacturer, hsnCode, gstRate, unit, minStockLevel } = req.body;

    const updated = await prisma.medicine.update({
      where: { id: req.params.id },
      data: {
        name,
        genericName,
        category,
        manufacturer,
        hsnCode,
        gstRate: Number(gstRate),
        unit,
        minStockLevel: Number(minStockLevel)
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medicine', details: error.message });
  }
});

module.exports = router;
