import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { formatINR, formatDateTime, formatDate } from '../../utils/formatters';
import {
  WalletCards,
  IndianRupee,
  TrendingUp,
  Receipt,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';

export default function AccountsPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Rent',
    title: '',
    amount: '',
    paymentMethod: 'UPI',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const [sumRes, txRes, expRes] = await Promise.all([
        api.get('/accounts/summary'),
        api.get('/accounts/transactions'),
        api.get('/accounts/expenses')
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/accounts/expenses', expenseForm);
      setShowModal(false);
      setExpenseForm({
        category: 'Rent',
        title: '',
        amount: '',
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchAccountsData();
    } catch (err) {
      console.error('Failed to add expense', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Financial Accounts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              OWNER RESTRICTED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Confidential profit & loss statement, inventory procurement expenses, operational overheads, and live cashflow
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales Revenue"
          value={formatINR(summary.totalSalesRevenue)}
          subtitle={`${summary.totalBillsCount} retail invoices billed`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total Purchase Procurement"
          value={formatINR(summary.totalPurchaseCost)}
          subtitle="Cumulative batch stock cost"
          icon={WalletCards}
          color="blue"
        />
        <StatCard
          title="Operating Expenses"
          value={formatINR(summary.totalOperatingExpenses)}
          subtitle="Rent, electricity, packaging"
          icon={Receipt}
          color="rose"
        />
        <StatCard
          title="Net Business Profit"
          value={formatINR(summary.netProfit)}
          subtitle="Gross margin minus expenses"
          icon={TrendingUp}
          color={summary.netProfit >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Payment Methods Split & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Payment Mode Realization
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-center">
              <QrCode className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] uppercase font-semibold text-emerald-700">UPI / QR Code</p>
              <p className="text-base font-bold text-emerald-900 mt-1">
                {formatINR(summary.paymentMethods?.UPI || 0)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <Banknote className="w-5 h-5 text-slate-600 mx-auto mb-1" />
              <p className="text-[10px] uppercase font-semibold text-slate-600">Cash in Hand</p>
              <p className="text-base font-bold text-slate-900 mt-1">
                {formatINR(summary.paymentMethods?.CASH || 0)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center">
              <CreditCard className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-[10px] uppercase font-semibold text-blue-700">Debit / Credit Card</p>
              <p className="text-base font-bold text-blue-900 mt-1">
                {formatINR(summary.paymentMethods?.CARD || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Overhead Categories
          </h3>
          <div className="space-y-2">
            {Object.entries(summary.expensesByCategory || {}).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <span className="font-semibold text-slate-700">{cat}</span>
                <span className="font-bold text-slate-900">{formatINR(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Combined Financial Ledger (Sales & Operational Outflows)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Auto-calculated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 font-mono">Reference</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td className="py-2.5 px-3">
                    {tx.type === 'INCOME' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>INCOME</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>EXPENSE</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{tx.category}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{tx.reference}</td>
                  <td className="py-2.5 px-3 text-slate-600">{tx.description}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      tx.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {tx.type === 'INCOME' ? `+ ${formatINR(tx.amount)}` : `- ${formatINR(Math.abs(tx.amount))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Operational Expense</h3>
            <p className="text-xs text-slate-500 mb-4">Add overheads to calculate net pharmacy profit</p>

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Rent">Shop Commercial Rent</option>
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Packaging">Carry Bags & Medicine Envelopes</option>
                  <option value="Salaries & Wages">Staff Wages / Incentives</option>
                  <option value="Maintenance & Cleaning">Maintenance & Sanitization</option>
                  <option value="Licensing & Taxes">Regulatory / Drug Licensing Fees</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Monthly Electricity Bill BESCOM"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="NETBANKING">Net Banking</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
