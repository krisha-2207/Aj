import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function CtaSection() {
  const { user, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate(getRoleDashboard(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-teal-100/40 via-emerald-100/30 to-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl border border-teal-500/20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-teal-300 text-xs font-semibold mb-6 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Immediate Deployment</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Run Your Pharmacy Smarter.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Connect billing, inventory, suppliers and analytics in one intelligent pharmacy
            management platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-all shadow-lg shadow-teal-400/20 hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleExploreFeatures}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm sm:text-base cursor-pointer"
            >
              <span>Explore Features</span>
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Role-Isolated Security
            </span>
            <span>•</span>
            <span>Zero Data Lock-In</span>
            <span>•</span>
            <span>Instant Role Portals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
