import React, { useState } from 'react';
import {
  Truck,
  Layers,
  Warehouse,
  Receipt,
  MinusCircle,
  RefreshCw,
  AlertTriangle,
  Send,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function SmartInventoryFlow() {
  const [activeStep, setActiveStep] = useState(3); // Default on Customer Bill Generated

  const steps = [
    {
      num: 1,
      title: 'Medicine Purchased',
      desc: 'Stock procurement received from authorized medical dealers.',
      icon: Truck,
      role: 'Dealer & Owner',
      color: 'teal',
    },
    {
      num: 2,
      title: 'Batch Created',
      desc: 'Unique batch number, MRP, purchase rate and expiry date logged.',
      icon: Layers,
      role: 'Inventory',
      color: 'teal',
    },
    {
      num: 3,
      title: 'Inventory Updated',
      desc: 'Available shelf stock increases immediately across store records.',
      icon: Warehouse,
      role: 'Store Shelf',
      color: 'emerald',
    },
    {
      num: 4,
      title: 'Customer Bill Generated',
      desc: 'Counter staff adds medicines, customer info, GST & discounts.',
      icon: Receipt,
      role: 'Staff POS',
      color: 'sky',
    },
    {
      num: 5,
      title: 'Stock Automatically Reduced',
      desc: 'Exact tablet/unit quantities deducted in real-time on invoice save.',
      icon: MinusCircle,
      role: 'System Engine',
      color: 'emerald',
    },
    {
      num: 6,
      title: 'FEFO Batch Selection',
      desc: 'Earliest expiring batch is prioritized to eliminate dead inventory.',
      icon: RefreshCw,
      role: 'Smart Dispatch',
      color: 'teal',
    },
    {
      num: 7,
      title: 'Low Stock / Expiry Detection',
      desc: 'Background engine monitors minimum reorder points & 60-day expiry.',
      icon: AlertTriangle,
      role: 'Safety Monitor',
      color: 'amber',
    },
    {
      num: 8,
      title: 'Dealer Purchase Requirement',
      desc: 'Replenishment order appears instantly on the supplier portal.',
      icon: Send,
      role: 'Supplier Portal',
      color: 'blue',
    },
  ];

  return (
    <section id="solutions" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Real-Time Synchronization
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-3">
            From Billing to Inventory — Automatically Connected
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            In PharmaFlow, every billing transaction instantly synchronizes with batch inventory,
            stock levels, and dealer replenishment pipelines with zero manual entries.
          </p>
        </div>

        {/* Interactive Flow Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {steps.map((step) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.num - 1;

            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(step.num - 1)}
                className={`relative rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]'
                    : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/90 shadow-2xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      Step 0{step.num}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isSelected ? 'text-teal-300' : 'text-slate-400'
                      }`}
                    >
                      {step.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold tracking-tight leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-dashed border-slate-200/30 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-teal-300 font-semibold' : 'text-slate-400'}>
                    {isSelected ? 'Active Focus' : 'Click to inspect'}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-teal-300' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Explanatory Banner for Active Step */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Step {steps[activeStep].num} Deep Dive</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {steps[activeStep].title}: {steps[activeStep].desc}
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Every counter bill immediately updates your pharmacy inventory without end-of-day
              reconciliation delays. Counter staff dispense medicine, and safety algorithms
              automatically adjust stock balances and dealer requisitions.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15">
            <div className="text-right">
              <span className="text-[11px] text-slate-300 block">Inventory Accuracy</span>
              <span className="text-2xl font-black text-teal-300">100% Real-Time</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
