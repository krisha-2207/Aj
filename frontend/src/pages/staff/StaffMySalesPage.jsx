import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDateTime } from '../../utils/formatters';
import InvoiceModal from '../../components/InvoiceModal';
import { ReceiptText, Printer, Search } from 'lucide-react';

export default function StaffMySalesPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bills', {
        params: { search: search || undefined }
      });
      setBills(res.data.bills);
    } catch (err) {
      console.error('Failed to load my bills', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMyBills();
  };

  const handlePrintClick = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      console.error('Failed to load bill for printing', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Billing History</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          History of all retail medicine invoices processed under your staff account
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or customer phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 font-mono">Invoice No</th>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Customer Type</th>
                <th className="py-3 px-3">Doctor Name</th>
                <th className="py-3 px-3">Items Dispensed</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-right">Tax (₹)</th>
                <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading your bills...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 font-medium">
                    No bills found for your account.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{bill.billNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{bill.customerName}</p>
                      <p className="text-[10px] text-slate-500">{bill.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3">
                      {bill.customerType === 'NEW' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ★ NEW
                        </span>
                      )}
                      {bill.customerAddress ? (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]" title={bill.customerAddress}>
                          📍 {bill.customerAddress}
                        </p>
                      ) : (
                        bill.customerType !== 'NEW' && <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-emerald-800 font-semibold text-[11px] whitespace-nowrap">
                      {bill.doctorName || 'Dr. Self / OTC'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {bill.items?.length || 0} medicine items
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatINR(bill.taxAmount)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatINR(bill.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTime(bill.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handlePrintClick(bill.id)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && (
        <InvoiceModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}
