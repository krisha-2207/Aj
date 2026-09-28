import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Plus, Pill, Layers, AlertCircle } from 'lucide-react';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  // Add Medicine Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    hsnCode: '3004',
    gstRate: '12',
    unit: 'Strip (10 tabs)',
    minStockLevel: '15'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [category]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medicines', {
        params: { search: search || undefined, category }
      });
      setMedicines(res.data);
    } catch (err) {
      console.error('Failed to load medicines', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.post('/medicines', formData);
      setShowModal(false);
      setFormData({
        productId: '',
        name: '',
        genericName: '',
        category: '',
        manufacturer: '',
        hsnCode: '3004',
        gstRate: '12',
        unit: 'Strip (10 tabs)',
        minStockLevel: '15'
      });
      fetchMedicines();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Master Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure medicine catalog, HSN codes, GST tax slabs, and minimum reorder levels
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine name, product ID, formula or brand..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-xs bg-white shrink-0"
        >
          <option value="ALL">All Therapeutic Categories</option>
          <option value="Analgesics / Antipyretic">Analgesics / Antipyretic</option>
          <option value="Antibiotics">Antibiotics</option>
          <option value="Antacids / Gastrointestinal">Antacids / Gastrointestinal</option>
          <option value="Antihistamines">Antihistamines</option>
          <option value="Antidiabetic">Antidiabetic</option>
          <option value="Cardiovascular / Antihypertensive">Cardiovascular</option>
          <option value="Respiratory / Antiallergic">Respiratory</option>
          <option value="Vitamins & Supplements">Vitamins & Supplements</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Product ID</th>
                <th className="py-3 px-3">Medicine Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Manufacturer</th>
                <th className="py-3 px-3">Packaging Unit</th>
                <th className="py-3 px-2 text-center">GST %</th>
                <th className="py-3 px-2 text-right">Min Threshold</th>
                <th className="py-3 px-3 text-right">Total Active Stock</th>
                <th className="py-3 px-3 text-center">Batches Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading medicines...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{med.productId}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{med.name}</p>
                      {med.genericName && (
                        <p className="text-[10px] text-slate-500 truncate max-w-xs">{med.genericName}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {med.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{med.manufacturer}</td>
                    <td className="py-3 px-3 text-slate-600">{med.unit}</td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-700">{med.gstRate}%</td>
                    <td className="py-3 px-2 text-right text-slate-600">{med.minStockLevel}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          med.totalStock <= 0
                            ? 'bg-red-100 text-red-800'
                            : med.isLowStock
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {med.totalStock} units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {med.batches?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Medicine</h3>
            <p className="text-xs text-slate-500 mb-4">Define product identification and tax parameters</p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    placeholder="e.g. MED012"
                    className="w-full p-2 border border-slate-300 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dolo 650"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Generic / Formula Name</label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="e.g. Paracetamol 650mg"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Analgesics"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Micro Labs Ltd"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate %</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Packaging Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Strip (10 tabs) or Bottle (100ml)"
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
                  {isSubmitting ? 'Saving...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
