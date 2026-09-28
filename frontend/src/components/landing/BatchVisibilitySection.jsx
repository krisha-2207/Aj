import React from 'react';
import { Layers, Calendar, CheckCircle2, ShieldCheck, ArrowRight, Zap, Info } from 'lucide-react';

export default function BatchVisibilitySection() {
  return (
    <section className="py-20 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: Text & Explanation */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-4">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Multi-Batch Management</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Complete Batch Visibility
            </h2>

            <p className="text-slate-600 text-base leading-relaxed mb-6">
              The system tracks multiple batches of the same medicine independently, allowing
              the pharmacy to identify available quantity and expiry date for each batch.
            </p>

            <div className="space-y-3.5 mb-8">
              <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Separate Stock Quantities</h4>
                  <p className="text-[11px] text-slate-500">
                    Know exact shelf count per batch rather than one misleading total number.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">FEFO Automated Suggestion</h4>
                  <p className="text-[11px] text-slate-500">
                    Counter billing automatically pulls from Batch 1 before touching newer Batch 2.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Compliance & Recall Protection</h4>
                  <p className="text-[11px] text-slate-500">
                    Trace which customer bought which batch in case of distributor product recalls.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual UI Demonstration for Paracetamol 500mg */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative">
              {/* Top Banner of the Medicine Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Active Stock Item
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Paracetamol 500mg
                  </h3>
                  <p className="text-xs text-slate-500">
                    Form: Tablets • Category: Analgesic & Antipyretic • Total Available: 120 Units
                  </p>
                </div>

                <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Total Active Batches
                  </span>
                  <span className="text-base font-bold text-slate-800">2 Batches</span>
                </div>
              </div>

              {/* Batches Comparison Display */}
              <div className="space-y-4">
                {/* BATCH 1 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/40 border-2 border-teal-500/40 relative shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Batch 1</span>
                      <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        #PARA-2024-B1
                      </span>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-300">
                      ⚡ FEFO Priority #1 (Dispensing Now)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Initial Stock</span>
                      <span className="text-sm font-bold text-slate-700">50 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Sold at Counter</span>
                      <span className="text-sm font-bold text-teal-700">30 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Remaining Stock</span>
                      <span className="text-sm font-black text-slate-900">20 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                      <span className="text-sm font-bold text-slate-800">10-Nov-2026</span>
                    </div>
                  </div>

                  {/* Stock depletion visual bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Batch 1 Depletion Progress (60% dispensed)</span>
                      <span className="font-semibold text-emerald-700">Safe Status</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full w-[60%]"></div>
                    </div>
                  </div>
                </div>

                {/* BATCH 2 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 relative">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Batch 2</span>
                      <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        #PARA-2025-B2
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      🔒 FEFO Priority #2 (Held in Reserve)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">New Stock</span>
                      <span className="text-sm font-bold text-slate-700">100 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Sold</span>
                      <span className="text-sm font-bold text-slate-500">0 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Remaining Stock</span>
                      <span className="text-sm font-black text-slate-900">100 Units</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                      <span className="text-sm font-bold text-slate-800">20-Feb-2027</span>
                    </div>
                  </div>

                  {/* Stock depletion visual bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Reserve Batch (Unopened)</span>
                      <span className="font-semibold text-emerald-700">Safe Status</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full w-[0%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom explanatory note */}
              <div className="mt-5 p-3 rounded-xl bg-teal-50/60 border border-teal-200/60 text-teal-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  <strong>Automatic FEFO Protection:</strong> Counter staff cannot accidentally bill
                  from Batch 2 while Batch 1 still has 20 units remaining.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
