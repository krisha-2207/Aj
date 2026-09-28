import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import DealerBillModal from '../../components/DealerBillModal';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  Truck,
  ShoppingCart,
  PackageCheck,
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  Pill,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Boxes,
  ReceiptText
} from 'lucide-react';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' | 'orders' | 'batches'
  const [selectedBillForModal, setSelectedBillForModal] = useState(null);

  // Supply / Dispatch Modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [medicinesList, setMedicinesList] = useState([]);
  const [supplyForm, setSupplyForm] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    mfgDate: '',
    expiryDate: ''
  });
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, reqsRes] = await Promise.all([
        api.get('/dealers/my-portal/data'),
        api.get('/dealers/requirements').catch(() => ({ data: [] }))
      ]);
      setData(dashRes.data);
      setRequirements(reqsRes.data || []);
    } catch (err) {
      console.error('Failed to load dealer data', err);
    } finally {
      setLoading(false);
    }
  };

  const openQuickDispatchModal = (req) => {
    setSelectedReq(req);
    const today = new Date().toISOString().split('T')[0];
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 2);
    const expFormatted = expDate.toISOString().split('T')[0];

    setSupplyForm({
      medicineId: req.medicineId,
      batchNumber: `DLR-${req.productId}-${Date.now().toString().slice(-4)}`,
      quantity: req.recommendedQuantity || 50,
      purchasePrice: 24.50,
      sellingPrice: 38.00,
      mfgDate: today,
      expiryDate: expFormatted
    });
    setActionError('');
    setActionSuccess('');
    setShowSupplyModal(true);
  };

  const openGeneralSupplyModal = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicinesList(res.data);
      setSelectedReq(null);
      setSupplyForm({
        medicineId: '',
        batchNumber: `DLR-${Date.now().toString().slice(-5)}`,
        quantity: '50',
        purchasePrice: '',
        sellingPrice: '',
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
      setShowSupplyModal(true);
      setActionSuccess('');
      setActionError('');
    } catch (err) {
      console.error('Failed to load medicines list', err);
    }
  };

  const handleSupplySubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsSubmitting(true);

    try {
      if (selectedReq) {
        // Accept requirement and dispatch order
        const res = await api.post(`/dealers/requirements/${selectedReq.medicineId}/accept`, supplyForm);
        setActionSuccess(res.data.message || 'Requirement accepted and marked as DISPATCHED.');
      } else {
        // Direct supply
        const res = await api.post('/dealers/my-portal/supply', supplyForm);
        setActionSuccess(res.data.message || 'Medicines supplied successfully to pharmacy inventory.');
      }
      setShowSupplyModal(false);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to process consignment dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDispatched = async (poId) => {
    try {
      await api.patch(`/purchase-orders/${poId}/status`, { status: 'DISPATCHED' });
      setActionSuccess('Purchase order marked as DISPATCHED to pharmacy.');
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const openBillForBatch = (b) => {
    const lineBase = b.initialQuantity * b.purchasePrice;
    const gstRate = 0.12;
    const lineGst = lineBase * gstRate;
    const lineTotal = lineBase + lineGst;

    const bill = {
      id: `bill-batch-${b.id}`,
      billNumber: `DL-CHALLAN-BT-${b.batchNumber}`,
      consignmentId: `CNSG-${b.productId}-${b.batchNumber.slice(-4)}`,
      verificationCode: `VCODE-${b.id.slice(-6).toUpperCase()}`,
      dispatchDate: b.supplyDate || new Date(),
      expectedDeliveryDate: b.supplyDate || new Date(),
      status: 'DELIVERED_VERIFIED',
      dealer: data?.dealer || {
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
      items: [
        {
          id: b.id,
          medicineName: b.medicineName,
          productId: b.productId,
          category: b.category || 'General',
          dosageForm: 'Tablet',
          manufacturer: b.manufacturer || 'Pharma Ltd',
          batchNumber: b.batchNumber,
          quantity: b.initialQuantity,
          purchasePrice: b.purchasePrice,
          sellingPrice: b.sellingPrice,
          mfgDate: b.mfgDate,
          expiryDate: b.expiryDate,
          hsnCode: '30049099',
          gstRate: 12,
          lineBase,
          lineGst,
          lineTotal
        }
      ],
      totalUnits: b.initialQuantity,
      subtotal: Number(lineBase.toFixed(2)),
      cgst: Number((lineGst / 2).toFixed(2)),
      sgst: Number((lineGst / 2).toFixed(2)),
      totalGst: Number(lineGst.toFixed(2)),
      grandTotal: Number(lineTotal.toFixed(2)),
      notes: 'Batch delivery challan & verified stock record'
    };

    setSelectedBillForModal(bill);
  };

  const openBillForOrder = (po) => {
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
      dealer: po.dealer || data?.dealer || {
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

    setSelectedBillForModal(bill);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { dealer, stats, batches, orders } = data;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const confirmedOrders = orders.filter((o) => o.status === 'APPROVED');
  const dispatchedOrders = orders.filter((o) => o.status === 'DISPATCHED');
  const completedOrders = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Supplier Consignment Portal — {dealer.companyName}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Designated Partner Store: <strong className="text-slate-800">{dealer.assignedPharmacy?.name}</strong> • GSTIN: <span className="font-mono">{dealer.gstin}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dealer/bills')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <ReceiptText className="w-4 h-4 text-teal-400" />
            <span>Delivery Bills & Challans</span>
          </button>
          <button
            onClick={openGeneralSupplyModal}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Supply New Batch</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-700 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* Section 10 Dealer KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="New Requirements"
          value={requirements.length}
          subtitle="Low/Out of stock alerts"
          icon={AlertTriangle}
          color="rose"
          alert={requirements.length > 0 ? `${requirements.length} items needed` : null}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders.length}
          subtitle="Awaiting acceptance"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Confirmed"
          value={confirmedOrders.length}
          subtitle="Ready to pack"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Dispatched"
          value={dispatchedOrders.length}
          subtitle="In transit to store"
          icon={Truck}
          color="teal"
        />
        <StatCard
          title="Completed"
          value={completedOrders.length}
          subtitle="Stock verified & received"
          icon={PackageCheck}
          color="emerald"
        />
        <StatCard
          title="Total Supplied"
          value={`${stats.totalSuppliedItems} u`}
          subtitle="Cumulative units sent"
          icon={Layers}
          color="slate"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requirements'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Automated Requirements ({requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Purchase Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'batches'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Supplied Batches ({batches.length})</span>
        </button>
      </div>

      {/* Tab 1: Automated Requirements from Pharmacy */}
      {activeTab === 'requirements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/40 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Live Pharmacy Stock Replenishment Requirements
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically triggered when private pharmacy inventory drops ≤ Minimum Stock Level. Accept to dispatch fresh batches directly.
              </p>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300 shrink-0">
              {requirements.length} Active Stock Deficits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Product ID</th>
                  <th className="py-2.5 px-3">Medicine & Generic</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Deficit Status</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Min Stock</th>
                  <th className="py-2.5 px-3 text-right">Recommended Qty</th>
                  <th className="py-2.5 px-3 text-right">Est. Cost (₹)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirements.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      All pharmacy medicines are safely stocked above minimum levels. No new replenishment required.
                    </td>
                  </tr>
                ) : (
                  requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{req.productId}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{req.medicineName}</p>
                        <p className="text-[10px] text-slate-500">{req.genericName} • {req.dosageForm || 'Tablet'}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{req.category}</td>
                      <td className="py-3 px-3 text-center">
                        {req.reason === 'OUT OF STOCK' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            ● OUT OF STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ▲ LOW STOCK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-600">
                        {req.currentStock} units
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {req.minStockLevel}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-teal-800">
                        {req.recommendedQuantity} units
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(req.estimatedCost)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openQuickDispatchModal(req)}
                          className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Accept & Dispatch</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Store Purchase Orders & Consignments
              </h3>
              <p className="text-[11px] text-slate-500">
                Official orders placed by the pharmacy management
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-200/60 px-2.5 py-1 rounded-lg">
              {orders.length} Total Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Ordered Items</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Order Date</th>
                  <th className="py-2.5 px-3">Received By Store</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{po.orderNumber}</td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {po.items?.map((it) => (
                            <p key={it.id} className="text-[11px] text-slate-700">
                              • <strong className="text-slate-900">{it.medicine?.name}</strong>: {it.quantity} units (Batch: {it.batchNumber})
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatINR(po.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'RECEIVED' || po.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : po.status === 'DISPATCHED'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : po.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(po.orderDate)}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {po.receivedDate ? (
                          <span className="text-emerald-700 font-semibold">{formatDate(po.receivedDate)}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending delivery</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openBillForOrder(po)}
                            className="bg-slate-900 hover:bg-teal-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <ReceiptText className="w-3 h-3" />
                            <span>Bill</span>
                          </button>
                          {po.status === 'APPROVED' || po.status === 'PENDING' ? (
                            <button
                              onClick={() => handleMarkDispatched(po.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer"
                            >
                              Mark Dispatched
                            </button>
                          ) : po.status === 'DISPATCHED' ? (
                            <span className="text-[10px] font-semibold text-teal-700">In Transit</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700">Verified</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Supplied Batches */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supplied Medicine Batches & Current Pharmacy Stock
              </h3>
              <p className="text-[11px] text-slate-500">
                Direct live sync with the Pharmacy Inventory
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              {batches.length} Batches Supplied
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">Product ID</th>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3 font-mono">Batch Number</th>
                  <th className="py-2.5 px-2 text-right">Initial Supplied</th>
                  <th className="py-2.5 px-2 text-right">Remaining Stock</th>
                  <th className="py-2.5 px-3 text-right">Wholesale Price (₹)</th>
                  <th className="py-2.5 px-3">Supply Date</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3 text-center">Delivery Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      No medicine batches supplied yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{b.productId}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{b.medicineName}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{b.batchNumber}</td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-700">{b.initialQuantity} units</td>
                      <td className="py-3 px-2 text-right font-bold text-teal-700">{b.remainingQuantity} units</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 font-mono">{formatINR(b.purchasePrice)}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(b.supplyDate)}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{formatDate(b.expiryDate)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openBillForBatch(b)}
                          className="bg-slate-900 hover:bg-teal-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <ReceiptText className="w-3 h-3" />
                          <span>Delivery Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct Supply / Accept Requirement Modal */}
      {showSupplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {selectedReq ? `Dispatch Consignment for ${selectedReq.medicineName}` : 'Supply Medicines to Pharmacy'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedReq
                ? `Fulfilling requirement ${selectedReq.productId}. A purchase order marked as DISPATCHED will be generated.`
                : 'Supplied items will be directly booked into the pharmacy inventory without duplicate entry.'}
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSupplySubmit} className="space-y-3.5 text-xs">
              {!selectedReq && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Medicine *</label>
                  <select
                    required
                    value={supplyForm.medicineId}
                    onChange={(e) => setSupplyForm({ ...supplyForm, medicineId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Medicine Catalog Item</option>
                    {medicinesList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.productId}) - {m.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={supplyForm.batchNumber}
                    onChange={(e) => setSupplyForm({ ...supplyForm, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-X"
                    className="w-full p-2.5 border border-slate-300 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Supplied *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={supplyForm.quantity}
                    onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wholesale Purchase Price ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={supplyForm.purchasePrice}
                    onChange={(e) => setSupplyForm({ ...supplyForm, purchasePrice: e.target.value })}
                    placeholder="Rate charged to pharmacy"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retail MRP ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={supplyForm.sellingPrice}
                    onChange={(e) => setSupplyForm({ ...supplyForm, sellingPrice: e.target.value })}
                    placeholder="Retail MRP"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    value={supplyForm.mfgDate}
                    onChange={(e) => setSupplyForm({ ...supplyForm, mfgDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={supplyForm.expiryDate}
                    onChange={(e) => setSupplyForm({ ...supplyForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplyModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing Dispatch...' : selectedReq ? 'Confirm & Dispatch to Store' : 'Supply to Pharmacy Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Dealer Delivery Bill Modal */}
      {selectedBillForModal && (
        <DealerBillModal
          bill={selectedBillForModal}
          onClose={() => setSelectedBillForModal(null)}
        />
      )}
    </div>
  );
}
