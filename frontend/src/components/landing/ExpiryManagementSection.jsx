import React, { useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';

export default function ExpiryManagementSection() {
  const [filter, setFilter] = useState('ALL');

  const expiryMedicines = [
    {
      name: 'Amoxicillin 250mg Clav',
      batch: 'AMX-2024-09',
      stock: '24 Strips',
      expiry: '28-Oct-2026',
      daysLeft: 34,
      status: 'RED',
      action: 'Supplier Return Recommended',
    },
    {
      name: 'Ciprofloxacin 500mg',
      batch: 'CIP-2024-03',
      stock: '15 Strips',
      expiry: '12-Nov-2026',
      daysLeft: 49,
      status: 'RED',
      action: 'Eligible for Dealer Return',
    },
    {
      name: 'Pantoprazole 40mg DSR',
      batch: 'PAN-2024-11',
      stock: '80 Strips',
      expiry: '15-Mar-2027',
      daysLeft: 172,
      status: 'NORMAL',
      action: 'Optimal Counter Rotation',
    },
    {
      name: 'Azithromycin 500mg',
      batch: 'AZI-2024-08',
      stock: '40 Strips',
      expiry: '20-May-2027',
      daysLeft: 238,
      status: 'NORMAL',
      action: 'Optimal Counter Rotation',
    },
  ];

  const filteredMedicines =
    filter === 'ALL'
      ? expiryMedicines
      : expiryMedicines.filter((m) => m.status === filter);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: Conceptual Rules & Status Matrix */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold mb-4">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Loss Prevention Engine</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Never Miss an Expiry
            </h2>

            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Near-expiry medicines can be identified for timely action and supplier return before
              they turn into non-recoverable dead stock.
            </p>

            {/* Status Definitions Card */}
            <div className="space-y-3.5 mb-6">
              {/* RED Status */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                      RED STATUS
                    </span>
                    <span className="text-xs font-semibold text-rose-900">
                      Expiry within 2 months (≤ 60 days)
                    </span>
                  </div>
                  <p className="text-xs text-rose-700/90 mt-1">
                    Triggers immediate visual alerts on POS checkout and generates a supplier return
                    requisition to claim manufacturer credit.
                  </p>
                </div>
              </div>

              {/* NORMAL Status */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                      NORMAL STATUS
                    </span>
                    <span className="text-xs font-semibold text-emerald-900">
                      Expiry more than 2 months away (&gt; 60 days)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700/90 mt-1">
                    Healthy inventory ready for standard counter billing and FEFO stock rotation.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              💡 <strong>Proactive Supplier Return:</strong> Most pharmaceutical distributors accept
              returns if submitted 30 to 45 days prior to expiration.
            </div>
          </div>

          {/* RIGHT: Live Expiry Tracker Simulator */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl">
              {/* Tracker Header & Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Live Expiry Control Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of shelf batches approaching expiration
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      filter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Batches
                  </button>
                  <button
                    onClick={() => setFilter('RED')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      filter === 'RED'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    Red (&lt; 60d)
                  </button>
                  <button
                    onClick={() => setFilter('NORMAL')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      filter === 'NORMAL'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    Normal (Safe)
                  </button>
                </div>
              </div>

              {/* Medicine Expiry Cards */}
              <div className="space-y-3">
                {filteredMedicines.map((med, idx) => {
                  const isRed = med.status === 'RED';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl bg-white border transition-all ${
                        isRed
                          ? 'border-rose-300 shadow-xs hover:border-rose-400'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            Batch: {med.batch} • Current Stock: {med.stock}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isRed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              RED • {med.daysLeft} Days Left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              NORMAL • {med.daysLeft} Days Left
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Expiry Date: <strong>{med.expiry}</strong>
                        </span>

                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isRed ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          {isRed && <RotateCcw className="w-3 h-3 text-rose-600" />}
                          {med.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
