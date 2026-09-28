import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  Search, Pill, X, AlertTriangle, CheckCircle2, 
  ExternalLink, Layers, Sparkles, Building2, Tag, ChevronRight, Info
} from 'lucide-react';

export default function MedicineQuickSearch({ userRole }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/medicines?search=${encodeURIComponent(query.trim())}`);
        setResults(res.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Quick search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (medicine) => {
    setSelectedMedicine(medicine);
  };

  const handleNavigateToInventory = (medName) => {
    setIsOpen(false);
    setSelectedMedicine(null);
    setQuery('');
    if (userRole === 'OWNER') {
      navigate(`/owner/inventory?search=${encodeURIComponent(medName)}`);
    } else if (userRole === 'STAFF') {
      navigate(`/staff/inventory?search=${encodeURIComponent(medName)}`);
    } else {
      navigate(`/dealer/requirements`);
    }
  };

  const handleNavigateToBilling = (medName) => {
    setIsOpen(false);
    setSelectedMedicine(null);
    setQuery('');
    if (userRole === 'STAFF') {
      navigate(`/staff/billing`);
    } else if (userRole === 'OWNER') {
      navigate(`/owner/billing`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-72 sm:w-80 lg:w-96">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs text-slate-700 w-full focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/15 transition-all duration-200 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Quick search medicines, batches..."
          className="bg-transparent border-none outline-none w-full text-xs text-slate-900 placeholder-slate-400 font-medium"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-[420px] overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-150">
          {/* Header */}
          <div className="p-3 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Medicine Master Search</span>
            <span>{results.length} Matches Found</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>Searching pharmacy catalog...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No medicines found matching "<strong>{query}</strong>"
            </div>
          ) : (
            <div className="p-1 space-y-1">
              {results.slice(0, 8).map((med) => {
                const hasBatches = med.batches && med.batches.length > 0;
                const lowestPrice = hasBatches ? Math.min(...med.batches.map(b => b.sellingPrice)) : 0;
                const totalStock = med.totalStock ?? (hasBatches ? med.batches.reduce((sum, b) => sum + b.remainingQuantity, 0) : 0);

                return (
                  <div
                    key={med.id}
                    onClick={() => handleSelect(med)}
                    className="p-3 rounded-xl hover:bg-teal-50/60 cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-100/70 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <Pill className="w-4 h-4 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                            {med.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {med.productId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {med.genericName} • <span className="text-slate-400">{med.category}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                          <span>{med.dosageForm} ({med.strength || 'Standard'})</span>
                          <span>•</span>
                          <span>Mfr: {med.manufacturer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900">
                        {lowestPrice > 0 ? formatINR(lowestPrice) : '₹--'}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        totalStock > 20 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : totalStock > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {totalStock > 0 ? `${totalStock} In Stock` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Full Medicine Quick-Detail Modal */}
      {selectedMedicine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMedicine.name}</h3>
                  <p className="text-xs text-teal-100">{selectedMedicine.genericName} • {selectedMedicine.productId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMedicine(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Specification Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedMedicine.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Dosage Form & Strength</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedMedicine.dosageForm} ({selectedMedicine.strength})</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Manufacturer</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedMedicine.manufacturer}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">HSN & GST Rate</p>
                  <p className="font-bold text-slate-800 mt-0.5">HSN: {selectedMedicine.hsnCode || '3004'} ({selectedMedicine.gstRate || 12}% GST)</p>
                </div>
              </div>

              {/* Usage Instructions Note */}
              {selectedMedicine.dosageUsage && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Usage Directions / Indications:</strong>
                    <span className="text-[11px] text-teal-800">{selectedMedicine.dosageUsage}</span>
                  </div>
                </div>
              )}

              {/* Active Batches List (FEFO Sorted) */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Available Batches ({selectedMedicine.batches?.length || 0})</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Sorted by FEFO (First Expiry)</span>
                </h5>

                {(!selectedMedicine.batches || selectedMedicine.batches.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                    No active inventory batches registered for this medicine.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedMedicine.batches.map((batch) => {
                      const isExpired = new Date(batch.expiryDate) < new Date();
                      const daysLeft = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = daysLeft <= 60 && !isExpired;

                      return (
                        <div 
                          key={batch.id} 
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{batch.batchNumber}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                isExpired 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                  : isExpiringSoon 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isExpired ? 'EXPIRED' : isExpiringSoon ? `Expires in ${daysLeft}d` : `Safe (${daysLeft}d left)`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Expiry: {formatDate(batch.expiryDate)} • Units Available: <strong className="text-slate-800">{batch.remainingQuantity}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-800">{formatINR(batch.sellingPrice)}</p>
                            <p className="text-[10px] text-slate-400">Cost: {formatINR(batch.purchasePrice)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {(userRole === 'STAFF' || userRole === 'OWNER') && (
                  <button
                    onClick={() => handleNavigateToBilling(selectedMedicine.name)}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Bill in POS</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleNavigateToInventory(selectedMedicine.name)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View in Inventory</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
