import React from 'react';
import { ShieldCheck, UserCheck, Truck, Check, X, Lock } from 'lucide-react';

export default function SecurityAccessSection() {
  const permissions = [
    {
      feature: 'Full Business Financials & Ledgers',
      owner: true,
      staff: false,
      dealer: false,
      detail: 'Profit margins, net earnings, tax audit reports',
    },
    {
      feature: 'Counter Medicine Billing & POS',
      owner: true,
      staff: true,
      dealer: false,
      detail: 'Add customer, select batch, apply discount, print invoice',
    },
    {
      feature: 'FEFO Batch Selection',
      owner: true,
      staff: true,
      dealer: false,
      detail: 'Prioritize oldest valid batch at billing time',
    },
    {
      feature: 'Staff Activity & Shift Audits',
      owner: true,
      staff: false,
      dealer: false,
      detail: 'Review individual counter staff sales & voids',
    },
    {
      feature: 'Dealer Purchase Orders & Requisitions',
      owner: true,
      staff: false,
      dealer: true,
      detail: 'Create, approve, and dispatch replenishment orders',
    },
    {
      feature: 'Supplier Return Authorization',
      owner: true,
      staff: false,
      dealer: true,
      detail: 'Process near-expiry medicine credit requests',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Operational Separation of Duties</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Role-Based Access. Built for Pharmacy Operations.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Granular permissions safeguard your confidential margins and owner accounts while
            empowering staff with swift counter billing workflows.
          </p>
        </div>

        {/* 3-Column Permission Matrix */}
        <div className="bg-slate-50/80 rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-slate-900 text-white p-5 sm:p-6 items-center">
            <div className="col-span-6 sm:col-span-5 text-sm sm:text-base font-bold">
              Operational Scope & Permission
            </div>
            <div className="col-span-2 sm:col-span-2 text-center text-xs sm:text-sm font-bold flex flex-col items-center gap-1">
              <span className="p-1 rounded bg-purple-500/20 text-purple-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span>Owner</span>
            </div>
            <div className="col-span-2 sm:col-span-2 text-center text-xs sm:text-sm font-bold flex flex-col items-center gap-1">
              <span className="p-1 rounded bg-teal-500/20 text-teal-300">
                <UserCheck className="w-4 h-4" />
              </span>
              <span>Staff</span>
            </div>
            <div className="col-span-2 sm:col-span-3 text-center text-xs sm:text-sm font-bold flex flex-col items-center gap-1">
              <span className="p-1 rounded bg-blue-500/20 text-blue-300">
                <Truck className="w-4 h-4" />
              </span>
              <span>Dealer / Supplier</span>
            </div>
          </div>

          {/* Body Rows */}
          <div className="divide-y divide-slate-200">
            {permissions.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-white transition-colors"
              >
                <div className="col-span-6 sm:col-span-5 pr-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{row.feature}</h4>
                  <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                    {row.detail}
                  </p>
                </div>

                {/* Owner Column */}
                <div className="col-span-2 sm:col-span-2 flex justify-center">
                  {row.owner ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Staff Column */}
                <div className="col-span-2 sm:col-span-2 flex justify-center">
                  {row.staff ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200/60" title="Restricted from Staff">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Dealer Column */}
                <div className="col-span-2 sm:col-span-3 flex justify-center">
                  {row.dealer ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
