import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import InvoiceModal from '../../components/InvoiceModal';
import {
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  Clock,
  ShoppingCart,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [graphViewMode, setGraphViewMode] = useState('TODAY_HOURLY'); // 'TODAY_HOURLY' | '7_DAY' | '30_DAY' | 'PAYMENTS'

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/owner');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load owner dashboard', err);
      setError('Failed to load dashboard metrics. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      console.error('Failed to load bill', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm">
        {error || 'Unable to load dashboard.'}
      </div>
    );
  }


  const kpis = data?.kpis || {};
  const todayAnalytics = data?.todaySalesAnalytics || {};
  const todayHourlySales = data?.todayHourlySales || data?.charts?.todayHourlySales || [];
  const salesTrend = data?.salesTrend || data?.charts?.salesTrend || [];
  const salesTrend30Days = data?.salesTrend30Days || data?.charts?.salesTrend30Days || [];
  const todayPaymentBreakdown = data?.charts?.todayPaymentBreakdown || todayAnalytics?.paymentMethods || {
    CASH: { amount: 0, count: 0 },
    UPI: { amount: 0, count: 0 },
    CARD: { amount: 0, count: 0 }
  };
  const todayTopMedicines = data?.charts?.todayTopMedicines || todayAnalytics?.topMedicinesSoldToday || [];
  const topMedicines = data?.topMedicines || data?.charts?.topSellingMedicines || [];
  const lowStockItems = data?.lowStockItems || [];
  const expiringSoonItems = data?.expiringSoonItems || [];
  const recentBills = data?.recentBills || data?.recentTransactions || [];
  const pendingOrders = data?.pendingOrders || [];

  // Smart currency formatter for chart Y-Axis
  const formatYAxisTick = (val) => {
    if (val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val)}`;
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[170px] space-y-1.5 animate-in fade-in zoom-in-95">
          <div className="font-bold text-teal-300 border-b border-slate-700/80 pb-1 flex items-center justify-between">
            <span>{dataPoint.timeRange || dataPoint.fullDate || dataPoint.date || label}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {graphViewMode === 'TODAY_HOURLY' ? "Today" : "Daily Trend"}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-200">
            <span>Sales Revenue:</span>
            <span className="font-black text-white text-sm">
              ₹{Number(dataPoint.sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {dataPoint.bills !== undefined && (
            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span>Invoices Issued:</span>
              <span className="font-bold text-emerald-400">{dataPoint.bills} bills</span>
            </div>
          )}
          {dataPoint.items !== undefined && dataPoint.items > 0 && (
            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span>Tablets/Units Dispensed:</span>
              <span className="font-bold text-amber-300">{dataPoint.items} units</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Payment method totals for percentage calculation
  const totalPaymentAmount =
    (todayPaymentBreakdown.CASH?.amount || 0) +
    (todayPaymentBreakdown.UPI?.amount || 0) +
    (todayPaymentBreakdown.CARD?.amount || 0);

  const paymentMethodsChartData = [
    {
      name: 'UPI / Online QR',
      amount: todayPaymentBreakdown.UPI?.amount || 0,
      count: todayPaymentBreakdown.UPI?.count || 0,
      percentage: totalPaymentAmount > 0 ? Math.round(((todayPaymentBreakdown.UPI?.amount || 0) / totalPaymentAmount) * 100) : 0,
      color: '#0d9488'
    },
    {
      name: 'Cash Register',
      amount: todayPaymentBreakdown.CASH?.amount || 0,
      count: todayPaymentBreakdown.CASH?.count || 0,
      percentage: totalPaymentAmount > 0 ? Math.round(((todayPaymentBreakdown.CASH?.amount || 0) / totalPaymentAmount) * 100) : 0,
      color: '#10b981'
    },
    {
      name: 'Card Swipes',
      amount: todayPaymentBreakdown.CARD?.amount || 0,
      count: todayPaymentBreakdown.CARD?.count || 0,
      percentage: totalPaymentAmount > 0 ? Math.round(((todayPaymentBreakdown.CARD?.amount || 0) / totalPaymentAmount) * 100) : 0,
      color: '#6366f1'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Real-Time Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Pharmacy Owner Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic view of counter billing, batch depletion, dealer supply pipeline, and margin health.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/owner/billing')}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>

          <button
            onClick={() => navigate('/owner/medicines')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl shadow-2xs transition-all cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-teal-600" />
            <span>+ Add Medicine</span>
          </button>

          <button
            onClick={() => navigate('/owner/purchase-orders')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-teal-300" />
            <span>+ Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold text-[11px]">Today's Sales</span>
            <div className="p-1 rounded-lg bg-teal-50 text-teal-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{formatINR(kpis.todaySales || 0)}</div>
          <span className="text-[10px] text-teal-600 font-semibold block mt-1">Live counter turnover</span>
        </div>

        {/* Today's Bills */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold text-[11px]">Today's Bills</span>
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.todayBillsCount || 0}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Invoices issued</span>
        </div>

        {/* Current Stock */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold text-[11px]">Current Stock</span>
            <div className="p-1 rounded-lg bg-sky-50 text-sky-600">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.totalMedicines || 50} SKUs</div>
          <span className="text-[10px] text-slate-500 block mt-1">Active inventory catalog</span>
        </div>

        {/* Low Stock */}
        <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-800 text-xs mb-1.5">
            <span className="font-bold text-[11px]">Low Stock</span>
            <div className="p-1 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900">{kpis.lowStockCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold block mt-1">Under min threshold</span>
        </div>

        {/* Near Expiry */}
        <div className="p-4 rounded-3xl bg-rose-50/70 border border-rose-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-rose-800 text-xs mb-1.5">
            <span className="font-bold text-[11px]">Near Expiry</span>
            <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-900">{kpis.expiringSoonCount}</div>
          <span className="text-[10px] text-rose-700 font-semibold block mt-1">&lt; 60 days to return</span>
        </div>

        {/* Pending Orders */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold text-[11px]">Pending POs</span>
            <div className="p-1 rounded-lg bg-purple-50 text-purple-600">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.pendingPOsCount}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Awaiting dispatch</span>
        </div>
      </div>

      {/* Main Analytics Row: Interactive Today's Sales & Revenue Trend Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        {/* Graph Header with View Mode Toggle Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                {graphViewMode === 'TODAY_HOURLY' && "⚡ Today's Hourly Sales & Dispensing Volume"}
                {graphViewMode === '7_DAY' && "📅 7-Day Pharmacy Sales Trajectory"}
                {graphViewMode === '30_DAY' && "📈 30-Day Monthly Billing Trajectory"}
                {graphViewMode === 'PAYMENTS' && "💳 Today's Payment Modes & Collections"}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {graphViewMode === 'TODAY_HOURLY' && "Real-time hour-by-hour counter billing revenue and invoice activity for today"}
              {graphViewMode === '7_DAY' && "Daily counter billing volume across all dispensed prescriptions in Indian Rupees (₹)"}
              {graphViewMode === '30_DAY' && "Day-by-day revenue velocity across the last 30 operational days"}
              {graphViewMode === 'PAYMENTS' && "Live distribution of customer settlement methods (UPI QR, Cash, Cards)"}
            </p>
          </div>

          {/* View Mode Switcher Pill */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 flex-wrap gap-1 self-start lg:self-auto">
            <button
              onClick={() => setGraphViewMode('TODAY_HOURLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                graphViewMode === 'TODAY_HOURLY'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              ⏰ Today's Hourly
            </button>
            <button
              onClick={() => setGraphViewMode('7_DAY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                graphViewMode === '7_DAY'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              📅 7-Day Trend
            </button>
            <button
              onClick={() => setGraphViewMode('30_DAY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                graphViewMode === '30_DAY'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              📈 30-Day Trend
            </button>
            <button
              onClick={() => setGraphViewMode('PAYMENTS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                graphViewMode === 'PAYMENTS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              💳 Payment Modes
            </button>
          </div>
        </div>

        {/* Live Today's Sales Key Stats Bar (Visible when TODAY_HOURLY is active) */}
        {graphViewMode === 'TODAY_HOURLY' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-teal-700">Today's Counter Sales</span>
              <span className="text-base font-black text-slate-900">{formatINR(kpis.todaySales || 0)}</span>
              <span className="text-[10px] text-teal-600 font-medium">{kpis.todayBillsCount || 0} Invoices today</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-teal-700">Peak Billing Window</span>
              <span className="text-base font-black text-slate-900">
                {todayAnalytics?.peakHour?.sales > 0 ? todayAnalytics.peakHour.timeRange : 'Ongoing'}
              </span>
              <span className="text-[10px] text-teal-600 font-medium">
                {todayAnalytics?.peakHour?.sales > 0 ? `₹${todayAnalytics.peakHour.sales.toLocaleString('en-IN')} billed` : 'Awaiting peaks'}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-teal-700">Tablets Dispensed</span>
              <span className="text-base font-black text-slate-900">{kpis.todayUnitsSold || 0} Units</span>
              <span className="text-[10px] text-teal-600 font-medium">Across all today's receipts</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-teal-700">Avg. Basket Size</span>
              <span className="text-base font-black text-slate-900">{formatINR(kpis.todayAverageBill || 0)}</span>
              <span className="text-[10px] text-teal-600 font-medium">Per invoice turnover</span>
            </div>
          </div>
        )}

        {/* 1. Today's Hourly Sales Graph */}
        {graphViewMode === 'TODAY_HOURLY' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={todayHourlySales} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="todaySalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Today's Sales (₹)"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 3 }}
                  fillOpacity={1}
                  fill="url(#todaySalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. 7-Day Trend Graph */}
        {graphViewMode === '7_DAY' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerSalesGrad7" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="7-Day Gross Sales (₹)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 3 }}
                  fillOpacity={1}
                  fill="url(#ownerSalesGrad7)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3. 30-Day Monthly Trend Graph */}
        {graphViewMode === '30_DAY' && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend30Days} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerSalesGrad30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} interval={3} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="30-Day Gross Sales (₹)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                  fillOpacity={1}
                  fill="url(#ownerSalesGrad30)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. Payment Modes Breakdown for Today */}
        {graphViewMode === 'PAYMENTS' && (
          <div className="py-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentMethodsChartData.map((pm) => (
                <div
                  key={pm.name}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{pm.name}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {pm.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{formatINR(pm.amount)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{pm.count} Invoices settled</div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pm.percentage || 0}%`,
                        backgroundColor: pm.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {totalPaymentAmount === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                No payment receipts recorded yet for today. Issue bills at POS counter to view live payment distributions.
              </p>
            )}
          </div>
        )}

        {/* Top Dispensed Medicines Today Quick-Glance (if any sold today) */}
        {todayTopMedicines.length > 0 && graphViewMode === 'TODAY_HOURLY' && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Top Medicines Dispensed Today
              </span>
              <span className="text-[10px] text-slate-400">Live POS Sales</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {todayTopMedicines.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-bold text-slate-900 truncate">{m.name}</p>
                    <span className="text-[10px] text-slate-400">{m.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-teal-700 block">{m.quantity} sold</span>
                    <span className="text-[10px] text-slate-500">{formatINR(m.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operational Grids: Low-Stock & Near-Expiry Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low-Stock Medicines */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low-Stock Replenishment Required</span>
            </h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {lowStockItems.length} Items
            </span>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All medicines are safely above minimum reorder levels.</p>
            ) : (
              lowStockItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{item.medicineName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Batch: {item.batchNumber} • Min Reorder: {item.minStockLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-900 block">{item.remainingQuantity} left</span>
                    <button
                      onClick={() => navigate('/owner/purchase-orders')}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      + Create PO
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Near-Expiry Medicines */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Near-Expiry Stock (≤ 60 Days Window)</span>
            </h3>
            <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
              {expiringSoonItems.length} Batches
            </span>
          </div>

          <div className="space-y-2.5">
            {expiringSoonItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No batches are near expiry date.</p>
            ) : (
              expiringSoonItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-rose-50/40 border border-rose-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{item.medicineName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Batch: {item.batchNumber} • Qty: {item.remainingQuantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-700 block">{item.expiryLabel}</span>
                    <span className="text-[10px] text-slate-500">Exp: {formatDate(item.expiryDate)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills & Invoices Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Recent Counter Transactions
            </h3>
            <p className="text-xs text-slate-500">Latest retail bills generated at the pharmacy counter</p>
          </div>

          <button
            onClick={() => navigate('/owner/billing')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>Open POS Counter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Pharmacist Staff</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recentBills || []).map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.billNumber}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTime(b.date)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <div>{b.customerName}</div>
                    <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{b.staffName}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {b.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {formatINR(b.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleViewBill(b.id)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for selected transaction */}
      {selectedBill && (
        <InvoiceModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}
