import React from 'react';
import {
  Receipt,
  Layers,
  RefreshCw,
  Clock,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  BarChart3,
  Users,
  Cpu,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      num: '01',
      title: 'Smart Billing',
      desc: 'Create accurate medicine bills with customer details, GST, discount, payment mode and invoice generation.',
      icon: Receipt,
      accent: 'teal',
      tag: 'Fast POS Checkout',
    },
    {
      num: '02',
      title: 'Batch-Wise Inventory',
      desc: 'Track every medicine by batch number, quantity, purchase date and expiry date.',
      icon: Layers,
      accent: 'emerald',
      tag: 'Multi-Batch Tracking',
    },
    {
      num: '03',
      title: 'FEFO Billing',
      desc: 'Prioritize medicines with the earliest expiry date to reduce expiry-related losses.',
      icon: RefreshCw,
      accent: 'sky',
      tag: 'Auto-Allocation',
    },
    {
      num: '04',
      title: 'Expiry Alerts',
      desc: 'Automatically identify medicines approaching expiry and highlight them for action.',
      icon: Clock,
      accent: 'rose',
      tag: '60-Day Window',
    },
    {
      num: '05',
      title: 'Low Stock Alerts',
      desc: 'Detect medicines below the required stock level and generate supply requirements.',
      icon: AlertTriangle,
      accent: 'amber',
      tag: 'Safety Stock Limit',
    },
    {
      num: '06',
      title: 'Purchase Orders',
      desc: 'Create and manage medicine purchase orders directly with connected dealers.',
      icon: ShoppingCart,
      accent: 'blue',
      tag: 'Direct Supplier Link',
    },
    {
      num: '07',
      title: 'Supplier Returns',
      desc: 'Identify eligible medicines for supplier return based on expiry or inventory conditions.',
      icon: RotateCcw,
      accent: 'indigo',
      tag: 'Credit Protection',
    },
    {
      num: '08',
      title: 'Sales Analytics',
      desc: 'Analyze daily, weekly and monthly pharmacy sales using clear visual dashboards.',
      icon: BarChart3,
      accent: 'teal',
      tag: 'Rupee (₹) Ledgers',
    },
    {
      num: '09',
      title: 'Staff Management',
      desc: 'Monitor staff billing activity and individual sales without exposing owner-only controls.',
      icon: Users,
      accent: 'purple',
      tag: 'Role Guardrails',
    },
    {
      num: '10',
      title: 'AI Demand Prediction',
      desc: 'Use historical sales data to predict future medicine demand and reduce stock-outs and overstock.',
      icon: Cpu,
      accent: 'emerald',
      tag: 'Smart Procurement',
    },
  ];

  const getAccentStyles = (accent) => {
    switch (accent) {
      case 'teal':
        return {
          bg: 'bg-teal-50',
          border: 'border-teal-200/80',
          text: 'text-teal-700',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200/80',
          text: 'text-emerald-700',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'sky':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200/80',
          text: 'text-sky-700',
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200/80',
          text: 'text-rose-700',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200/80',
          text: 'text-amber-700',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200/80',
          text: 'text-blue-700',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200/80',
          text: 'text-indigo-700',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200/80',
          text: 'text-purple-700',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <section id="features" className="py-20 bg-slate-50/60 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Comprehensive Pharmacy Capability</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Everything Your Pharmacy Needs
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            From quick counter billing to intelligent batch replenishment, PharmaFlow equips
            independent medical shops with enterprise-grade operational speed.
          </p>
        </div>

        {/* 10 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            const styles = getAccentStyles(item.accent);

            return (
              <div
                key={item.num}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${styles.bg} ${styles.border} ${styles.text} flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles.badge}`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.num}.
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-teal-600 transition-colors">
                  <span>Explore Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
