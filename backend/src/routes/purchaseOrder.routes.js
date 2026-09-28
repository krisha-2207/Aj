const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// GET /api/purchase-orders (Owner sees all, Dealer sees only theirs)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'DEALER') {
      const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
      if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });
      where.dealerId = dealer.id;
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        dealer: true,
        pharmacy: true,
        items: {
          include: { medicine: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Fetch PO error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders', details: error.message });
  }
});

// POST /api/purchase-orders (Create PO)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dealerId, notes, items } = req.body;

    if (!dealerId || !items || !items.length) {
      return res.status(400).json({ error: 'Dealer ID and order items are required' });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${currentYear}-${String(count + 101).padStart(4, '0')}`;

    let totalAmount = 0;
    const itemsData = items.map((it) => {
      const pPrice = parseFloat(it.purchasePrice);
      const qty = parseInt(it.quantity, 10);
      totalAmount += pPrice * qty;
      return {
        medicineId: it.medicineId,
        batchNumber: it.batchNumber.trim().toUpperCase(),
        quantity: qty,
        purchasePrice: pPrice,
        sellingPrice: parseFloat(it.sellingPrice),
        mfgDate: new Date(it.mfgDate || Date.now()),
        expiryDate: new Date(it.expiryDate)
      };
    });

    const pharmacy = await prisma.pharmacy.findFirst();

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        dealerId,
        pharmacyId: pharmacy.id,
        status: 'PENDING',
        totalAmount,
        notes,
        items: {
          create: itemsData
        }
      },
      include: {
        dealer: true,
        items: { include: { medicine: true } }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create PO error:', error);
    res.status(500).json({ error: 'Failed to create purchase order', details: error.message });
  }
});

// PATCH /api/purchase-orders/:id/status
// CRITICAL: When marked 'RECEIVED', automatically creates/updates batches in pharmacy inventory!
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'COMPLETED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { medicine: true } },
        dealer: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Role restrictions: Dealers can update to DISPATCHED; Owner can mark APPROVED, RECEIVED, COMPLETED
    if (req.user.role === 'DEALER' && status !== 'DISPATCHED') {
      return res.status(403).json({ error: 'Dealers can only update status to DISPATCHED' });
    }

    const wasAlreadyReceived = order.status === 'RECEIVED' || order.status === 'COMPLETED';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: {
          status,
          receivedDate: status === 'RECEIVED' ? new Date() : order.receivedDate
        }
      });

      // If transition is to RECEIVED and was not already processed, update/create batch inventory!
      if (status === 'RECEIVED' && !wasAlreadyReceived) {
        for (const item of order.items) {
          const existingBatch = await tx.medicineBatch.findUnique({
            where: {
              medicineId_batchNumber: {
                medicineId: item.medicineId,
                batchNumber: item.batchNumber
              }
            }
          });

          if (existingBatch) {
            await tx.medicineBatch.update({
              where: { id: existingBatch.id },
              data: {
                initialQuantity: { increment: item.quantity },
                remainingQuantity: { increment: item.quantity },
                purchasePrice: item.purchasePrice,
                sellingPrice: item.sellingPrice,
                expiryDate: item.expiryDate
              }
            });
          } else {
            await tx.medicineBatch.create({
              data: {
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
                dealerId: order.dealerId,
                pharmacyId: order.pharmacyId,
                initialQuantity: item.quantity,
                soldQuantity: 0,
                remainingQuantity: item.quantity,
                purchasePrice: item.purchasePrice,
                sellingPrice: item.sellingPrice,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                receivedDate: new Date()
              }
            });
          }
        }
      }

      return updated;
    });

    res.json({
      message:
        status === 'RECEIVED'
          ? 'Order marked as RECEIVED. All items have been automatically added to the Pharmacy Inventory.'
          : `Order status updated to ${status}.`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update PO status error:', error);
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// GET /api/purchase-orders/returns (Fetch Purchase Returns)
router.get('/returns/purchase', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'DEALER') {
      const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
      if (dealer) where.dealerId = dealer.id;
    }

    const returns = await prisma.purchaseReturn.findMany({
      where,
      orderBy: { returnDate: 'desc' },
      include: {
        dealer: { select: { companyName: true, contactPerson: true, phone: true } }
      }
    });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase returns', details: error.message });
  }
});

// POST /api/purchase-orders/returns (Process Purchase Return to Supplier)
router.post('/returns/purchase', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const { dealerId, medicineName, batchNumber, quantity, refundAmount, gstReversal, reason } = req.body;

    if (!dealerId || !medicineName || !quantity || !refundAmount || !reason) {
      return res.status(400).json({ error: 'Dealer ID, medicine, quantity, refund amount, and reason are required' });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.purchaseReturn.count();
    const returnNumber = `PR-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const newReturn = await prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          dealerId,
          medicineName: medicineName.trim(),
          batchNumber: batchNumber ? batchNumber.trim() : 'BATCH-PR',
          quantity: parseInt(quantity, 10),
          refundAmount: parseFloat(refundAmount),
          gstReversal: parseFloat(gstReversal || 0),
          reason: reason.trim(),
          status: 'PROCESSED'
        }
      });

      // Deduct inventory batch stock if batchNumber exists
      if (batchNumber) {
        const batch = await tx.medicineBatch.findFirst({
          where: { batchNumber: batchNumber.trim() }
        });
        if (batch) {
          const qty = parseInt(quantity, 10);
          await tx.medicineBatch.update({
            where: { id: batch.id },
            data: {
              remainingQuantity: { decrement: Math.min(batch.remainingQuantity, qty) }
            }
          });
        }
      }

      return pr;
    });

    res.status(201).json({ message: 'Purchase return created successfully', return: newReturn });
  } catch (error) {
    console.error('Purchase return error:', error);
    res.status(500).json({ error: 'Failed to process purchase return', details: error.message });
  }
});

module.exports = router;
