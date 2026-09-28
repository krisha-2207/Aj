import React from 'react';
import { formatINR, formatDateTime, formatDate } from '../utils/formatters';
import { Printer, X, CheckCircle2, Store } from 'lucide-react';

export default function InvoiceModal({ bill, onClose }) {
  if (!bill) return null;

  // Unwrap if nested in { bill: ... }
  const b = bill.bill || bill;

  const pharmacy = b.pharmacy || {
    name: 'PharmaFlow Retail Medical Store',
    address: '#42, 100ft Ring Road, Indiranagar, Bengaluru, Karnataka - 560038',
    phone: '+91 80 2528 9000',
    gstin: '29AAAAA0000A1Z5',
    dlNumber: 'KA-B1-20B-102934 / 21B-102935'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Actions Header */}
        <div className="no-print bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <span>Bill Generated & Inventory Stock Updated</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Content */}
        <div id="printable-invoice" className="p-8 bg-white text-slate-800">
          {/* Pharmacy Details Header */}
          <div className="text-center border-b pb-5 border-slate-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                PF
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                {pharmacy.name}
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium">{pharmacy.address}</p>
            <p className="text-xs text-slate-600 font-medium">Ph: {pharmacy.phone}</p>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-700">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                GSTIN: {pharmacy.gstin}
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Drug License: {pharmacy.dlNumber}
              </span>
            </div>
            <div className="mt-3">
              <span className="inline-block uppercase tracking-widest text-[11px] font-bold text-slate-600 border border-slate-300 px-3 py-0.5 rounded-full">
                Retail Tax Invoice / Cash Memo
              </span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <p>
                <span className="text-slate-500">Invoice No:</span>{' '}
                <strong className="font-mono text-slate-900">{b.billNumber || 'N/A'}</strong>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">Date & Time:</span>{' '}
                <span className="text-slate-900">{formatDateTime(b.createdAt || new Date())}</span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">Billed By:</span>{' '}
                <span className="text-slate-900">{b.staff?.name || 'Pharmacist Staff'}</span>
              </p>
              <p className="mt-1 text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                <span>Payment Mode:</span> <strong className="ml-1 uppercase">{b.paymentMethod || 'CASH'}</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <span className="text-slate-500">Customer Name:</span>
                <strong className="text-slate-900 text-sm">{b.customerName}</strong>
                {b.customerType === 'NEW' && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300 px-2 py-0.5 rounded-full">
                    ★ NEW CUSTOMER
                  </span>
                )}
              </div>
              <p className="mt-1">
                <span className="text-slate-500">Phone:</span>{' '}
                <strong className="text-slate-900">{b.customerPhone}</strong>
              </p>
              {b.customerAddress && (
                <p className="mt-1 text-[11px]">
                  <span className="text-slate-500">Address:</span>{' '}
                  <span className="text-slate-900">{b.customerAddress}</span>
                </p>
              )}
            </div>
          </div>

          {/* Medicines Items Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Medicine / Item</th>
                  <th className="py-2.5 px-2.5">Medicine Use / Info</th>
                  <th className="py-2.5 px-2 font-mono">Batch</th>
                  <th className="py-2.5 px-2">Expiry</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">MRP (₹)</th>
                  <th className="py-2.5 px-2 text-right">GST</th>
                  <th className="py-2.5 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(b.items || []).map((item, idx) => {
                  const usage =
                    item.usageInstructions ||
                    item.medicine?.dosageUsage ||
                    'General wellness / physician directed.';
                  const generic = item.medicine?.genericName;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50 align-top">
                      <td className="py-2.5 px-2 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <p className="font-bold text-slate-950">{item.medicine?.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.medicine?.productId} | {item.medicine?.manufacturer}
                        </p>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="max-w-xs">
                          {generic && (
                            <span className="text-[10px] text-slate-500 italic block mb-0.5">
                              ({generic})
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                            Use: {usage}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-700 font-medium">
                        {item.batch?.batchNumber || item.batchNumber || 'STANDARD'}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                        {formatDate(item.batch?.expiryDate || item.expiryDate)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600">
                        {item.gstRate || item.medicine?.gstRate || 12}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-950">
                        {formatINR(item.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 items-start text-xs">
            <div className="text-slate-500 space-y-1">
              <p>• Goods once sold can be returned within 7 days with original tax invoice.</p>
              <p>• Store medicines in a cool, dry place away from direct sunlight.</p>
              <p className="font-bold text-teal-800">Thank you for visiting PharmaFlow!</p>
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(b.subtotal || 0)}</span>
              </div>
              {b.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount:</span>
                  <span className="font-semibold">-{formatINR(b.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxes (GST Included):</span>
                <span className="font-semibold text-slate-900">{formatINR(b.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-teal-700">{formatINR(b.grandTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
