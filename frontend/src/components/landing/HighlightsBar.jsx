import React from 'react';
import { Layers, RefreshCw, AlertTriangle, BarChart3, CheckCircle } from 'lucide-react';

export default function HighlightsBar() {
  const highlights = [
    {
      title: 'Batch-wise Inventory',
      desc: 'Independent tracking by manufacturing batch & shelf date',
      icon: Layers,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'FEFO Billing',
      desc: 'First-Expiry First-Out automated stock dispensing priority',
      icon: RefreshCw,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Expiry Alerts',
      desc: 'Proactive 60-day visual warnings for supplier returns',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Live Analytics',
      desc: 'Real-time daily sales, revenue trajectory & margins in ₹',
      icon: BarChart3,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ];

  return (
    <section className="bg-white py-8 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
