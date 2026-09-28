const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getExpiryStatus } = require('../utils/expiry');

// GET /api/dashboard/owner (Owner Dashboard)
router.get('/owner', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Fetch all required data concurrently
    const [
      allBills,
      todayBills,
      monthBills,
      batches,
      medicines,
      pendingPOs,
      staffCount,
      dealerCount,
      recentBills,
      salesReturns,
      purchaseReturns
    ] = await Promise.all([
      prisma.bill.findMany({
        select: { id: true, grandTotal: true, subtotal: true, taxAmount: true, paymentMethod: true, createdAt: true }
      }),
      prisma.bill.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        include: {
          items: {
            include: {
              medicine: true,
              batch: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.bill.findMany({
        where: { createdAt: { gte: monthStart } }
      }),
      prisma.medicineBatch.findMany({
        include: { medicine: true }
      }),
      prisma.medicine.findMany({ select: { id: true, name: true, category: true, minStockLevel: true } }),
      prisma.purchaseOrder.findMany({
        where: { status: { in: ['PENDING', 'APPROVED', 'DISPATCHED'] } }
      }),
      prisma.staff.count(),
      prisma.dealer.count(),
      prisma.bill.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { select: { name: true } }
        }
      }),
      prisma.salesReturn.findMany({
        orderBy: { returnDate: 'desc' }
      }),
      prisma.purchaseReturn.findMany({
        orderBy: { returnDate: 'desc' },
        include: { dealer: { select: { companyName: true, contactPerson: true } } }
      })
    ]);

    // KPI Metrics
    const todaySales = todayBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const monthlySales = monthBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalRevenue = allBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const stockValue = batches.reduce((sum, b) => sum + (b.remainingQuantity || 0) * (b.sellingPrice || 0), 0);

    // Today's Detailed Hourly Breakdown (06:00 to 23:00)
    const todayHourlySales = [];
    let peakHour = { time: 'None', timeRange: 'N/A', sales: 0, bills: 0 };
    let todayTotalUnits = 0;

    // Payment method breakdown for Today
    const todayPaymentBreakdown = {
      CASH: { amount: 0, count: 0 },
      UPI: { amount: 0, count: 0 },
      CARD: { amount: 0, count: 0 }
    };

    // Today's medicines map
    const todayMedicineMap = {};

    todayBills.forEach((b) => {
      const pMethod = (b.paymentMethod || 'CASH').toUpperCase();
      if (todayPaymentBreakdown[pMethod]) {
        todayPaymentBreakdown[pMethod].amount += b.grandTotal || 0;
        todayPaymentBreakdown[pMethod].count += 1;
      } else {
        todayPaymentBreakdown.CASH.amount += b.grandTotal || 0;
        todayPaymentBreakdown.CASH.count += 1;
      }

      // Aggregate items sold today
      if (b.items && b.items.length > 0) {
        b.items.forEach((item) => {
          const qty = item.quantity || 0;
          todayTotalUnits += qty;
          const medName = item.medicine?.name || 'Unknown Medicine';
          if (!todayMedicineMap[medName]) {
            todayMedicineMap[medName] = {
              name: medName,
              category: item.medicine?.category || 'TABLET',
              quantity: 0,
              revenue: 0
            };
          }
          todayMedicineMap[medName].quantity += qty;
          todayMedicineMap[medName].revenue += item.total || (qty * (item.unitPrice || 0));
        });
      }
    });

    for (let hour = 6; hour <= 23; hour++) {
      const displayHour = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      const nextHour = hour === 23 ? '12 AM' : hour + 1 < 12 ? `${hour + 1} AM` : hour + 1 === 12 ? '12 PM' : `${hour + 1 - 12} PM`;
      const timeRange = `${displayHour} - ${nextHour}`;

      const hourBills = todayBills.filter((b) => {
        const billDate = new Date(b.createdAt);
        return billDate.getHours() === hour;
      });

      const hourSales = hourBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
      const hourBillsCount = hourBills.length;
      const hourUnits = hourBills.reduce(
        (sum, b) => sum + (b.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0),
        0
      );

      const roundedSales = parseFloat(hourSales.toFixed(2));
      if (roundedSales > peakHour.sales) {
        peakHour = { time: displayHour, timeRange, sales: roundedSales, bills: hourBillsCount };
      }

      todayHourlySales.push({
        hour,
        time: displayHour,
        timeRange,
        sales: roundedSales,
        bills: hourBillsCount,
        items: hourUnits
      });
    }

    const todayTopMedicines = Object.values(todayMedicineMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // GST & Return Analytics
    const salesGst = allBills.reduce((sum, b) => sum + (b.taxAmount || 0), 0);
    const purchaseGst = batches.reduce(
      (sum, b) => sum + (b.purchasePrice * b.initialQuantity * (b.medicine?.gstRate || 12.0)) / 100,
      0
    );

    const salesReturnTotal = salesReturns.reduce((sum, sr) => sum + sr.refundAmount, 0);
    const salesReturnGst = salesReturns.reduce((sum, sr) => sum + (sr.gstRefund || 0), 0);
    const salesReturnCount = salesReturns.length;

    const purchaseReturnTotal = purchaseReturns.reduce((sum, pr) => sum + pr.refundAmount, 0);
    const purchaseReturnGst = purchaseReturns.reduce((sum, pr) => sum + (pr.gstReversal || 0), 0);
    const purchaseReturnCount = purchaseReturns.length;

    const netGstLiability = (salesGst - salesReturnGst) - (purchaseGst - purchaseReturnGst);

    let lowStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let safeCount = 0;
    const lowStockItems = [];
    const expiringSoonItems = [];

    batches.forEach((b) => {
      const exp = getExpiryStatus(b.expiryDate);
      if (exp.isExpired) expiredCount++;
      else if (exp.isExpiringSoon) expiringSoonCount++;
      else safeCount++;

      if (b.remainingQuantity <= b.medicine.minStockLevel) {
        lowStockCount++;
        if (lowStockItems.length < 10) {
          lowStockItems.push({
            id: b.id,
            medicineId: b.medicine.id,
            medicineName: b.medicine.name,
            productId: b.medicine.productId,
            batchNumber: b.batchNumber,
            minStockLevel: b.medicine.minStockLevel,
            remainingQuantity: b.remainingQuantity
          });
        }
      }

      if (exp.isExpiringSoon || exp.isExpired) {
        if (expiringSoonItems.length < 10) {
          expiringSoonItems.push({
            id: b.id,
            medicineId: b.medicine.id,
            medicineName: b.medicine.name,
            productId: b.medicine.productId,
            batchNumber: b.batchNumber,
            remainingQuantity: b.remainingQuantity,
            expiryDate: b.expiryDate,
            expiryLabel: exp.label,
            expiryColor: exp.color,
            isExpired: exp.isExpired
          });
        }
      }
    });

    const pendingPOsCount = pendingPOs.length;
    const outstandingSupplierAmount = pendingPOs.reduce((sum, po) => sum + po.totalAmount, 0);

    // Sales Trend (Last 7 Days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayBills = allBills.filter((b) => {
        const bd = new Date(b.createdAt);
        return bd >= dayStart && bd <= dayEnd;
      });
      const dayTotal = dayBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

      salesTrend.push({
        date: dayStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: dayStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        sales: parseFloat(dayTotal.toFixed(2)),
        bills: dayBills.length
      });
    }

    // Sales Trend (Last 30 Days)
    const salesTrend30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayBills = allBills.filter((b) => {
        const bd = new Date(b.createdAt);
        return bd >= dayStart && bd <= dayEnd;
      });
      const dayTotal = dayBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

      salesTrend30Days.push({
        date: dayStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: dayStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        sales: parseFloat(dayTotal.toFixed(2)),
        bills: dayBills.length
      });
    }

    // Top Selling Medicines (from all bill items)
    const billItems = await prisma.billItem.findMany({
      include: { medicine: true }
    });

    const medicineSalesMap = {};
    billItems.forEach((item) => {
      const name = item.medicine?.name || 'Unknown';
      const pid = item.medicine?.productId || 'MED';
      if (!medicineSalesMap[name]) {
        medicineSalesMap[name] = { name, productId: pid, quantity: 0, revenue: 0 };
      }
      medicineSalesMap[name].quantity += item.quantity || 0;
      medicineSalesMap[name].revenue += item.total || 0;
    });

    const topSellingMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topMedicines = topSellingMedicines.map((t) => ({
      name: t.name,
      productId: t.productId || 'MED',
      totalSold: t.quantity,
      revenue: t.revenue
    }));

    // Inventory Status breakdown
    const inventoryStatus = [
      { name: 'Safe Stock', count: safeCount, color: '#10b981' },
      { name: 'Expiring Soon (≤2 mo)', count: expiringSoonCount, color: '#f43f5e' },
      { name: 'Expired', count: expiredCount, color: '#991b1b' },
      { name: 'Low Stock', count: lowStockCount, color: '#f59e0b' }
    ];

    // Category Distribution
    const categoryMap = {};
    medicines.forEach((m) => {
      categoryMap[m.category] = (categoryMap[m.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count
    }));

    const formattedRecentBills = recentBills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerType: b.customerType || 'EXISTING',
      customerAddress: b.customerAddress || null,
      doctorName: b.doctorName || 'Dr. Self / Consulting Physician',
      staffName: b.staff?.name || 'Pharmacist Staff',
      paymentMethod: b.paymentMethod,
      grandTotal: b.grandTotal,
      date: b.createdAt
    }));

    res.json({
      kpis: {
        todaySales,
        todayBillsCount: todayBills.length,
        todayUnitsSold: todayTotalUnits,
        todayAverageBill: todayBills.length > 0 ? todaySales / todayBills.length : 0,
        todayPeakHour: peakHour,
        monthlySales,
        totalRevenue,
        stockValue,
        lowStockCount,
        expiringSoonCount,
        expiredCount,
        pendingPOsCount,
        outstandingSupplierAmount,
        totalMedicines: medicines.length,
        totalStaff: staffCount,
        totalDealers: dealerCount,
        purchaseGst,
        salesGst,
        purchaseReturnTotal,
        purchaseReturnGst,
        purchaseReturnCount,
        salesReturnTotal,
        salesReturnGst,
        salesReturnCount,
        netGstLiability
      },
      todaySalesAnalytics: {
        hourlySales: todayHourlySales,
        paymentMethods: todayPaymentBreakdown,
        topMedicinesSoldToday: todayTopMedicines,
        totalSales: todaySales,
        totalBills: todayBills.length,
        totalUnits: todayTotalUnits,
        peakHour
      },
      salesTrend,
      salesTrend30Days,
      todayHourlySales,
      topMedicines,
      lowStockItems,
      expiringSoonItems,
      recentBills: formattedRecentBills,
      recentTransactions: formattedRecentBills,
      pendingOrders: pendingPOs,
      charts: {
        todayHourlySales,
        salesTrend,
        salesTrend30Days,
        todayPaymentBreakdown,
        todayTopMedicines,
        topSellingMedicines,
        inventoryStatus,
        categoryDistribution,
        gstComparison: [
          { name: 'Sales GST (Output)', amount: salesGst, color: '#10b981' },
          { name: 'Purchase GST (Input)', amount: purchaseGst, color: '#3b82f6' },
          { name: 'Sales Return GST', amount: salesReturnGst, color: '#f43f5e' },
          { name: 'Purchase Return GST', amount: purchaseReturnGst, color: '#f59e0b' }
        ],
        returnsComparison: [
          { name: 'Sales Returns (Refunds)', value: salesReturnTotal, count: salesReturnCount, color: '#f43f5e' },
          { name: 'Purchase Returns (Credits)', value: purchaseReturnTotal, count: purchaseReturnCount, color: '#6366f1' }
        ]
      },
      salesReturns,
      purchaseReturns
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch owner dashboard data', details: error.message });
  }
});

