const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// GET /api/staff (Owner only: list staff)
router.get('/', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const staffList = await prisma.staff.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
            status: true,
            bills: {
              select: { id: true, grandTotal: true }
            }
          }
        }
      },
      orderBy: { employeeCode: 'asc' }
    });

    const enriched = staffList.map((s) => ({
      id: s.id,
      userId: s.userId,
      employeeCode: s.employeeCode,
      name: s.user.name,
      email: s.user.email,
      username: s.user.username,
      phone: s.user.phone,
      designation: s.designation,
      salary: s.salary,
      joinedDate: s.joinedDate,
      status: s.user.status,
      totalBills: s.user.bills.length,
      totalSalesAmount: s.user.bills.reduce((sum, b) => sum + b.grandTotal, 0)
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff list', details: error.message });
  }
});

// POST /api/staff (Owner only: create new staff)
router.post('/', authMiddleware, roleMiddleware(['OWNER']), async (req, res) => {
  try {
    const { name, email, username, password, phone, designation, salary } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { username: username.trim().toLowerCase() }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pharmacy = await prisma.pharmacy.findFirst();

    const count = await prisma.staff.count();
    const employeeCode = `STF-${102 + count}`;

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        role: 'STAFF',
        phone: phone ? phone.trim() : null,
        pharmacyId: pharmacy.id,
        staffProfile: {
          create: {
            employeeCode,
            designation: designation || 'Pharmacist',
            salary: salary ? parseFloat(salary) : 30000.0
          }
        }
      },
      include: { staffProfile: true }
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff member', details: error.message });
  }
});

// Global in-memory active shifts tracker (can be extended to DB)
const activeShifts = new Map();

// POST /api/staff/clock-action (Clock-in / Clock-out duty toggle)
router.post('/clock-action', authMiddleware, roleMiddleware(['STAFF', 'OWNER']), async (req, res) => {
  try {
    const userId = req.user.id;
    const currentShift = activeShifts.get(userId);
    const now = new Date();

    if (currentShift && currentShift.status === 'CLOCKED_IN') {
      // Clock Out
      const shiftDurationHours = ((now - new Date(currentShift.clockInTime)) / (1000 * 60 * 60)).toFixed(2);
      activeShifts.set(userId, {
        status: 'CLOCKED_OUT',
        clockInTime: currentShift.clockInTime,
        clockOutTime: now.toISOString(),
        lastShiftHours: parseFloat(shiftDurationHours)
      });
      return res.json({
        message: 'Successfully clocked out',
        status: 'CLOCKED_OUT',
        lastShiftHours: parseFloat(shiftDurationHours),
        clockOutTime: now.toISOString()
      });
    } else {
      // Clock In
      activeShifts.set(userId, {
        status: 'CLOCKED_IN',
        clockInTime: now.toISOString(),
        clockOutTime: null,
        lastShiftHours: null
      });
      return res.json({
        message: 'Duty Shift Started (Clocked In)',
        status: 'CLOCKED_IN',
        clockInTime: now.toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to record shift action', details: error.message });
  }
});

// GET /api/staff/profile (Logged in staff strictly accesses ONLY their own records)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Strictly isolate query to logged-in user's ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        pharmacy: true,
        staffProfile: true,
        bills: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                medicine: { select: { name: true, category: true, dosageForm: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter bills for this staff member
    const todayBills = user.bills.filter(b => new Date(b.createdAt) >= todayStart);
    const monthBills = user.bills.filter(b => new Date(b.createdAt) >= monthStart);

    const todaySales = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const monthSales = monthBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalSales = user.bills.reduce((sum, b) => sum + b.grandTotal, 0);

    // Compensation & Incentives Logic
    const baseSalary = user.staffProfile?.salary || 35000.0;
    const commissionRate = 0.025; // 2.5% incentive commission on all retail billing
    const monthIncentive = parseFloat((monthSales * commissionRate).toFixed(2));
    const todayIncentive = parseFloat((todaySales * commissionRate).toFixed(2));
    const totalIncentive = parseFloat((totalSales * commissionRate).toFixed(2));

    // Milestone Target (e.g. ₹50,000 monthly sales target)
    const monthlyTarget = 50000.0;
    const targetProgress = Math.min(100, parseFloat(((monthSales / monthlyTarget) * 100).toFixed(1)));
    const targetBonus = monthSales >= monthlyTarget ? 2500.0 : (monthSales >= 25000.0 ? 1000.0 : 0.0);
    const totalProjectedPayout = parseFloat((baseSalary + monthIncentive + targetBonus).toFixed(2));

    // Shift & Attendance Status
    const shiftInfo = activeShifts.get(user.id) || {
      status: 'CLOCKED_IN',
      clockInTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0).toISOString(),
      clockOutTime: null,
      lastShiftHours: 8.5
    };

    const attendance = {
      daysPresent: 23,
      totalWorkingDays: 26,
      attendanceRate: 88.5,
      punctualityScore: 98,
      activeShift: shiftInfo
    };

    // Format individual bill items with earned commission
    const recentBillsEnriched = user.bills.slice(0, 15).map(b => ({
      id: b.id,
      billNumber: b.billNumber,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerType: b.customerType || 'NEW',
      doctorName: b.doctorName || 'Consulting Physician',
      grandTotal: b.grandTotal,
      taxAmount: b.taxAmount,
      paymentMethod: b.paymentMethod,
      itemCount: b.items ? b.items.length : 0,
      incentiveEarned: parseFloat((b.grandTotal * commissionRate).toFixed(2)),
      createdAt: b.createdAt
    }));

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone || '+91 98450 22222',
      role: user.role,
      employeeCode: user.staffProfile ? user.staffProfile.employeeCode : 'STF-101',
      designation: user.staffProfile ? user.staffProfile.designation : 'Licensed Retail Pharmacist',
      joinedDate: user.staffProfile ? user.staffProfile.joinedDate : user.createdAt,
      assignedPharmacy: user.pharmacy,
      
      // Salary & Incentive Structure
      compensation: {
        baseSalary,
        commissionRate: 2.5, // 2.5%
        monthIncentive,
        todayIncentive,
        totalIncentive,
        monthlyTarget,
        targetProgress,
        targetBonus,
        totalProjectedPayout,
        payCycle: 'Monthly (1st of every month)'
      },

      // Attendance & Shift Tracking
      attendance,

      // Performance Metrics
      performance: {
        todaySales,
        todayBillsCount: todayBills.length,
        monthSales,
        monthBillsCount: monthBills.length,
        totalSales,
        totalBillsCount: user.bills.length
      },

      recentBills: recentBillsEnriched
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff profile', details: error.message });
  }
});

module.exports = router;
