import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon
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

export default function AnalyticsSection() {
  const [timeframe, setTimeframe] = useState('weekly');

  const chartDataWeekly = [
    { name: 'Mon', sales: 6200, expenses: 3400 },
    { name: 'Tue', sales: 7400, expenses: 4100 },
    { name: 'Wed', sales: 8100, expenses: 3800 },
    { name: 'Thu', sales: 6900, expenses: 2900 },
    { name: 'Fri', sales: 9400, expenses: 5100 },
    { name: 'Sat', sales: 11200, expenses: 6200 },
    { name: 'Sun', sales: 12500, expenses: 4900 },
  ];

  const chartDataMonthly = [
    { name: 'Week 1', sales: 28500, expenses: 16200 },
    { name: 'Week 2', sales: 31200, expenses: 17800 },
    { name: 'Week 3', sales: 34100, expenses: 15400 },
    { name: 'Week 4', sales: 31600, expenses: 18800 },
  ];

  const chartData = timeframe === 'weekly' ? chartDataWeekly : chartDataMonthly;

  const topSelling = [
    { name: 'Paracetamol 500mg', units: '420 units', revenue: '₹4,200', tag: 'Fast Moving' },
    { name: 'Pantoprazole 40mg', units: '310 units', revenue: '₹7,750', tag: 'Fast Moving' },
    { name: 'Cetirizine 10mg', units: '260 units', revenue: '₹1,560', tag: 'High Turnover' },
    { name: 'Azithromycin 500mg', units: '140 units', revenue: '₹8,400', tag: 'High Margin' },
  ];

  return (
    <section className="py-20 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            <span>Financial & Stock Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Clear Pharmacy Analytics
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Real-time financial visibility formatted in Indian Rupees (₹), giving you total control
            over revenue velocity, supplier bills, and medicine turnover.
          </p>
        </div>

        {/* 4 Financial Metric Cards in ₹ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Today's Sales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Today's Sales</span>
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">₹12,500</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>+18.4% vs yesterday</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">14 counter bills cleared</span>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Weekly Revenue</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">₹48,750</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              <span>Consistent 7-day volume</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">Counter sales & prescriptions</span>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Monthly Revenue</span>
              <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">₹1,25,400</div>
            <div className="text-xs text-teal-600 font-semibold mt-1">
              <span>+12.8% MoM growth</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">Top grossing pharmacy branch</span>
          </div>

          {/* Purchase Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Purchase Expenses</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">₹68,200</div>
            <div className="text-xs text-slate-600 font-semibold mt-1">
              <span>Direct supplier invoices</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-2">Gross Margin: 45.6%</span>
          </div>
        </div>

        {/* Analytics Chart & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Revenue Chart View */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue vs. Procurement Trend</h3>
                <p className="text-xs text-slate-500">
                  Track retail gross sales against distributor restocking cost
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setTimeframe('weekly')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    timeframe === 'weekly'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekly View
                </button>
                <button
                  onClick={() => setTimeframe('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    timeframe === 'monthly'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly View
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Counter Sales"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Purchase Expenses"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                <span>Counter Sales (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span>Purchase Expenses (₹)</span>
              </div>
            </div>
          </div>

          {/* Top Selling Medicines Widget */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Top Selling Medicines</h3>
                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                  This Week
                </span>
              </div>

              <div className="space-y-3">
                {topSelling.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between hover:bg-teal-50/30 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <span className="text-[11px] text-slate-400 block">{item.units}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{item.revenue}</span>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Summary Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Low Stock</span>
                <span className="text-sm font-black text-amber-900">18 Medicines</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/70">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Near Expiry</span>
                <span className="text-sm font-black text-rose-900">7 Batches</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
