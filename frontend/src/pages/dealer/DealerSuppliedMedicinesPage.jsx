import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import ExpiryBadge from '../../components/ExpiryBadge';
import { Pill, Search } from 'lucide-react';

export default function DealerSuppliedMedicinesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dealers/my-portal/data');
      setBatches(res.data.batches);
    } catch (err) {
      console.error('Failed to load dealer supplied medicines', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = batches.filter(
    (b) =>
      b.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      b.productId.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplied Medicines Catalog</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          All pharmaceutical products and batches supplied by your distributorship to the pharmacy
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by medicine name, product ID or batch..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Product ID</th>
                <th className="py-3 px-3">Medicine Name</th>
                <th className="py-3 px-3">Manufacturer</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 font-mono">Batch Number</th>
                <th className="py-3 px-2 text-right">Supplied Qty</th>
                <th className="py-3 px-2 text-right">Pharmacy Stock</th>
                <th className="py-3 px-3 text-right">Wholesale Rate (₹)</th>
                <th className="py-3 px-3">Supply Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    Loading supplied products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400 font-medium">
                    No matching products found.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{b.productId}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.medicineName}</td>
                    <td className="py-3 px-3 text-slate-600">{b.manufacturer}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{b.batchNumber}</td>
                    <td className="py-3 px-2 text-right font-medium text-slate-700">{b.initialQuantity} units</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-700">{b.remainingQuantity} units</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(b.purchasePrice)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(b.supplyDate)}</td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{formatDate(b.expiryDate)}</td>
                    <td className="py-3 px-3 text-center">
                      <ExpiryBadge expiryDate={b.expiryDate} />
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
