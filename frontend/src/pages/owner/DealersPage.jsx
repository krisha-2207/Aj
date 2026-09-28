import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import ExpiryBadge from '../../components/ExpiryBadge';
import {
  Truck,
  Phone,
  Mail,
  Building,
  MapPin,
  CheckCircle,
  Package,
  Layers,
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  Sparkles,
  Search,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Receipt,
  FileText,
  BadgePercent,
  Check,
  AlertCircle
} from 'lucide-react';

export default function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [dispatchDetails, setDispatchDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' | 'replenishment' | 'batches' | 'returns'

  // Near Expiry Returns Global State (< 2 Months)
  const [returnsData, setReturnsData] = useState(null);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returningBatch, setReturningBatch] = useState(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('Near Expiry (< 2 Months) - Supplier Return');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [returnErrorMsg, setReturnErrorMsg] = useState('');

  useEffect(() => {
    fetchDealers();
    fetchNearExpiryReturns();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dealers');
      setDealers(res.data);
    } catch (err) {
      console.error('Failed to load dealers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearExpiryReturns = async () => {
    try {
      setLoadingReturns(true);
      const res = await api.get('/dealers/near-expiry-returns');
      setReturnsData(res.data);
    } catch (err) {
      console.error('Failed to load near-expiry returns', err);
    } finally {
      setLoadingReturns(false);
    }
  };

  const handleOpenDealer = async (dealer) => {
    setSelectedDealer(dealer);
    setActiveTab('dispatch');
    try {
      setLoadingDetails(true);
      const res = await api.get(`/dealers/${dealer.id}/dispatch-details`);
      setDispatchDetails(res.data);
    } catch (err) {
      console.error('Failed to load dealer dispatch details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedDealer(null);
    setDispatchDetails(null);
  };

  // Open Return Dialog for a specific Batch
  const handleInitiateReturn = (batch, dealerIdDefault = null) => {
    setReturningBatch({
      ...batch,
      dealerId: batch.dealerId || dealerIdDefault || (selectedDealer ? selectedDealer.id : null)
    });
    setReturnQty(batch.remainingQuantity || batch.quantity || 10);
    setReturnReason(`Near Expiry (< 2 Months) - Batch ${batch.batchNumber}`);
    setReturnSuccessMsg('');
    setReturnErrorMsg('');
  };

  // Submit Return to Backend
  const handleSubmitReturn = async (e) => {
    if (e) e.preventDefault();
    if (!returningBatch) return;

    try {
      setProcessingReturn(true);
      setReturnErrorMsg('');
      const targetDealerId = returningBatch.dealerId || (dealers[0] ? dealers[0].id : null);

      if (!targetDealerId) {
        setReturnErrorMsg('Please select a valid supplier/distributor for this return.');
        return;
      }

      const qty = parseInt(returnQty, 10);
      const unitPrice = parseFloat(returningBatch.purchasePrice || 0);
      const refund = Number((qty * unitPrice).toFixed(2));
      const gst = Number((refund * 0.12).toFixed(2));

      const payload = {
        dealerId: targetDealerId,
        medicineName: returningBatch.medicineName,
        batchNumber: returningBatch.batchNumber,
        quantity: qty,
        refundAmount: refund,
        gstReversal: gst,
        reason: returnReason
      };

      const res = await api.post('/purchase-orders/returns/purchase', payload);

      setReturnSuccessMsg(
        `Success! Return note generated for ${qty} tablets of ${returningBatch.medicineName} (Batch ${returningBatch.batchNumber}). Refund ₹${refund.toLocaleString('en-IN')}.`
      );

      // Refresh data
      await Promise.all([fetchDealers(), fetchNearExpiryReturns()]);

      if (selectedDealer) {
        const detailRes = await api.get(`/dealers/${selectedDealer.id}/dispatch-details`);
        setDispatchDetails(detailRes.data);
      }

      setTimeout(() => {
        setReturningBatch(null);
        setReturnSuccessMsg('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit purchase return', err);
      setReturnErrorMsg(err.response?.data?.error || 'Failed to process return to distributor.');
    } finally {
      setProcessingReturn(false);
    }
  };

  const totalNearExpiryCount = returnsData?.summary?.totalTabletsCount || 0;
  const totalNearExpiryBatches = returnsData?.summary?.totalBatchesCount || 0;
  const totalRefundAmount = returnsData?.summary?.totalRefundAmount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Supplier Ecosystem & Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Suppliers & Pharmaceutical Distributors
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Click on any dealer card to inspect pending tablet consignments, dispatch quantities, and restock requirements.
          </p>
        </div>

        {/* Action Button: Return Medicine (< 2 Months) */}
        <button
          onClick={() => setShowReturnsModal(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-rose-500/25 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return Medicine (&lt; 2 Months)</span>
          {totalNearExpiryBatches > 0 && (
            <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              {totalNearExpiryBatches} {totalNearExpiryBatches === 1 ? 'Batch' : 'Batches'}
            </span>
          )}
        </button>
      </div>

      {/* Near-Expiry Return Banner Highlight */}
      {totalNearExpiryBatches > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 p-4 sm:p-5 rounded-3xl text-white shadow-lg shadow-rose-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">Return Medicine Alert (&le; 60 Days / 2 Months Expiry)</h3>
                <span className="bg-white text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Action Recommended
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Found <strong className="text-white font-bold">{totalNearExpiryCount} tablets</strong> across{' '}
                <strong className="text-white font-bold">{totalNearExpiryBatches} batches</strong> with less than 2 months to expire in pharmacy.
                Total reclaimable refund: <strong className="text-white font-bold">{formatINR(totalRefundAmount)}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowReturnsModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-black rounded-xl shadow-md transition-all self-start sm:self-auto shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Review & Process Returns</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dealer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dealers.map((dealer) => {
          const hasPendingDispatch = (dealer.tabletsToDispatch || 0) > 0;
          return (
            <div
              key={dealer.id}
              onClick={() => handleOpenDealer(dealer)}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs dynamic-card hover:border-teal-500/80 space-y-4 cursor-pointer relative overflow-hidden group transition-all"
            >
              {/* Dynamic top gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>

              {/* Header with Company & Dispatch Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {dealer.companyName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Contact: {dealer.contactPerson}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    ACTIVE VENDOR
                  </span>
                  {hasPendingDispatch ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                      <Package className="w-3 h-3 text-amber-600" />
                      <span>{dealer.tabletsToDispatch} Tablets to Dispatch</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">0 Pending Orders</span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dealer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{dealer.email}</span>
                </div>
              </div>

              {/* Registration and Address */}
              <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/70 space-y-1 text-xs">
                <p>
                  <span className="text-slate-500">GSTIN:</span>{' '}
                  <strong className="font-mono text-slate-800">{dealer.gstin}</strong>
                </p>
                {dealer.dlNumber && (
                  <p>
                    <span className="text-slate-500">Drug License:</span>{' '}
                    <strong className="font-mono text-slate-800">{dealer.dlNumber}</strong>
                  </p>
                )}
                <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span>{dealer.address}</span>
                </div>
              </div>

              {/* Key Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Batches</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{dealer.totalBatchesSupplied}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Orders</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{dealer.totalOrders}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-900">
                  <p className="text-[9px] uppercase font-bold text-teal-700">To Dispatch</p>
                  <p className="text-base font-black text-teal-800 mt-0.5">{dealer.tabletsToDispatch || 0} Units</p>
                </div>
              </div>

              {/* Interactive Action Prompt */}
              <div className="pt-2 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
                <span>View Dispatch & Tablet Requirements</span>
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          GLOBAL "RETURN MEDICINE (< 2 MONTHS)" MODAL
          ======================================================== */}
      {showReturnsModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center font-black shadow-lg shadow-rose-500/25">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight">Return Medicine to Suppliers</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      &le; 2 MONTHS TABLETS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tablets in pharmacy inventory expiring in &le; 60 days. Initiate return notes to reclaim purchase cost & GST credit.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReturnsModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Eligible Batches</span>
                <span className="text-xl font-black text-rose-600 block mt-0.5">{totalNearExpiryBatches}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Tablets</span>
                <span className="text-xl font-black text-rose-700 block mt-0.5">{totalNearExpiryCount} Units</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Purchase Refund</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{formatINR(totalRefundAmount)}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs text-emerald-950">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">GST Credit Reversal</span>
                <span className="text-xl font-black text-emerald-700 block mt-0.5">
                  {formatINR(returnsData?.summary?.totalGstReversal || 0)}
                </span>
              </div>
            </div>

            {/* Table of Returnable Tablets */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loadingReturns ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading near-expiry tablets...
                </div>
              ) : !returnsData?.batches?.length ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No near-expiry tablets found!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    All tablets currently in your pharmacy store have safely more than 2 months of validity.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Medicine & Strength</th>
                        <th className="p-3 font-mono">Batch No.</th>
                        <th className="p-3">Expiry Date & Status</th>
                        <th className="p-3 text-right">Tablets In Stock</th>
                        <th className="p-3 text-right">Purchase ₹</th>
                        <th className="p-3 text-right">Refund Value (₹)</th>
                        <th className="p-3">Distributor</th>
                        <th className="p-3 text-center">Return Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnsData.batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-rose-50/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{batch.medicineName}</div>
                            <div className="text-[10px] text-slate-500">
                              {batch.genericName} • {batch.dosageForm} ({batch.productId})
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-700">{batch.batchNumber}</td>
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">{formatDate(batch.expiryDate)}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block w-fit ${
                                  batch.isExpired
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {batch.isExpired ? '⚠️ EXPIRED' : `🔴 Expiring in ${batch.daysRemaining} days`}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
                              {batch.remainingQuantity} Tablets
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-600">{formatINR(batch.purchasePrice)}</td>
                          <td className="p-3 text-right font-black text-emerald-800">{formatINR(batch.refundAmount)}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{batch.dealerName}</div>
                            {batch.dealerPhone && <div className="text-[10px] text-slate-500">{batch.dealerPhone}</div>}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleInitiateReturn(batch)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>Purchase Returns automatically update inventory stock and generate debit note vouchers.</span>
              </div>
              <button
                onClick={() => setShowReturnsModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Returns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PROCESS RETURN CONFIRMATION DIALOG
          ======================================================== */}
      {returningBatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Initiate Purchase Return</h3>
                  <p className="text-[11px] text-slate-500">Debit note generation to distributor</p>
                </div>
              </div>
              <button
                onClick={() => setReturningBatch(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {returnSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{returnSuccessMsg}</span>
              </div>
            )}

            {returnErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{returnErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Medicine:</span>
                  <span className="font-bold text-slate-900">{returningBatch.medicineName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Number:</span>
                  <span className="font-mono font-bold text-rose-700">{returningBatch.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiry Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(returningBatch.expiryDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available In Pharmacy:</span>
                  <span className="font-bold text-slate-900">{returningBatch.remainingQuantity} Tablets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Unit Price:</span>
                  <span className="font-semibold text-slate-800">{formatINR(returningBatch.purchasePrice)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return To Distributor / Dealer *</label>
                <select
                  value={returningBatch.dealerId || (dealers[0]?.id || '')}
                  onChange={(e) => setReturningBatch({ ...returningBatch, dealerId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white"
                  required
                >
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.companyName} ({d.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tablets To Return *</label>
                  <input
                    type="number"
                    min="1"
                    max={returningBatch.remainingQuantity}
                    required
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund Amount (₹)</label>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800 text-sm">
                    {formatINR((parseInt(returnQty || 0, 10) * parseFloat(returningBatch.purchasePrice || 0)))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Reason / Notes *</label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Near Expiry (< 2 Months) - Supplier Recall"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturningBatch(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReturn}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {processingReturn ? 'Processing...' : 'Confirm Return to Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DEALER DISPATCH DETAILS & TABLETS REQUIREMENT MODAL
          ======================================================== */}
      {selectedDealer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-teal-500/25">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight">{selectedDealer.companyName}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      DISPATCH INTELLIGENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contact: {selectedDealer.contactPerson} • Phone: {selectedDealer.phone} • GSTIN: {selectedDealer.gstin}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {loadingDetails ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-500">Loading dispatch calculations...</p>
              </div>
            ) : dispatchDetails ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                      Tablets In Active POs
                    </span>
                    <span className="text-2xl font-black text-teal-900 block mt-1">
                      {dispatchDetails.summary.totalTabletsToDispatch}
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                      {dispatchDetails.summary.pendingOrdersCount} pending orders
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      Restock Requirement
                    </span>
                    <span className="text-2xl font-black text-amber-900 block mt-1">
                      {dispatchDetails.summary.totalRecommendedTablets}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      Low & Out of stock items
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                      Total Dispatch Need
                    </span>
                    <span className="text-2xl font-black text-purple-900 block mt-1">
                      {dispatchDetails.summary.grandTotalDispatchNeed}
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                      Full supply requirement
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-950 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Near-Expiry Returns
                    </span>
                    <span className="text-2xl font-black text-rose-900 block mt-1">
                      {dispatchDetails.summary.nearExpiryTabletsCount || 0}
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                      {dispatchDetails.summary.nearExpiryBatchesCount || 0} batches (&le; 2 mo)
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('dispatch')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'dispatch'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Active PO Dispatches ({dispatchDetails.pendingDispatches.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('replenishment')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'replenishment'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Low Stock Needs ({dispatchDetails.replenishmentNeeds.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('returns')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'returns'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>⚡ Return Medicine ({dispatchDetails.nearExpiryBatches?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('batches')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'batches'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Store Batches ({dispatchDetails.suppliedBatches.length})</span>
                  </button>
                </div>

                {/* Tab 1: Active Purchase Order Consignments */}
                {activeTab === 'dispatch' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tablets Scheduled to be Dispatched from {selectedDealer.companyName}
                      </h4>
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        Total: {dispatchDetails.summary.totalTabletsToDispatch} Tablets
                      </span>
                    </div>

                    {dispatchDetails.pendingDispatches.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">All purchase orders delivered!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          No outstanding PO dispatches pending from this distributor.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Medicine & Strength</th>
                              <th className="p-3">Order Ref</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Batch Assigned</th>
                              <th className="p-3 text-right">Tablets To Dispatch</th>
                              <th className="p-3 text-right">Unit Price</th>
                              <th className="p-3 text-right">Total (₹)</th>
                              <th className="p-3">Expected Expiry</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dispatchDetails.pendingDispatches.map((item) => (
                              <tr key={item.id} className="hover:bg-teal-50/40 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{item.medicineName}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {item.genericName} • {item.dosageForm} ({item.productId})
                                  </div>
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-800">{item.orderNumber}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    {item.orderStatus}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-600">{item.batchNumber}</td>
                                <td className="p-3 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
                                    <Package className="w-3.5 h-3.5 text-teal-700" />
                                    <span>{item.tabletsToDispatch} Tablets</span>
                                  </span>
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">{formatINR(item.purchasePrice)}</td>
                                <td className="p-3 text-right font-bold text-slate-900">{formatINR(item.totalCost)}</td>
                                <td className="p-3 text-slate-600">{formatDate(item.expectedExpiry)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Low Stock Restock Requirements */}
                {activeTab === 'replenishment' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Store Stock Depletion & Recommended Dispatch from {selectedDealer.companyName}
                      </h4>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Total Needed: {dispatchDetails.summary.totalRecommendedTablets} Tablets
                      </span>
                    </div>

                    {dispatchDetails.replenishmentNeeds.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">All inventory levels healthy!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          No medicines supplied by this dealer are below the minimum safety threshold.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Medicine Name</th>
                              <th className="p-3">Stock Urgency</th>
                              <th className="p-3 text-right">Store Balance</th>
                              <th className="p-3 text-right">Min Stock Limit</th>
                              <th className="p-3 text-right">Recommended Dispatch</th>
                              <th className="p-3 text-right">Est. Cost (₹)</th>
                              <th className="p-3 text-center">Active Order</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dispatchDetails.replenishmentNeeds.map((need) => (
                              <tr key={need.medicineId} className="hover:bg-amber-50/40 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{need.medicineName}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {need.genericName} • {need.dosageForm} ({need.productId})
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      need.urgency === 'CRITICAL'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {need.reason}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-rose-600">{need.currentStock} Units</td>
                                <td className="p-3 text-right font-medium text-slate-500">{need.minStockLevel} Units</td>
                                <td className="p-3 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                                    <Package className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{need.recommendedTablets} Tablets</span>
                                  </span>
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900">{formatINR(need.estimatedCost)}</td>
                                <td className="p-3 text-center">
                                  {need.hasActiveOrder ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                                      PO IN PROGRESS
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Needs PO</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Near-Expiry Returns Specifically For This Dealer */}
                {activeTab === 'returns' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tablets (&le; 2 Months Expiry) to Return to {selectedDealer.companyName}
                      </h4>
                      <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        Refund Reclaimable: {formatINR(dispatchDetails.summary.nearExpiryRefundAmount || 0)}
                      </span>
                    </div>

                    {!dispatchDetails.nearExpiryBatches || dispatchDetails.nearExpiryBatches.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">No near-expiry tablets from this dealer!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          All batches supplied by {selectedDealer.companyName} have over 2 months validity.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Medicine</th>
                              <th className="p-3 font-mono">Batch Number</th>
                              <th className="p-3">Expiry & Status</th>
                              <th className="p-3 text-right">Remaining Stock</th>
                              <th className="p-3 text-right">Purchase Price</th>
                              <th className="p-3 text-right">Total Refund (₹)</th>
                              <th className="p-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dispatchDetails.nearExpiryBatches.map((b) => (
                              <tr key={b.id} className="hover:bg-rose-50/40 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{b.medicineName}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {b.genericName} • {b.dosageForm}
                                  </div>
                                </td>
                                <td className="p-3 font-mono font-bold text-rose-700">{b.batchNumber}</td>
                                <td className="p-3">
                                  <span className="font-semibold text-slate-800 block">{formatDate(b.expiryDate)}</span>
                                  <span className="text-[10px] font-bold text-rose-700">
                                    {b.isExpired ? 'EXPIRED' : `${b.daysRemaining} days left`}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-rose-900">{b.remainingQuantity} Tablets</td>
                                <td className="p-3 text-right text-slate-600">{formatINR(b.purchasePrice)}</td>
                                <td className="p-3 text-right font-black text-emerald-800">{formatINR(b.refundAmount)}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleInitiateReturn(b, selectedDealer.id)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Return</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: All Batches in Pharmacy from this Dealer */}
                {activeTab === 'batches' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        All Batches Supplied by {selectedDealer.companyName} Currently in Pharmacy
                      </h4>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {dispatchDetails.suppliedBatches.length} Batches • {dispatchDetails.summary.totalStockInPharmacy} Units Remaining
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Medicine & Code</th>
                            <th className="p-3">Batch Number</th>
                            <th className="p-3 text-right">Initial Qty</th>
                            <th className="p-3 text-right">Sold Qty</th>
                            <th className="p-3 text-right">Remaining Stock</th>
                            <th className="p-3 text-right">Purchase (₹)</th>
                            <th className="p-3 text-right">Selling (₹)</th>
                            <th className="p-3">Expiry Date & Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dispatchDetails.suppliedBatches.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{b.medicineName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{b.productId}</div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                              <td className="p-3 text-right text-slate-600">{b.initialQuantity}</td>
                              <td className="p-3 text-right text-slate-600">{b.soldQuantity}</td>
                              <td className="p-3 text-right font-black text-slate-900">{b.remainingQuantity}</td>
                              <td className="p-3 text-right font-medium text-slate-700">{formatINR(b.purchasePrice)}</td>
                              <td className="p-3 text-right font-medium text-slate-700">{formatINR(b.sellingPrice)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span>{formatDate(b.expiryDate)}</span>
                                  <ExpiryBadge expiryDate={b.expiryDate} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Verified Supplier Dispatch Channel • Indian Pharmacy Standard</span>
              </div>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