// GET /api/dashboard/staff (Staff Dashboard - Strictly No confidential accounts/profit)
router.get('/staff', authMiddleware, roleMiddleware(['STAFF', 'OWNER']), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayBills, myRecentBills, batches, frequentlySold] = await Promise.all([
      prisma.bill.findMany({
        where: {
          staffId: req.user.id,
          createdAt: { gte: todayStart }
        },
        include: { items: true }
      }),
      prisma.bill.findMany({
        where: { staffId: req.user.id },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { medicine: true } } }
      }),
      prisma.medicineBatch.findMany({
        include: { medicine: true }
      }),
      prisma.billItem.groupBy({
        by: ['medicineId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6
      })
    ]);

    const todaySales = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const todayBillsCount = todayBills.length;
    const medicinesSold = todayBills.reduce(
      (sum, b) => sum + b.items.reduce((s, it) => s + (it.quantity || 0), 0),
      0
    );

    let lowStockCount = 0;
    let expiringSoonCount = 0;
    const lowStockAlerts = [];
    const expiryAlerts = [];

    batches.forEach((b) => {
      const exp = getExpiryStatus(b.expiryDate);
      if (exp.isExpiringSoon || exp.isExpired) {
        expiringSoonCount++;
        if (expiryAlerts.length < 5) {
          expiryAlerts.push({
            id: b.id,
            medicineName: b.medicine.name,
            batchNumber: b.batchNumber,
            remainingQuantity: b.remainingQuantity,
            expiryDate: b.expiryDate,
            expiryLabel: exp.label,
            expiryColor: exp.color,
            isExpired: exp.isExpired
          });
        }
      }

      if (b.remainingQuantity <= b.medicine.minStockLevel && b.remainingQuantity > 0) {
        lowStockCount++;
        if (lowStockAlerts.length < 5) {
          lowStockAlerts.push({
            id: b.id,
            medicineName: b.medicine.name,
            batchNumber: b.batchNumber,
            remainingQuantity: b.remainingQuantity,
            minStockLevel: b.medicine.minStockLevel
          });
        }
      }
    });

    // Populate frequently sold names
    const frequentMedicines = await Promise.all(
      frequentlySold.map(async (f) => {
        const med = await prisma.medicine.findUnique({
          where: { id: f.medicineId },
          select: { id: true, name: true, category: true, productId: true }
        });
        return {
          ...med,
          totalSold: f._sum.quantity
        };
      })
    );

    res.json({
      kpis: {
        todaySales,
        todayBillsCount,
        medicinesSold,
        lowStockCount,
        expiringSoonCount
      },
      lowStockAlerts,
      expiryAlerts,
      frequentMedicines: frequentMedicines.filter(Boolean),
      recentBills: myRecentBills
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch staff dashboard data', details: error.message });
  }
});

