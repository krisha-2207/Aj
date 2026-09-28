const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ALL endpoints here are strictly OWNER ONLY
router.use(authMiddleware, roleMiddleware(['OWNER']));

// GET /api/accounts/summary
router.get('/summary', async (req, res) => {
  try {
    const bills = await prisma.bill.findMany();
    const expenses = await prisma.expense.findMany();
    const batches = await prisma.medicineBatch.findMany();
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        OR: [{ status: 'RECEIVED' }, { status: 'COMPLETED' }]
      }
    });

    const totalSalesRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchaseCost = batches.reduce((sum, b) => sum + b.purchasePrice * b.initialQuantity, 0);
    const costOfGoodsSold = batches.reduce((sum, b) => sum + b.purchasePrice * b.soldQuantity, 0);

    const grossProfit = totalSalesRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalOperatingExpenses;

    // Payment methods split
    const paymentMethods = {
      CASH: bills.filter((b) => b.paymentMethod === 'CASH').reduce((sum, b) => sum + b.grandTotal, 0),
      UPI: bills.filter((b) => b.paymentMethod === 'UPI').reduce((sum, b) => sum + b.grandTotal, 0),
      CARD: bills.filter((b) => b.paymentMethod === 'CARD').reduce((sum, b) => sum + b.grandTotal, 0)
    };

    // Category-wise expenses
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    res.json({
      totalSalesRevenue,
      totalPurchaseCost,
      costOfGoodsSold,
      totalOperatingExpenses,
      grossProfit,
      netProfit,
      totalBillsCount: bills.length,
      paymentMethods,
      expensesByCategory
    });
  } catch (error) {
    console.error('Accounts summary error:', error);
    res.status(500).json({ error: 'Failed to fetch financial accounts summary', details: error.message });
  }
});

// GET /api/accounts/expenses
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
  }
});

// POST /api/accounts/expenses
router.post('/expenses', async (req, res) => {
  try {
    const { category, title, amount, paymentMethod = 'CASH', date, notes } = req.body;

    if (!category || !title || !amount) {
      return res.status(400).json({ error: 'Category, title, and amount are required' });
    }

    const pharmacy = await prisma.pharmacy.findFirst();

    const expense = await prisma.expense.create({
      data: {
        pharmacyId: pharmacy.id,
        category: category.trim(),
        title: title.trim(),
        amount: parseFloat(amount),
        paymentMethod,
        date: date ? new Date(date) : new Date(),
        notes: notes ? notes.trim() : null
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense', details: error.message });
  }
});

// GET /api/accounts/transactions (Combined ledger)
router.get('/transactions', async (req, res) => {
  try {
    const [bills, expenses] = await Promise.all([
      prisma.bill.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.expense.findMany({
        take: 50,
        orderBy: { date: 'desc' }
      })
    ]);

    const salesTx = bills.map((b) => ({
      id: b.id,
      date: b.createdAt,
      type: 'INCOME',
      category: 'Customer Sale',
      reference: b.billNumber,
      description: `Bill generated for ${b.customerName}`,
      amount: b.grandTotal,
      paymentMethod: b.paymentMethod
    }));

    const expenseTx = expenses.map((e) => ({
      id: e.id,
      date: e.date,
      type: 'EXPENSE',
      category: e.category,
      reference: 'EXP-' + e.id.slice(0, 6).toUpperCase(),
      description: e.title,
      amount: -e.amount,
      paymentMethod: e.paymentMethod
    }));

    const combined = [...salesTx, ...expenseTx].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction ledger', details: error.message });
  }
});

module.exports = router;
