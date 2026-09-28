import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import ExpiryBadge from '../../components/ExpiryBadge';
import { formatINR, formatDate, getExpiryDetails } from '../../utils/formatters';
import { Layers, Search, AlertCircle } from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: { search: search || undefined, sortBy: 'expiryDate', sortOrder: 'asc' }
      });
      setBatches(res.data.batches);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Batches & FEFO Sequencing</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Sorted by earliest expiry date (First Expiry, First Out) for disciplined batch dispensation
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBatches()}
            placeholder="Search batch number or medicine name and press Enter..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 font-mono">Batch Number</th>
                <th className="py-3 px-3">Medicine & Product ID</th>
                <th className="py-3 px-3">Dealer / Source</th>
                <th className="py-3 px-2 text-right">Initial</th>
                <th className="py-3 px-2 text-right">Sold</th>
                <th className="py-3 px-2 text-right">Remaining</th>
                <th className="py-3 px-3 text-right">Purchase ₹</th>
                <th className="py-3 px-3 text-right">Selling ₹</th>
                <th className="py-3 px-3">Manufacturing</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400 font-medium">
                    No batches found.
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => {
                  const expDetails = getExpiryDetails(batch.expiryDate);
                  return (
                    <tr key={batch.id} className={`transition-colors ${expDetails.rowClass}`}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{batch.batchNumber}</span>
                        {index === 0 && !expDetails.isExpired && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">
                            FEFO #1
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{batch.medicineName}</span>
                        <span className="text-slate-400 font-mono text-[10px] ml-1.5">({batch.productId})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">{batch.supplierName}</td>
                      <td className="py-3 px-2 text-right text-slate-500 font-medium">{batch.initialQuantity}</td>
                      <td className="py-3 px-2 text-right text-slate-600 font-medium">{batch.soldQuantity}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">{batch.remainingQuantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{formatINR(batch.purchasePrice)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(batch.sellingPrice)}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(batch.mfgDate)}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{formatDate(batch.expiryDate)}</td>
                      <td className="py-3 px-3 text-center">
                        <ExpiryBadge expiryDate={batch.expiryDate} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
