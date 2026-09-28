import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import ExpiryBadge from '../../components/ExpiryBadge';
import { formatINR, formatDate, getExpiryDetails } from '../../utils/formatters';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Boxes,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Download
} from 'lucide-react';

export default function InventoryPage() {
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [expiryStatus, setExpiryStatus] = useState('ALL');
  const [stockStatus, setStockStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Add Batch Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [medicinesList, setMedicinesList] = useState([]);
  const [dealersList, setDealersList] = useState([]);
  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    dealerId: '',
    initialQuantity: '',
    purchasePrice: '',
    sellingPrice: '',
    mfgDate: '',
    expiryDate: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [category, expiryStatus, stockStatus, sortBy, sortOrder]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: {
          search: search || undefined,
          category,
          expiryStatus,
          stockStatus,
          sortBy,
          sortOrder
        }
      });
      setBatches(res.data.batches);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const openAddModal = async () => {
    try {
      const [medsRes, dealersRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/dealers')
      ]);
      setMedicinesList(medsRes.data);
      setDealersList(dealersRes.data);
      setShowAddModal(true);
    } catch (err) {
      console.error('Failed to load modal data', err);
    }
  };

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/inventory/batches', batchForm);
      setShowAddModal(false);
      setBatchForm({
        medicineId: '',
        batchNumber: '',
        dealerId: '',
        initialQuantity: '',
        purchasePrice: '',
        sellingPrice: '',
        mfgDate: '',
        expiryDate: ''
      });
      fetchInventory();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add batch');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Batch-Wise Inventory Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Individual batch tracking, FEFO management, dynamic expiry colors, and stock alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Batch</span>
          </button>
        </div>
      </div>

      {/* Expiry & Stock Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
              <Boxes className="w-4 h-4 text-slate-700" />
              <span>Total Batches</span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.totalBatches}</p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe Batches (&gt;2 mo)</span>
            </div>
            <p className="text-xl font-bold text-emerald-800 mt-1">{summary.safeBatches}</p>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Expiring Soon (≤2 mo)</span>
            </div>
            <p className="text-xl font-bold text-rose-800 mt-1">{summary.expiringSoonBatches}</p>
          </div>

          <div className="p-3.5 bg-red-100/70 rounded-xl border border-red-300 shadow-2xs">
            <div className="flex items-center gap-2 text-red-900 text-xs font-semibold uppercase">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <span>Expired Batches</span>
            </div>
            <p className="text-xl font-bold text-red-950 mt-1">{summary.expiredBatches}</p>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts</span>
            </div>
            <p className="text-xl font-bold text-amber-800 mt-1">{summary.lowStockBatches}</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine name, product ID, batch number, or generic formula..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Expiry Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Expiry Filter</label>
            <select
              value={expiryStatus}
              onChange={(e) => setExpiryStatus(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="ALL">All Expiry Status</option>
              <option value="SAFE">🟢 Safe (&gt; 2 Months)</option>
              <option value="EXPIRING_SOON">🔴 Expiring Soon (≤ 2 Months)</option>
              <option value="EXPIRED">⚠️ Expired</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Stock Status</label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="expiryDate">Expiry Date (FEFO)</option>
              <option value="remainingQuantity">Remaining Stock</option>
              <option value="sellingPrice">Selling Price</option>
              <option value="receivedDate">Received Date</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="asc">Ascending (Earliest First)</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Product ID</th>
                <th className="py-3 px-3">Medicine Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 font-mono">Batch No.</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-2 text-right">Initial</th>
                <th className="py-3 px-2 text-right">Sold</th>
                <th className="py-3 px-2 text-right">Remaining</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Stock Alert</th>
                <th className="py-3 px-3 text-center">Expiry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading batch-wise inventory...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-8 text-center text-slate-400 font-medium">
                    No medicine batches match your search criteria.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const expDetails = getExpiryDetails(batch.expiryDate);

                  return (
                    <tr
                      key={batch.id}
                      className={`transition-colors border-b border-slate-100 ${expDetails.rowClass}`}
                    >
                      {/* Product ID */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{batch.productId}</td>

                      {/* Medicine Name */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{batch.medicineName}</p>
                        {batch.genericName && (
                          <p className="text-[10px] text-slate-500 truncate max-w-xs">{batch.genericName}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                          {batch.category}
                        </span>
                      </td>

                      {/* Batch No */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">{batch.batchNumber}</td>

                      {/* Supplier */}
                      <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate" title={batch.supplierName}>
                        {batch.supplierName}
                      </td>

                      {/* Initial Qty */}
                      <td className="py-3 px-2 text-right text-slate-500 font-medium">{batch.initialQuantity}</td>

                      {/* Sold Qty */}
                      <td className="py-3 px-2 text-right text-slate-600 font-medium">{batch.soldQuantity}</td>

                      {/* Remaining Qty */}
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            batch.remainingQuantity <= 0
                              ? 'bg-red-100 text-red-800'
                              : batch.remainingQuantity <= batch.minStockLevel
                              ? 'bg-amber-100 text-amber-900'
                              : 'text-slate-900'
                          }`}
                        >
                          {batch.remainingQuantity}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatINR(batch.sellingPrice)}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{formatDate(batch.expiryDate)}</span>
                      </td>

                      {/* Stock Status Alert */}
                      <td className="py-3 px-3">
                        {batch.stockStatus === 'OUT_OF_STOCK' ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-300">
                            OUT OF STOCK
                          </span>
                        ) : batch.stockStatus === 'LOW_STOCK' ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal</span>
                        )}
                      </td>

                      {/* Dynamic Expiry Status Badge */}
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

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Medicine Batch</h3>
            <p className="text-xs text-slate-500 mb-4">Register batch stock into pharmacy inventory</p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddBatchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicine *</label>
                <select
                  required
                  value={batchForm.medicineId}
                  onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">Select Medicine</option>
                  {medicinesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.productId}) - {m.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH101"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Dealer</label>
                  <select
                    value={batchForm.dealerId}
                    onChange={(e) => setBatchForm({ ...batchForm, dealerId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">Direct / Local Supply</option>
                    {dealersList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Qty *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchForm.initialQuantity}
                    onChange={(e) => setBatchForm({ ...batchForm, initialQuantity: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.sellingPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, sellingPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={batchForm.mfgDate}
                    onChange={(e) => setBatchForm({ ...batchForm, mfgDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
