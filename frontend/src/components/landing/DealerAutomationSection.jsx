import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  FileText,
  Truck,
  Send,
  Boxes,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCw
} from 'lucide-react';

export default function DealerAutomationSection() {
  const [demoTriggered, setDemoTriggered] = useState(false);

  const pipeline = [
    {
      step: '01',
      title: 'Pharmacy Inventory',
      desc: 'Shelf units continuously counted during sales.',
      icon: Package,
    },
    {
      step: '02',
      title: 'Low Stock Detection',
      desc: 'Safety threshold triggers when units fall below min limit.',
      icon: AlertTriangle,
    },
    {
      step: '03',
      title: 'Required Medicine Generated',
      desc: 'System builds an automated replenishment requisition.',
      icon: FileText,
    },
    {
      step: '04',
      title: 'Dealer Dashboard',
      desc: 'Requisition instantly pops up on the assigned distributor portal.',
      icon: Send,
    },
    {
      step: '05',
      title: 'Dealer Prepares Order',
      desc: 'Distributor verifies batch lot, price and packing.',
      icon: Boxes,
    },
    {
      step: '06',
      title: 'Dispatch',
      desc: 'Consignment shipped with invoice & tracking.',
      icon: Truck,
    },
    {
      step: '07',
      title: 'Pharmacy Receives Stock',
      desc: 'Counter scans shipment & verifies quantities.',
      icon: CheckCircle2,
    },
    {
      step: '08',
      title: 'New Batch Added',
      desc: 'Fresh batch immediately becomes active for billing.',
      icon: Sparkles,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold mb-3">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Automated Supply Chain Link</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            When Stock Runs Low, Supply Requirements Follow.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            If a medicine is unavailable or reaches the defined low-stock threshold, the
            requirement automatically appears in the relevant Dealer/Supplier portal.
          </p>
        </div>

        {/* 8-Step Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-14">
          {pipeline.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {item.step}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/70 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Interactive Replenishment Demo Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
                Core Differentiating Capability
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Zero Stock-Out Emergencies with Connected Distributors
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Traditional pharmacies lose up to 14% of counter revenue when customers are turned
                away due to out-of-stock medicines. PharmaFlow bridges the counter POS directly with
                distributor dispatch queues.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setDemoTriggered(!demoTriggered)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-all shadow-md shadow-teal-400/20 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>
                    {demoTriggered ? 'Reset Simulation' : 'Simulate Low-Stock Trigger'}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Interactive Simulation Widget */}
            <div className="lg:col-span-6">
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700 text-xs">
                  <span className="font-bold text-slate-200">
                    Live Threshold Simulation
                  </span>
                  <span className="text-teal-400 font-mono text-[11px]">
                    Medicine: Azithromycin 500mg
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Step 1: Shelf Count */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Pharmacy Shelf Stock
                      </span>
                      <span className="font-bold text-white text-sm">
                        {demoTriggered ? '3 Units Left (Threshold: 10)' : '14 Units Left (Healthy)'}
                      </span>
                    </div>
                    <div>
                      {demoTriggered ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded animate-pulse">
                          CRITICAL LOW STOCK
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">
                          ABOVE MINIMUM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Auto PO Generation */}
                  <div
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      demoTriggered
                        ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                        : 'bg-slate-900/30 border-slate-700/40 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        {demoTriggered
                          ? '✅ Purchase Order #PO-8924 Generated'
                          : 'Idle • Monitoring Sales'}
                      </span>
                      <span className="text-[10px] font-mono">
                        {demoTriggered ? 'Qty: 50 Strips' : 'Waiting trigger'}
                      </span>
                    </div>
                    {demoTriggered && (
                      <p className="text-[11px] text-teal-300/80 mt-1">
                        Assigned Dealer: <strong>MediSupply Distributors Ltd.</strong> (Authorized
                        Regional Distributor)
                      </p>
                    )}
                  </div>

                  {/* Step 3: Dealer Portal View */}
                  <div
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      demoTriggered
                        ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                        : 'bg-slate-900/30 border-slate-700/40 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        {demoTriggered
                          ? '📦 Dealer Portal: Order Received & Queued'
                          : 'Dealer Portal Standby'}
                      </span>
                      <span className="text-[10px]">
                        {demoTriggered ? 'Status: Accepted' : 'No Action'}
                      </span>
                    </div>
                    {demoTriggered && (
                      <p className="text-[11px] text-blue-300/80 mt-1">
                        Dealer confirmed batch allocation. Dispatch initiated within 4 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
