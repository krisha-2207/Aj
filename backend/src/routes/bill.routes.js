const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware } = require('../middleware/auth');
const { getExpiryStatus } = require('../utils/expiry');

// GET /api/bills
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Staff can only see their own bills; Owner can see all
    if (req.user.role === 'STAFF') {
      where.staffId = req.user.id;
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } }
      ];
    }

    if (date) {
      const targetDate = new Date(date);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      where.createdAt = { gte: start, lte: end };
    }

    const [total, bills] = await Promise.all([
      prisma.bill.count({ where }),
      prisma.bill.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: true,
          staff: { select: { id: true, name: true, username: true } },
          items: {
            include: {
              medicine: true,
              batch: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      bills
    });
  } catch (error) {
    console.error('Fetch bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills', details: error.message });
  }
});

// GET /api/bills/customers (Search / List Registered Customers)
router.get('/customers', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { customerCode: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } }
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 25,
      select: {
        id: true,
        customerCode: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        age: true,
        gender: true,
        customerType: true,
        totalVisits: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
});

// GET /api/bills/customers/by-phone/:phone (Direct Phone Lookup Workflow)
router.get('/customers/by-phone/:phone', authMiddleware, async (req, res) => {
  try {
    const rawPhone = (req.params.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 5) {
      return res.status(400).json({ error: 'Valid phone number is required for lookup' });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: rawPhone },
          { phone: cleanPhone },
          { phone: { endsWith: cleanPhone.slice(-10) } }
        ]
      },
      include: {
        bills: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            billNumber: true,
            grandTotal: true,
            createdAt: true,
            paymentMethod: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ found: false, message: 'New customer: phone not found' });
    }

    res.json({ found: true, customer });
  } catch (error) {
    console.error('Customer phone lookup error:', error);
    res.status(500).json({ error: 'Lookup failed', details: error.message });
  }
});