// GET /api/dashboard/dealer (Dealer Dashboard)
router.get('/dealer', authMiddleware, roleMiddleware(['DEALER']), async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { userId: req.user.id },
      include: {
        batches: { include: { medicine: true } },
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          take: 8,
          include: { items: { include: { medicine: true } } }
        }
      }
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    const [allOrders, allMedicines] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { dealerId: dealer.id }
      }),
      prisma.medicine.findMany({
        include: { batches: true }
      })
    ]);

    // Active requirements (low stock or out of stock in pharmacy)
    const newRequirements = [];
    allMedicines.forEach((med) => {
      const stock = med.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      if (stock <= med.minStockLevel) {
        newRequirements.push({
          id: `REQ-${med.productId}`,
          medicineId: med.id,
          productId: med.productId,
          medicineName: med.name,
          category: med.category,
          currentStock: stock,
          minStockLevel: med.minStockLevel,
          requiredQuantity: Math.max(50, (med.minStockLevel * 4) - stock),
          isOutOfStock: stock === 0
        });
      }
    });

    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length;
    const confirmedOrders = allOrders.filter((o) => o.status === 'APPROVED').length;
    const dispatchedOrders = allOrders.filter((o) => o.status === 'DISPATCHED').length;
    const completedOrders = allOrders.filter((o) => o.status === 'RECEIVED' || o.status === 'COMPLETED').length;

    const totalSuppliedItems = dealer.batches.reduce((sum, b) => sum + b.initialQuantity, 0);

    res.json({
      kpis: {
        newRequirementsCount: newRequirements.length,
        pendingOrders,
        confirmedOrders,
        dispatchedOrders,
        completedOrders,
        totalSuppliedItems,
        totalBatches: dealer.batches.length
      },
      newRequirements: newRequirements.slice(0, 6),
      recentOrders: dealer.purchaseOrders,
      suppliedBatches: dealer.batches.slice(0, 6).map((b) => ({
        id: b.id,
        medicineName: b.medicine.name,
        productId: b.medicine.productId,
        batchNumber: b.batchNumber,
        initialQuantity: b.initialQuantity,
        remainingQuantity: b.remainingQuantity,
        supplyDate: b.receivedDate
      }))
    });
  } catch (error) {
    console.error('Dealer dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dealer dashboard data', details: error.message });
  }
});

module.exports = router;
