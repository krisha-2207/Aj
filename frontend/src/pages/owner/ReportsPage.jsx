import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import {
  FileBarChart2,
  Printer,
  TrendingUp,
  Percent,
  RotateCcw,
  Undo2,
  BadgePercent,
  Scale,
  Search,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Stethoscope
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'GST' | 'SALES_RETURNS' | 'PURCHASE_RETURNS'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/owner');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { charts, kpis, salesReturns = [], purchaseReturns = [] } = data;

  // Filtered sales returns
  const filteredSalesReturns = salesReturns.filter((sr) => {
    const q = searchTerm.toLowerCase();
    return (
      sr.returnNumber?.toLowerCase().includes(q) ||
      sr.customerName?.toLowerCase().includes(q) ||
      sr.medicineName?.toLowerCase().includes(q) ||
      sr.doctorName?.toLowerCase().includes(q) ||
      sr.reason?.toLowerCase().includes(q)
    );
  });

  // Filtered purchase returns
  const filteredPurchaseReturns = purchaseReturns.filter((pr) => {
    const q = searchTerm.toLowerCase();
    return (
      pr.returnNumber?.toLowerCase().includes(q) ||
      pr.dealer?.companyName?.toLowerCase().includes(q) ||
      pr.medicineName?.toLowerCase().includes(q) ||
      pr.reason?.toLowerCase().includes(q)
    );
  });

  // GST Breakdown data for visual charts
  const gstChartData = [
    { name: 'Sales GST (Output)', amount: kpis.salesGst || 0, fill: '#10b981' },
    { name: 'Purchase GST (ITC)', amount: kpis.purchaseGst || 0, fill: '#3b82f6' },
    { name: 'Sales Return GST', amount: kpis.salesReturnGst || 0, fill: '#f43f5e' },
    { name: 'Purch. Return GST', amount: kpis.purchaseReturnGst || 0, fill: '#f59e0b' }
  ];

  const returnsChartData = [
    { name: 'Sales Returns (Refunds)', amount: kpis.salesReturnTotal || 0, fill: '#f43f5e' },
    { name: 'Purchase Returns (Credits)', amount: kpis.purchaseReturnTotal || 0, fill: '#6366f1' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Print / Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              GST Tax Audit, Sales & Returns Analytics Report
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automated reconciliation for PharmaFlow Pharmacy: Output GST, Input Tax Credit (ITC), Sales Returns & Purchase Returns
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg transition-colors shadow-2xs"
          >
            Refresh Ledger
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Report</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Analytical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales GST */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sales GST (Output)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BadgePercent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 mt-2">{formatINR(kpis.salesGst || 0)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tax collected on customer sales</span>
          </div>
        </div>

        {/* Purchase GST */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Purchase GST (Input ITC)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 mt-2">{formatINR(kpis.purchaseGst || 0)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Eligible Input Tax Credit (ITC)</span>
          </div>
        </div>

        {/* Purchase Return */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Purchase Return</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 mt-2">{formatINR(kpis.purchaseReturnTotal || 0)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-purple-700">
            <span>{kpis.purchaseReturnCount || 0} batch credit memo(s)</span>
            <span className="text-[10px] text-slate-500">GST: {formatINR(kpis.purchaseReturnGst || 0)}</span>
          </div>
        </div>

        {/* Sales Return */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sales Return</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Undo2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 mt-2">{formatINR(kpis.salesReturnTotal || 0)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-rose-700">
            <span>{kpis.salesReturnCount || 0} customer refund(s)</span>
            <span className="text-[10px] text-slate-500">GST: {formatINR(kpis.salesReturnGst || 0)}</span>
          </div>
        </div>
      </div>

      {/* Net GST Reconciliation Audit Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Net Tax Reconciliation Formula
            </span>
            <h3 className="text-lg font-black tracking-tight text-white">
              Net GST Liability = (Sales GST - Sales Return GST) - (Purchase GST - Purchase Return GST)
            </h3>
            <p className="text-xs text-slate-300">
              Formula: ({formatINR(kpis.salesGst || 0)} - {formatINR(kpis.salesReturnGst || 0)}) - ({formatINR(kpis.purchaseGst || 0)} - {formatINR(kpis.purchaseReturnGst || 0)})
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {kpis.netGstLiability >= 0 ? 'Net Tax Payable to Govt' : 'Net Input Tax Credit Surplus'}
            </p>
            <p className={`text-2xl font-black mt-0.5 ${kpis.netGstLiability >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatINR(Math.abs(kpis.netGstLiability || 0))}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200">
              {kpis.netGstLiability >= 0 ? '● Tax Liability Due' : '✓ Full ITC Carried Forward'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'ALL', label: 'Overview & Charts' },
            { id: 'GST', label: 'GST Tax Audit Report' },
            { id: 'SALES_RETURNS', label: `Sales Returns (${salesReturns.length})` },
            { id: 'PURCHASE_RETURNS', label: `Purchase Returns (${purchaseReturns.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'SALES_RETURNS' || activeTab === 'PURCHASE_RETURNS') && (
          <div className="relative w-full sm:w-64 pb-2">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search return records..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {(activeTab === 'ALL' || activeTab === 'GST') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GST Comparison Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">GST Input vs Output Tax Comparison</h3>
              <p className="text-xs text-slate-500">Output tax collected vs Input Tax Credit claimed in ₹</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gstChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {gstChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reverse Logistics / Returns Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Reverse Logistics (Returns) Value</h3>
              <p className="text-xs text-slate-500">Total customer refunds vs supplier credit notes in ₹</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Value']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {returnsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES RETURNS LEDGER */}
      {(activeTab === 'ALL' || activeTab === 'SALES_RETURNS') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-rose-600" />
                <span>Customer Sales Returns & Patient Refunds</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full audit ledger of customer returns, prescribing doctors, and reversed GST
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
              Total Refunded: {formatINR(kpis.salesReturnTotal || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Return #</th>
                  <th className="py-2.5 px-3">Customer / Patient</th>
                  <th className="py-2.5 px-3">Prescribing Doctor</th>
                  <th className="py-2.5 px-3">Medicine & Batch</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Refund Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST Refund (₹)</th>
                  <th className="py-2.5 px-3">Return Reason</th>
                  <th className="py-2.5 px-3">Return Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesReturns.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      No sales return records found.
                    </td>
                  </tr>
                ) : (
                  filteredSalesReturns.map((sr) => (
                    <tr key={sr.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{sr.returnNumber}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{sr.customerName}</p>
                        <p className="text-[10px] text-slate-400">{sr.customerPhone || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-3 text-emerald-800 font-semibold text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sr.doctorName || 'Dr. Self / OTC'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{sr.medicineName}</p>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                          {sr.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900">{sr.quantity}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-600">{formatINR(sr.refundAmount)}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{formatINR(sr.gstRefund)}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={sr.reason}>
                        {sr.reason}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(sr.returnDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASE RETURNS LEDGER */}
      {(activeTab === 'ALL' || activeTab === 'PURCHASE_RETURNS') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span>Supplier Purchase Returns & Credit Memo Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stock returned to medicine dealers / distributors with Input Tax Credit reversals
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
              Total Credits: {formatINR(kpis.purchaseReturnTotal || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Return #</th>
                  <th className="py-2.5 px-3">Dealer / Supplier</th>
                  <th className="py-2.5 px-3">Medicine & Batch</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Credit Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST Reversal (₹)</th>
                  <th className="py-2.5 px-3">Return Reason</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3">Return Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchaseReturns.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      No purchase return records found.
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseReturns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{pr.returnNumber}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{pr.dealer?.companyName || 'Distributor'}</p>
                        <p className="text-[10px] text-slate-400">{pr.dealer?.contactPerson}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{pr.medicineName}</p>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                          {pr.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900">{pr.quantity}</td>
                      <td className="py-3 px-3 text-right font-black text-purple-700">{formatINR(pr.refundAmount)}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{formatINR(pr.gstReversal)}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={pr.reason}>
                        {pr.reason}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(pr.returnDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