// POST /api/bills/customers (Register / Save New Customer directly during billing)
router.post('/customers', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, age, gender } = req.body;

    if (!name || !name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ error: 'Customer Name and Phone Number are required' });
    }

    const cleanPhone = phone.trim();

    // Check if customer phone already exists (duplicate prevention)
    let existing = await prisma.customer.findUnique({
      where: { phone: cleanPhone }
    });

    if (existing) {
      // Update details if provided
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          email: email ? email.trim() : existing.email,
          address: address ? address.trim() : existing.address,
          age: age ? parseInt(age, 10) : existing.age,
          gender: gender ? gender.trim() : existing.gender
        }
      });
      return res.json({ message: 'Customer already exists. Profile updated.', customer: updated, isNew: false });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.customer.count();
    const customerCode = `CUST-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const newCustomer = await prisma.customer.create({
      data: {
        customerCode,
        name: name.trim(),
        phone: cleanPhone,
        email: email && email.trim() ? email.trim() : null,
        address: address && address.trim() ? address.trim() : null,
        age: age ? parseInt(age, 10) : null,
        gender: gender && gender.trim() ? gender.trim() : null,
        customerType: 'NEW',
        totalVisits: 0,
        totalSpent: 0.0
      }
    });

    res.status(201).json({ message: 'Customer saved successfully', customer: newCustomer, isNew: true });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
});

// GET /api/bills/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: {
        pharmacy: true,
        staff: { select: { id: true, name: true, email: true, phone: true } },
        customer: true,
        items: {
          include: {
            medicine: true,
            batch: true
          }
        }
      }
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Role check: Staff cannot view other staff's bills unless Owner
    if (req.user.role === 'STAFF' && bill.staffId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view bills generated by yourself' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bill details', details: error.message });
  }
});

// POST /api/bills (Generate Bill - Owner and Staff)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerAge,
      customerGender,
      customerType = 'NEW', // 'NEW' or 'EXISTING'
      doctorName = 'Dr. Self / Consulting Physician',
      paymentMethod = 'CASH',
      discount = 0,
      items // Array of { medicineId, batchId, quantity, unitPrice, gstRate, doctorName, usageInstructions }
    } = req.body;

    if (!customerName || !customerPhone || !items || !items.length) {
      return res.status(400).json({ error: 'Customer name, phone, and at least one item are required' });
    }

    // Execute atomic transaction for stock verification and deduction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check all batches first
      let subtotal = 0;
      let taxAmount = 0;

      const validatedItems = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (qty <= 0) {
          throw new Error(`Invalid quantity (${qty}) for item.`);
        }

        const batch = await tx.medicineBatch.findUnique({
          where: { id: item.batchId },
          include: { medicine: true }
        });

        if (!batch) {
          throw new Error(`Batch not found for product ID ${item.medicineId}`);
        }

        // Check expiry status
        const expiry = getExpiryStatus(batch.expiryDate);
        if (expiry.isExpired) {
          throw new Error(
            `Cannot sell expired medicine! Medicine: '${batch.medicine.name}', Batch: '${batch.batchNumber}' expired on ${new Date(
              batch.expiryDate
            ).toLocaleDateString('en-IN')}.`
          );
        }

        // Check stock availability
        if (batch.remainingQuantity < qty) {
          throw new Error(
            `Insufficient stock for '${batch.medicine.name}' (Batch: ${batch.batchNumber}). Requested: ${qty}, Available: ${batch.remainingQuantity}.`
          );
        }

        const unitPrice = parseFloat(item.unitPrice || batch.sellingPrice);
        const gstRate = parseFloat(item.gstRate !== undefined ? item.gstRate : batch.medicine.gstRate);
        const itemSubtotal = unitPrice * qty;
        const itemTax = (itemSubtotal * gstRate) / 100;

        subtotal += itemSubtotal;
        taxAmount += itemTax;

        validatedItems.push({
          batch,
          qty,
          unitPrice,
          gstRate,
          doctorName: (item.doctorName || doctorName || 'Dr. Self / Consulting Physician').trim(),
          usageInstructions: item.usageInstructions || batch.medicine.dosageUsage || null,
          total: itemSubtotal + itemTax
        });
      }

      const numDiscount = parseFloat(discount) || 0;
      const grandTotal = Math.max(0, subtotal + taxAmount - numDiscount);

      // 2. Generate unique Bill Number (Format: INV-YYYY-XXXX)
      const currentYear = new Date().getFullYear();
      const countThisYear = await tx.bill.count({
        where: {
          billNumber: { startsWith: `INV-${currentYear}` }
        }
      });
      const nextSequence = String(countThisYear + 1).padStart(4, '0');
      const billNumber = `INV-${currentYear}-${nextSequence}`;

      // 3. Find or Create Customer
      let customer = await tx.customer.findUnique({
        where: { phone: customerPhone.trim() }
      });

      const parsedAge = customerAge ? parseInt(customerAge, 10) : null;
      const cleanAddress = customerAddress ? customerAddress.trim() : null;
      const cleanGender = customerGender ? customerGender.trim() : null;
      const cleanEmail = customerEmail ? customerEmail.trim() : null;

      // Determine customerType: respect client selection or check if already registered
      let finalCustomerType = customerType ? customerType.trim().toUpperCase() : (customer ? 'EXISTING' : 'NEW');

      if (!customer) {
        const totalCustomers = await tx.customer.count();
        const customerCode = `CUST-${currentYear}-${String(totalCustomers + 1).padStart(4, '0')}`;
        customer = await tx.customer.create({
          data: {
            customerCode,
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: cleanEmail,
            address: cleanAddress,
            age: parsedAge,
            gender: cleanGender,
            customerType: 'NEW',
            totalVisits: 1,
            totalSpent: grandTotal
          }
        });
        finalCustomerType = 'NEW';
      } else {
        // Customer already exists in pharmacy registry
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName.trim(),
            email: cleanEmail || customer.email,
            address: cleanAddress || customer.address,
            age: parsedAge || customer.age,
            gender: cleanGender || customer.gender,
            customerType: 'EXISTING',
            totalVisits: { increment: 1 },
            totalSpent: { increment: grandTotal }
          }
        });
        finalCustomerType = 'EXISTING';
      }

      // 4. Create the Bill
      const bill = await tx.bill.create({
        data: {
          billNumber,
          pharmacyId: req.user.pharmacyId,
          staffId: req.user.id,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerType: finalCustomerType,
          customerAddress: cleanAddress || customer.address,
          customerAge: parsedAge || customer.age,
          customerGender: cleanGender || customer.gender,
          doctorName: (doctorName && doctorName.trim()) || 'Dr. Self / Consulting Physician',
          paymentMethod,
          subtotal,
          discount: numDiscount,
          taxAmount,
          grandTotal
        }
      });

      // 5. Create Bill Items and Atomically Deduct Stock
      for (const vItem of validatedItems) {
        await tx.billItem.create({
          data: {
            billId: bill.id,
            medicineId: vItem.batch.medicineId,
            batchId: vItem.batch.id,
            quantity: vItem.qty,
            unitPrice: vItem.unitPrice,
            gstRate: vItem.gstRate,
            doctorName: vItem.doctorName,
            customerType: finalCustomerType,
            usageInstructions: vItem.usageInstructions,
            total: vItem.total
          }
        });

        // Decrement remainingQuantity and increment soldQuantity
        await tx.medicineBatch.update({
          where: { id: vItem.batch.id },
          data: {
            remainingQuantity: { decrement: vItem.qty },
            soldQuantity: { increment: vItem.qty }
          }
        });
      }

      return bill;
    });

    // Fetch full bill for printable invoice response
    const completeBill = await prisma.bill.findUnique({
      where: { id: result.id },
      include: {
        pharmacy: true,
        staff: { select: { id: true, name: true, username: true } },
        items: {
          include: {
            medicine: true,
            batch: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Bill generated successfully and batch stock updated',
      ...completeBill,
      bill: completeBill
    });
  } catch (error) {
    console.error('Billing error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/bills/returns/sales (Get Sales Returns History)
router.get('/returns/sales', authMiddleware, async (req, res) => {
  try {
    const returns = await prisma.salesReturn.findMany({
      orderBy: { returnDate: 'desc' },
      include: {
        bill: { select: { billNumber: true, createdAt: true, customerName: true, customerPhone: true } }
      }
    });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales returns', details: error.message });
  }
});

// POST /api/bills/returns/sales (Create Sales Return & Restock Inventory)
router.post('/returns/sales', authMiddleware, async (req, res) => {
  try {
    const {
      billId,
      customerName,
      customerPhone,
      doctorName,
      medicineName,
      batchNumber,
      quantity,
      refundAmount,
      gstRefund,
      reason,
      items // Optional array of items to return in batch
    } = req.body;

    if (!customerName || (!medicineName && (!items || !items.length))) {
      return res.status(400).json({ error: 'Customer name and items to return are required.' });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.salesReturn.count();

    const returnItems = items && items.length > 0 ? items : [
      {
        medicineName: medicineName?.trim(),
        batchNumber: batchNumber?.trim() || 'BATCH-RET',
        quantity: parseInt(quantity, 10),
        refundAmount: parseFloat(refundAmount),
        gstRefund: parseFloat(gstRefund || 0),
        reason: (reason || 'Mistakenly bought by customer').trim()
      }
    ];

    const createdReturns = [];

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < returnItems.length; i++) {
        const item = returnItems[i];
        const returnNumber = `SR-${currentYear}-${String(count + i + 1).padStart(4, '0')}`;
        const qty = parseInt(item.quantity, 10);
        const refund = parseFloat(item.refundAmount);
        const gst = parseFloat(item.gstRefund || 0);

        const sr = await tx.salesReturn.create({
          data: {
            returnNumber,
            billId: billId || null,
            customerName: customerName.trim(),
            customerPhone: customerPhone ? customerPhone.trim() : null,
            doctorName: doctorName ? doctorName.trim() : 'Dr. Self / Consulting Physician',
            medicineName: item.medicineName.trim(),
            batchNumber: item.batchNumber ? item.batchNumber.trim() : 'BATCH-RET',
            quantity: qty,
            refundAmount: refund,
            gstRefund: gst,
            reason: item.reason ? item.reason.trim() : (reason || 'Mistakenly bought by customer').trim()
          }
        });

        // Replenish batch quantity back into inventory
        if (item.batchNumber) {
          const batch = await tx.medicineBatch.findFirst({
            where: { batchNumber: item.batchNumber.trim() }
          });
          if (batch) {
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: {
                remainingQuantity: { increment: qty },
                soldQuantity: { decrement: Math.min(batch.soldQuantity, qty) }
              }
            });
          }
        }

        createdReturns.push(sr);
      }
    });

    res.status(201).json({
      message: `Sales return processed successfully for ${createdReturns.length} item(s). Inventory stock restored.`,
      returns: createdReturns,
      return: createdReturns[0]
    });
  } catch (error) {
    console.error('Sales return error:', error);
    res.status(500).json({ error: 'Failed to process sales return', details: error.message });
  }
});

module.exports = router;
