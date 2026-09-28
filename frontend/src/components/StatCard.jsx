import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', alert }) {
  const colorSchemes = {
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80 hover:border-emerald-400/80',
      iconBg: 'bg-emerald-100/90 text-emerald-700 shadow-sm shadow-emerald-500/10',
      glow: 'from-emerald-500/10 to-teal-500/0',
      accentLine: 'bg-gradient-to-r from-emerald-500 to-teal-400'
    },
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-700',
      border: 'border-blue-200/80 hover:border-blue-400/80',
      iconBg: 'bg-blue-100/90 text-blue-700 shadow-sm shadow-blue-500/10',
      glow: 'from-blue-500/10 to-cyan-500/0',
      accentLine: 'bg-gradient-to-r from-blue-500 to-cyan-400'
    },
    purple: {
      bg: 'bg-purple-50/70',
      text: 'text-purple-700',
      border: 'border-purple-200/80 hover:border-purple-400/80',
      iconBg: 'bg-purple-100/90 text-purple-700 shadow-sm shadow-purple-500/10',
      glow: 'from-purple-500/10 to-indigo-500/0',
      accentLine: 'bg-gradient-to-r from-purple-500 to-indigo-400'
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-700',
      border: 'border-amber-200/80 hover:border-amber-400/80',
      iconBg: 'bg-amber-100/90 text-amber-700 shadow-sm shadow-amber-500/10',
      glow: 'from-amber-500/10 to-orange-500/0',
      accentLine: 'bg-gradient-to-r from-amber-500 to-orange-400'
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-700',
      border: 'border-rose-200/80 hover:border-rose-400/80',
      iconBg: 'bg-rose-100/90 text-rose-700 shadow-sm shadow-rose-500/10',
      glow: 'from-rose-500/10 to-red-500/0',
      accentLine: 'bg-gradient-to-r from-rose-500 to-red-400'
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      glow: 'from-slate-500/5 to-slate-500/0',
      accentLine: 'bg-gradient-to-r from-slate-400 to-slate-500'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.emerald;

  return (
    <div className={`p-5 bg-white rounded-2xl border ${scheme.border} shadow-xs dynamic-card relative overflow-hidden group`}>
      {/* Dynamic top gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${scheme.accentLine} opacity-80 group-hover:opacity-100 transition-opacity`} />
      
      {/* Ambient background glow blob */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${scheme.glow} blur-xl pointer-events-none transition-all duration-300 group-hover:scale-125`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {alert && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-rose-600 relative z-10">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>{alert}</span>
        </div>
      )}
    </div>
  );
}
