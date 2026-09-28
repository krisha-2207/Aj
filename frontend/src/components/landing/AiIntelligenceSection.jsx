import React from 'react';
import { Cpu, TrendingUp, ShieldCheck, PieChart, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function AiIntelligenceSection() {
  const aiCards = [
    {
      title: 'Demand Prediction',
      desc: 'Predict future medicine requirements based on historical sales patterns, seasonal shifts, and recurring local customer demand.',
      icon: TrendingUp,
      accent: 'teal',
      metric: '+94.8% Forecast Accuracy',
      details: [
        'Analyzes past 90-day counter billing',
        'Accounts for weekly fluctuation spikes',
        'Generates automated reorder quantity advice',
      ],
    },
    {
      title: 'Stock-Out Prevention',
      desc: 'Identify medicines that may run out before the next supplier delivery cycle and support timely procurement.',
      icon: ShieldCheck,
      accent: 'emerald',
      metric: 'Zero Out-of-Stock Incidents',
      details: [
        'Lead-time tracking per supplier',
        'Safety stock dynamic recalibration',
        'Prevents lost customer transactions',
      ],
    },
    {
      title: 'Inventory Insights',
      desc: 'Understand fast-moving and slow-moving medicines for better purchasing decisions and optimized working capital.',
      icon: PieChart,
      accent: 'sky',
      metric: '32% Working Capital Freed',
      details: [
        'ABC inventory classification',
        'Flags dormant capital in dead inventory',
        'Recommends optimal order package sizes',
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>Machine Intelligence for Retail Operations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            AI-Powered Pharmacy Intelligence
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Turn pharmacy sales and inventory data into actionable insights that protect cash flow
            and maximize shelf throughput.
          </p>
        </div>

        {/* 3 AI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {aiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-3xl p-7 border border-slate-200/90 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
                      {card.metric}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2.5">
                    {card.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {card.desc}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Capabilities:
                    </span>
                    {card.details.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible AI Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-3xl mx-auto text-xs text-slate-500">
          🔒 <strong>Operational Scope Note:</strong> PharmaFlow AI is dedicated purely to commercial
          retail forecasting, reorder calculations, and inventory optimization. It does not replace
          licensed pharmacists or diagnose clinical medical conditions.
        </div>
      </div>
    </section>
  );
}
