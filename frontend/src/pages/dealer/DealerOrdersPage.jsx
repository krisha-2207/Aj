import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import DealerBillModal from '../../components/DealerBillModal';
import { ShoppingCart, Truck, CheckCircle2, AlertCircle, ReceiptText, Printer } from 'lucide-react';

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load dealer orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDispatched = async (orderId) => {
    setActionSuccess('');
    setActionError('');
    try {
      const res = await api.patch(`/purchase-orders/${orderId}/status`, {
        status: 'DISPATCHED'
      });
      setActionSuccess(res.data.message);
      fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const handleOpenOrderBill = (po) => {
    const items = (po.items || []).map((it) => {
      const lineBase = it.quantity * it.purchasePrice;
      const gstRate = 0.12;
      const lineGst = lineBase * gstRate;
      return {
        id: it.id,
        medicineName: it.medicine?.name || 'Medicine',
        productId: it.medicine?.productId || 'MED',
        category: it.medicine?.category || 'General',
        dosageForm: it.medicine?.dosageForm || 'Tablet',
        manufacturer: it.medicine?.manufacturer || 'Pharma Ltd',
        batchNumber: it.batchNumber,
        quantity: it.quantity,
        purchasePrice: it.purchasePrice,
        sellingPrice: it.sellingPrice || (it.purchasePrice * 1.5),
        mfgDate: it.mfgDate,
        expiryDate: it.expiryDate,
        hsnCode: '30049099',
        gstRate: 12,
        lineBase,
        lineGst,
        lineTotal: lineBase + lineGst
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineBase, 0);
    const totalGst = items.reduce((sum, item) => sum + item.lineGst, 0);
    const grandTotal = subtotal + totalGst;
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

    const bill = {
      id: `bill-po-${po.id}`,
      billNumber: `DL-CHALLAN-${po.orderNumber.replace('PO-', '')}`,
      consignmentId: `CNSG-${po.orderNumber.replace(/[^0-9]/g, '').slice(-5) || '99120'}`,
      verificationCode: `VCODE-${po.id.slice(-6).toUpperCase()}`,
      dispatchDate: po.orderDate,
      expectedDeliveryDate: new Date(new Date(po.orderDate).getTime() + 24 * 60 * 60 * 1000),
      status: po.status === 'RECEIVED' || po.status === 'COMPLETED' ? 'DELIVERED_VERIFIED' : (po.status === 'DISPATCHED' ? 'IN_TRANSIT' : 'PREPARING_DISPATCH'),
      dealer: po.dealer || {
        companyName: 'MediSupply India Pvt Ltd',
        phone: '+91 98450 11223',
        email: 'dealer1@medisupply.com',
        gstin: '29ABCDE1234F1Z1',
        dlNumber: 'KA-B1-20B-998811 / 21B-998812',
        address: '#102, Pharma City Logistics Park, Peenya, Bengaluru, Karnataka'
      },
      pharmacy: {
        name: 'PharmaFlow Retail Medical Store',
        address: '#42, 100ft Ring Road, Indiranagar, Bengaluru, Karnataka - 560038',
        phone: '+91 80 2528 9000',
        email: 'contact@pharmaflow.com',
        gstin: '29AAAAA0000A1Z5',
        dlNumber: 'KA-B1-20B-102934 / 21B-102935',
        ownerName: 'Dr. Krisha Patel (Owner & Chief Pharmacist)',
        ownerPhone: '+91 98765 00112'
      },
      deliveryPerson: {
        name: 'Ramesh Kumar',
        phone: '+91 98450 12345',
        vehicleNo: 'KA-04-E-8921 (Mahindra Bolero Maxi)',
        deliveryAgentId: 'DLV-AGT-104'
      },
      items,
      totalUnits,
      subtotal: Number(subtotal.toFixed(2)),
      cgst: Number((totalGst / 2).toFixed(2)),
      sgst: Number((totalGst / 2).toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      notes: po.notes || 'Purchase Order delivery challan & verified stock record'
    };

    setSelectedBill(bill);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders Received from Pharmacy</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Procurement requests issued by PharmaFlow Pharmacy to your distributorship
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
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            No orders found for your distributorship.
          </div>
        ) : (
          orders.map((po) => (
            <div key={po.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{po.orderNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        po.status === 'RECEIVED' || po.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : po.status === 'DISPATCHED'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Order Date: {formatDate(po.orderDate)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenOrderBill(po)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                    <span>Delivery Bill / Challan</span>
                  </button>

                  {po.status === 'APPROVED' && (
                    <button
                      onClick={() => handleMarkDispatched(po.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark Dispatched</span>
                    </button>
                  )}
                  {(po.status === 'RECEIVED' || po.status === 'COMPLETED') && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Delivered & Stocked
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                      <th className="py-2 px-3">Medicine</th>
                      <th className="py-2 px-3 font-mono">Batch Number</th>
                      <th className="py-2 px-2 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Wholesale Rate (₹)</th>
                      <th className="py-2 px-3">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{it.medicine?.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{it.batchNumber}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">{it.quantity}</td>
                        <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatINR(it.purchasePrice)}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDate(it.expiryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500">{po.notes || 'Standard pharmaceutical order'}</span>
                <span className="text-sm font-bold text-slate-900">
                  Total Value: <strong className="text-emerald-700 font-mono">{formatINR(po.totalAmount)}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printable Delivery Bill Modal */}
      {selectedBill && (
        <DealerBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}
