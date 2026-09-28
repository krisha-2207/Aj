import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import ExpiryBadge from '../../components/ExpiryBadge';
import DealerBillModal from '../../components/DealerBillModal';
import { Printer, ReceiptText, Boxes } from 'lucide-react';

export default function DealerBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [dealerData, setDealerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dealers/my-portal/data');
      setBatches(res.data.batches || []);
      setDealerData(res.data.dealer || null);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBill = (b) => {
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
      dealer: dealerData || {
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

    setSelectedBill(bill);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplied Batch Records</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Detailed manufacturing and expiry lifecycle of batches delivered to the pharmacy
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 font-mono">Batch Number</th>
                <th className="py-3 px-3">Medicine & Product ID</th>
                <th className="py-3 px-2 text-right">Initial Supplied</th>
                <th className="py-3 px-2 text-right">Remaining in Store</th>
                <th className="py-3 px-3 text-right">Wholesale Rate (₹)</th>
                <th className="py-3 px-3">Mfg Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Expiry Status</th>
                <th className="py-3 px-4 text-center">Delivery Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    No batches found.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{b.medicineName}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-1.5">({b.productId})</span>
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-slate-700">{b.initialQuantity} units</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-700">{b.remainingQuantity} units</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">{formatINR(b.purchasePrice)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(b.mfgDate)}</td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{formatDate(b.expiryDate)}</td>
                    <td className="py-3 px-3 text-center">
                      <ExpiryBadge expiryDate={b.expiryDate} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenBill(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        <ReceiptText className="w-3.5 h-3.5" />
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

      {/* Delivery Bill Modal */}
      {selectedBill && (
        <DealerBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
}
