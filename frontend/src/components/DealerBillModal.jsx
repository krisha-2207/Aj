import React from 'react';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import {
  Printer,
  X,
  Truck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  QrCode,
  Store,
  FileCheck,
  Package
} from 'lucide-react';

export default function DealerBillModal({ bill, onClose }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const dealer = bill.dealer || {};
  const pharmacy = bill.pharmacy || {};
  const deliveryPerson = bill.deliveryPerson || {};
  const items = bill.items || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Actions Header */}
        <div className="no-print bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Truck className="w-5 h-5 text-teal-600" />
            <span>Dealer Stock Delivery Bill & Consignment Verification Challan</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Delivery Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Delivery Bill Body */}
        <div id="printable-dealer-bill" className="p-8 bg-white text-slate-800 text-xs">
          {/* Header & Title */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-600 text-white font-black text-xs px-2 py-0.5 rounded">
                  DISTRIBUTOR
                </span>
                <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  {dealer.companyName || 'Pharmaceutical Distributor'}
                </h1>
              </div>
              <p className="text-slate-600 font-medium mt-1">{dealer.address || 'Central Pharma Logistics Park, Bengaluru'}</p>
              <p className="text-slate-600 font-medium">
                Phone: <span className="font-semibold text-slate-800">{dealer.phone || '+91 98450 11223'}</span> • Email: {dealer.email || 'dispatch@medisupply.com'}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-700 font-mono">
                <span>GSTIN: <strong>{dealer.gstin || '29ABCDE1234F1Z1'}</strong></span>
                <span>•</span>
                <span>Wholesale DL No: <strong>{dealer.dlNumber || 'KA-B1-20B-998811 / 21B-998812'}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-2">
                DELIVERY CHALLAN & BILL
              </div>
              <p className="font-mono text-xs font-bold text-slate-900">
                Bill No: <span className="text-teal-700">{bill.billNumber}</span>
              </p>
              <p className="font-mono text-[11px] text-slate-500">
                Consignment ID: <span className="font-bold text-slate-800">{bill.consignmentId}</span>
              </p>
              <p className="text-slate-600 mt-1">
                Dispatch Date: <strong>{formatDate(bill.dispatchDate)}</strong>
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  {bill.status === 'DELIVERED_VERIFIED' ? 'DELIVERED & VERIFIED' : (bill.status === 'IN_TRANSIT' ? 'IN TRANSIT' : 'READY FOR DISPATCH')}
                </span>
              </div>
            </div>
          </div>

          {/* Parties & Verification Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-slate-200">
            {/* Consignee / Pharmacy Store & Owner Info */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold mb-2 uppercase text-[11px] tracking-wider">
                <Store className="w-4 h-4 text-teal-600" />
                <span>Destination Pharmacy (Consignee)</span>
              </div>
              <h3 className="font-black text-sm text-slate-950 uppercase">{pharmacy.name}</h3>
              <p className="text-slate-600 text-[11px] mt-0.5">{pharmacy.address}</p>
              <p className="text-slate-600 text-[11px]">Store Contact: {pharmacy.phone}</p>
              
              <div className="mt-2.5 pt-2.5 border-t border-slate-200">
                <div className="flex items-center gap-1 text-slate-700 font-bold text-[11px]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Owner Identification:</span>
                </div>
                <p className="text-slate-900 font-bold text-xs mt-0.5">
                  {pharmacy.ownerName || 'Dr. Krisha Patel (Owner & Lead Pharmacist)'}
                </p>
                <p className="text-slate-600 text-[11px]">
                  Owner Mobile: <span className="font-mono font-semibold text-slate-800">{pharmacy.ownerPhone || '+91 98765 00112'}</span>
                </p>
              </div>

              <div className="mt-2 text-[10px] font-mono text-slate-500 flex flex-wrap gap-2">
                <span>GSTIN: <strong>{pharmacy.gstin}</strong></span>
                <span>DL: <strong>{pharmacy.dlNumber}</strong></span>
              </div>
            </div>

            {/* Delivery Person & Transit Verification */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-indigo-800 font-bold mb-2 uppercase text-[11px] tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Delivery Person & Transit Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Delivery Agent:</span>
                    <strong className="text-slate-900">{deliveryPerson.name || 'Ramesh Kumar'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Agent Phone:</span>
                    <strong className="font-mono text-slate-900">{deliveryPerson.phone || '+91 98450 12345'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Transit Vehicle No:</span>
                    <strong className="font-mono text-slate-900">{deliveryPerson.vehicleNo || 'KA-04-E-8921'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Agent ID:</span>
                    <strong className="font-mono text-indigo-700">{deliveryPerson.deliveryAgentId || 'DLV-AGT-104'}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block">Security Verification Code:</span>
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-block mt-0.5">
                    {bill.verificationCode || 'VCODE-DL-8821'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">DIGITAL AUTH</span>
                  <span className="text-[10px] font-bold text-teal-700">QR SECURED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivered Stock Items Table */}
          <div className="my-5 overflow-x-auto">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-teal-600" />
                <span>Delivered Medicine Stock & Batch Verification</span>
              </span>
              <span className="text-slate-500 font-medium text-[11px]">
                Total Line Items: <strong>{items.length}</strong> • Total Units: <strong className="text-teal-700">{bill.totalUnits}</strong>
              </span>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 border-r border-slate-200">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Medicine & Manufacturer</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 font-mono">Batch No</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 text-center">HSN</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 text-center">MFG / EXP</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">Delivered Qty</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 text-center">GST %</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-500">{index + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{item.medicineName}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.dosageForm} • {item.manufacturer} • <span className="font-mono text-slate-400">{item.productId}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-800">
                      {item.batchNumber}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                      {item.hsnCode || '30049099'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center text-[10px]">
                      <span className="text-slate-500">{item.mfgDate ? formatDate(item.mfgDate) : '—'}</span>
                      <span className="block font-bold text-slate-800">{formatDate(item.expiryDate)}</span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-black text-teal-800">
                      {item.quantity} units
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                      {formatINR(item.purchasePrice)}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                      {item.gstRate || 12}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatINR(item.lineTotal || (item.quantity * item.purchasePrice * 1.12))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & Tax Breakup */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 border-t border-slate-200">
            <div className="text-[11px] text-slate-600 space-y-1 max-w-sm">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Delivery Declaration & Terms:</p>
              <p>1. Stock delivered in tamper-proof sealed pharmaceutical packaging.</p>
              <p>2. Products comply with Schedule M & Indian Drug and Cosmetics Act standards.</p>
              <p>3. Received stock must be verified by pharmacy owner / chief pharmacist within 24 hours.</p>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Base Value:</span>
                <span className="font-mono font-medium">{formatINR(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (6%):</span>
                <span className="font-mono font-medium">{formatINR(bill.cgst || (bill.totalGst / 2))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (6%):</span>
                <span className="font-mono font-medium">{formatINR(bill.sgst || (bill.totalGst / 2))}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                <span>Total GST (12%):</span>
                <span className="font-mono font-medium">{formatINR(bill.totalGst)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 border-t-2 border-slate-900 pt-2">
                <span>Grand Total (INR):</span>
                <span className="text-teal-700 font-mono">{formatINR(bill.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Dual Verification & Signatures Section */}
          <div className="grid grid-cols-2 gap-6 pt-8 mt-6 border-t-2 border-slate-300">
            {/* Box 1: Delivery Agent Verification */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-36">
              <div>
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                  1. Dispatched & Handed Over By
                </span>
                <span className="text-[10px] text-slate-500">Delivery Partner / Logistics Driver</span>
              </div>
              <div className="border-b border-dashed border-slate-400 my-2"></div>
              <div className="flex items-end justify-between text-[10px] text-slate-600">
                <div>
                  <span className="block font-bold text-slate-800">{deliveryPerson.name || 'Ramesh Kumar'}</span>
                  <span>Vehicle: {deliveryPerson.vehicleNo || 'KA-04-E-8921'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Date & Time</span>
                  <span className="font-medium">{formatDateTime(bill.dispatchDate)}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Pharmacy Owner Acceptance */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-36">
              <div>
                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                  2. Received, Inspected & Verified By
                </span>
                <span className="text-[10px] text-slate-500">Pharmacy Owner / Authorized Pharmacist Stamp</span>
              </div>
              <div className="border-b border-dashed border-slate-400 my-2"></div>
              <div className="flex items-end justify-between text-[10px] text-slate-600">
                <div>
                  <span className="block font-bold text-slate-900">
                    {pharmacy.ownerName || 'Dr. Krisha Patel'}
                  </span>
                  <span>PharmaFlow Retail Medical Store</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Physical Stamp / Sign</span>
                  <span className="font-bold text-emerald-700">VERIFIED OK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This is a computer-generated Pharmaceutical Delivery Bill and Stock Verification Document issued by {dealer.companyName}.
          </div>
        </div>
      </div>
    </div>
  );
}
