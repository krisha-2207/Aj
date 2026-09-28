import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import { ShoppingCart, CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionSuccess('');
    setActionError('');
    setProcessingId(orderId);

    try {
      const res = await api.patch(`/purchase-orders/${orderId}/status`, {
        status: newStatus
      });
      setActionSuccess(res.data.message);
      fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadges = {
    PENDING: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    APPROVED: { label: 'Approved by Pharmacy', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    DISPATCHED: { label: 'Dispatched by Dealer', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    RECEIVED: { label: 'Received & Stock Added', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dealer Purchase Orders & Supplies</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Review supply orders and mark as Received to automatically synchronize inventory batches
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading purchase orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            No purchase orders found.
          </div>
        ) : (
          orders.map((po) => {
            const badge = statusBadges[po.status] || statusBadges.PENDING;
            const isReceived = po.status === 'RECEIVED' || po.status === 'COMPLETED';

            return (
              <div key={po.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{po.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supplier: <strong className="text-slate-800">{po.dealer?.companyName}</strong> • Date: {formatDate(po.orderDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Status Action Buttons */}
                    {po.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                        disabled={processingId === po.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Approve Order
                      </button>
                    )}

                    {po.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                        disabled={processingId === po.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Confirm Received (Auto-Add Stock)</span>
                      </button>
                    )}

                    {po.status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                        disabled={processingId === po.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Mark Received & Add to Inventory</span>
                      </button>
                    )}

                    {isReceived && (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Inventory Synced</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                        <th className="py-2 px-3">Medicine</th>
                        <th className="py-2 px-3 font-mono">Batch Number</th>
                        <th className="py-2 px-2 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Purchase ₹</th>
                        <th className="py-2 px-3 text-right">Selling ₹</th>
                        <th className="py-2 px-3">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {po.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.medicine?.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{it.batchNumber}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">{it.quantity} units</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatINR(it.purchasePrice)}</td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">{formatINR(it.sellingPrice)}</td>
                          <td className="py-2 px-3 text-slate-600">{formatDate(it.expiryDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <p className="text-slate-500 italic">{po.notes || 'No special order notes.'}</p>
                  <p className="text-sm font-bold text-slate-900">
                    Total Order Value: <span className="text-emerald-700">{formatINR(po.totalAmount)}</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
