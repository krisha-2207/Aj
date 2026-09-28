import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import DealerBillModal from '../../components/DealerBillModal';
import {
  ReceiptText,
  Truck,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building2,
  Store,
  UserCheck,
  FileText,
  Boxes,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function DealerBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBill, setSelectedBill] = useState(null);

  // New Custom Delivery Bill Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchesList, setBatchesList] = useState([]);
  const [newBillForm, setNewBillForm] = useState({
    batchId: '',
    quantity: '',
    deliveryAgentName: 'Ramesh Kumar',
    deliveryAgentPhone: '+91 98450 12345',
    vehicleNo: 'KA-04-E-8921 (Mahindra Bolero Maxi)',
    notes: 'Regular pharmaceutical delivery'
  });
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dealers/delivery-bills');
      setBills(res.data || []);
    } catch (err) {
      console.error('Failed to load delivery bills', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDeliveryBillModal = async () => {
    try {
      const res = await api.get('/dealers/my-portal/data');
      setBatchesList(res.data.batches || []);
      if (res.data.batches && res.data.batches.length > 0) {
        setNewBillForm((prev) => ({
          ...prev,
          batchId: res.data.batches[0].id,
          quantity: res.data.batches[0].remainingQuantity || 50
        }));
      }
      setShowCreateModal(true);
      setCreateError('');
      setCreateSuccess('');
    } catch (err) {
      console.error('Failed to fetch batches for custom bill', err);
    }
  };

  const handleCreateCustomBill = (e) => {
    e.preventDefault();
    const batch = batchesList.find((b) => b.id === newBillForm.batchId);
    if (!batch) {
      setCreateError('Please select a medicine batch');
      return;
    }

    const qty = parseInt(newBillForm.quantity, 10) || 50;
    const lineBase = qty * batch.purchasePrice;
    const gstRate = 0.12;
    const lineGst = lineBase * gstRate;
    const lineTotal = lineBase + lineGst;

    const currentYear = new Date().getFullYear();
    const randNum = Math.floor(1000 + Math.random() * 9000);

    const newBill = {
      id: `bill-custom-${Date.now()}`,
      sourceType: 'CUSTOM_DISPATCH',
      referenceId: batch.id,
      orderNumber: `DLV-${currentYear}-${randNum}`,
      billNumber: `DL-CHALLAN-${currentYear}-${randNum}`,
      consignmentId: `CNSG-${randNum}`,
      verificationCode: `VCODE-DL-${randNum}`,
      dispatchDate: new Date(),
      expectedDeliveryDate: new Date(),
      status: 'DELIVERED_VERIFIED',
      dealer: {
        companyName: batch.manufacturer ? `${batch.manufacturer} Distributorship` : 'MediSupply India Pvt Ltd',
        contactPerson: 'Vikram Mehta',
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
        name: newBillForm.deliveryAgentName,
        phone: newBillForm.deliveryAgentPhone,
        vehicleNo: newBillForm.vehicleNo,
        deliveryAgentId: `DLV-AGT-${Math.floor(100 + Math.random() * 900)}`
      },
      items: [
        {
          id: batch.id,
          medicineName: batch.medicineName,
          productId: batch.productId,
          category: batch.category || 'General',
          dosageForm: 'Tablet',
          manufacturer: batch.manufacturer || 'Pharma Ltd',
          batchNumber: batch.batchNumber,
          quantity: qty,
          purchasePrice: batch.purchasePrice,
          sellingPrice: batch.sellingPrice,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          hsnCode: '30049099',
          gstRate: 12,
          lineBase,
          lineGst,
          lineTotal
        }
      ],
      totalUnits: qty,
      subtotal: Number(lineBase.toFixed(2)),
      cgst: Number((lineGst / 2).toFixed(2)),
      sgst: Number((lineGst / 2).toFixed(2)),
      totalGst: Number(lineGst.toFixed(2)),
      grandTotal: Number(lineTotal.toFixed(2)),
      notes: newBillForm.notes || 'On-demand stock delivery challan'
    };

    setBills((prev) => [newBill, ...prev]);
    setShowCreateModal(false);
    setSelectedBill(newBill); // Open the generated bill immediately for preview & printing
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.billNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.consignmentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.deliveryPerson?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.items?.some((i) => i.medicineName?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'VERIFIED' && b.status === 'DELIVERED_VERIFIED') ||
        (statusFilter === 'TRANSIT' && b.status === 'IN_TRANSIT') ||
        (statusFilter === 'PREPARING' && b.status === 'PREPARING_DISPATCH');

      return matchesSearch && matchesStatus;
    });
  }, [bills, searchQuery, statusFilter]);

  // Totals for top cards
  const stats = useMemo(() => {
    const totalBills = bills.length;
    const totalUnits = bills.reduce((sum, b) => sum + (b.totalUnits || 0), 0);
    const totalValue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const verifiedCount = bills.filter((b) => b.status === 'DELIVERED_VERIFIED').length;
    return { totalBills, totalUnits, totalValue, verifiedCount };
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-7 h-7 text-teal-600" />
            <span>Dealer Delivery Bills & Verification Challans</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official delivery bills issued to partner pharmacies for delivery agent verification and pharmacy owner acceptance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateDeliveryBillModal}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Delivery Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Delivery Bills</span>
            <span className="text-xl font-black text-slate-900">{stats.totalBills}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Delivered Units</span>
            <span className="text-xl font-black text-emerald-800">{stats.totalUnits} <span className="text-xs font-normal">units</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Consignment Value</span>
            <span className="text-xl font-black text-slate-900">{formatINR(stats.totalValue)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Owner Verified</span>
            <span className="text-xl font-black text-slate-900">{stats.verifiedCount} <span className="text-xs font-normal">bills</span></span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Bill No, Medicine, Consignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'VERIFIED', 'TRANSIT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Challans' : st === 'VERIFIED' ? 'Verified & Delivered' : 'In Transit'}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-mono">Bill No / Consignment</th>
                <th className="py-3.5 px-3">Destination Pharmacy & Owner</th>
                <th className="py-3.5 px-3">Delivery Partner & Vehicle</th>
                <th className="py-3.5 px-3">Items Summary</th>
                <th className="py-3.5 px-2 text-right">Qty</th>
                <th className="py-3.5 px-3 text-right">Total Amount (₹)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading delivery bills & challans...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    No delivery bills found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Bill / Consignment */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">{b.billNumber}</div>
                      <div className="font-mono text-[10px] text-teal-700 font-semibold">{b.consignmentId}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(b.dispatchDate)}</div>
                    </td>

                    {/* Pharmacy & Owner Identification */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{b.pharmacy?.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Owner: <strong className="text-slate-800">{b.pharmacy?.ownerName?.split('(')[0]}</strong></span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        GST: {b.pharmacy?.gstin}
                      </div>
                    </td>

                    {/* Delivery Partner */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{b.deliveryPerson?.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {b.deliveryPerson?.vehicleNo}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Ph: {b.deliveryPerson?.phone}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">
                        {b.items?.[0]?.medicineName}
                        {b.items?.length > 1 && (
                          <span className="text-slate-400 font-normal ml-1">+{b.items.length - 1} more</span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Batch: {b.items?.[0]?.batchNumber}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-2 text-right font-black text-slate-900">
                      {b.totalUnits} <span className="text-[10px] font-normal text-slate-500">u</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 text-right font-black text-teal-800 font-mono">
                      {formatINR(b.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          b.status === 'DELIVERED_VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : b.status === 'IN_TRANSIT'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {b.status === 'DELIVERED_VERIFIED' ? 'Verified OK' : (b.status === 'IN_TRANSIT' ? 'In Transit' : 'Dispatching')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedBill(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate Custom Delivery Bill */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-teal-800 font-black text-base">
                <ReceiptText className="w-5 h-5 text-teal-600" />
                <span>Generate Stock Delivery Challan</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 mb-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCustomBill} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Medicine Batch to Deliver *</label>
                <select
                  value={newBillForm.batchId}
                  onChange={(e) => setNewBillForm({ ...newBillForm, batchId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {batchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.medicineName} — Batch {b.batchNumber} (Rate: ₹{b.purchasePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivered Quantity (Units) *</label>
                <input
                  type="number"
                  min="1"
                  value={newBillForm.quantity}
                  onChange={(e) => setNewBillForm({ ...newBillForm, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Agent Name *</label>
                  <input
                    type="text"
                    value={newBillForm.deliveryAgentName}
                    onChange={(e) => setNewBillForm({ ...newBillForm, deliveryAgentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Agent Contact No *</label>
                  <input
                    type="text"
                    value={newBillForm.deliveryAgentPhone}
                    onChange={(e) => setNewBillForm({ ...newBillForm, deliveryAgentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transit Vehicle Number *</label>
                <input
                  type="text"
                  value={newBillForm.vehicleNo}
                  onChange={(e) => setNewBillForm({ ...newBillForm, vehicleNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium font-mono"
                  placeholder="e.g. KA-04-E-8921 (Mahindra Bolero)"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Generate & Preview Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Dealer Bill Modal */}
      {selectedBill && (
        <DealerBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}
