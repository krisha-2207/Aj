import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { formatINR, formatDateTime, formatDate } from '../../utils/formatters';
import {
  IndianRupee,
  ReceiptText,
  AlertTriangle,
  Clock,
  PlusCircle,
  Pill,
  Sparkles,
  Search
} from 'lucide-react';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffDashboard();
  }, []);

  const fetchStaffDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/staff');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load staff dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { kpis, lowStockAlerts, expiryAlerts, frequentMedicines, recentBills } = data;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacist Dispensing Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Your counter billing activity, customer sales history, and critical medicine alerts
          </p>
        </div>
        <Link
          to="/staff/billing"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Customer Bill</span>
        </Link>
      </div>

      {/* Staff KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatINR(kpis.todaySales)}
          subtitle="Billed by you today"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Today's Bills"
          value={kpis.todayBillsCount}
          subtitle="Customer receipts"
          icon={ReceiptText}
          color="blue"
        />
        <StatCard
          title="Medicines Sold"
          value={`${kpis.medicinesSold || 0} units`}
          subtitle="Dispensed today"
          icon={Pill}
          color="teal"
        />
        <StatCard
          title="Low Stock"
          value={kpis.lowStockCount}
          subtitle="Threshold < Min stock"
          icon={AlertTriangle}
          color="amber"
          alert={kpis.lowStockCount > 0 ? `${kpis.lowStockCount} items` : null}
        />
        <StatCard
          title="Near Expiry"
          value={kpis.expiringSoonCount}
          subtitle="Expiring ≤ 2 months"
          icon={Clock}
          color="rose"
          alert={kpis.expiringSoonCount > 0 ? 'FEFO alert' : null}
        />
      </div>

      {/* Alerts Row: Low Stock & Expiry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Low Stock Medicine Alerts
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Threshold &lt; Min Stock
            </span>
          </div>

          <div className="space-y-2">
            {lowStockAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">All medicine batches are well stocked.</p>
            ) : (
              lowStockAlerts.map((b) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{b.medicineName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Batch: {b.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs">
                      {b.remainingQuantity} left
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Min: {b.minStockLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiry Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dynamic Expiry Alerts (≤ 2 Months)
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              FEFO Priority
            </span>
          </div>

          <div className="space-y-2">
            {expiryAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No batches near expiry date.</p>
            ) : (
              expiryAlerts.map((b) => (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    b.isExpired
                      ? 'bg-red-100/70 border-red-300 text-red-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div>
                    <p className="font-bold">{b.medicineName}</p>
                    <p className="text-[10px] opacity-75 font-mono">
                      Batch: {b.batchNumber} • Expiry: {formatDate(b.expiryDate)}
                    </p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      b.isExpired ? 'bg-red-800 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {b.expiryLabel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills Generated by this Staff */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                My Recent Generated Invoices
              </h3>
              <p className="text-xs text-slate-500">Retail pharmacy bills issued by your login</p>
            </div>
          </div>
          <Link
            to="/staff/sales"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View All My Sales</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 bg-slate-50/60">
                <th className="py-2.5 px-3">Bill Number</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                    You have not billed any sales yet.
                  </td>
                </tr>
              ) : (
                recentBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.billNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{b.customerName}</p>
                      <p className="text-[10px] text-slate-400">{b.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">
                      {formatINR(b.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 text-[11px]">
                      {formatDateTime(b.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
