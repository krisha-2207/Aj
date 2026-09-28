import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Bell,
  Sparkles,
  ArrowUpRight,
  Receipt,
  FileCheck
} from 'lucide-react';

export default function HeroSection() {
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

  // Mock data for sales area chart inside preview
  const chartPoints = [
    { label: 'Jan', val: 12000 },
    { label: 'Feb', val: 14500 },
    { label: 'Mar', val: 18200 },
    { label: 'Apr', val: 16800 },
    { label: 'May', val: 21400 },
    { label: 'Jun', val: 25450 },
  ];

  return (
    <section
      id="hero"
      className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-white"
    >
      {/* Background Soft Glow Accents inspired by reference image */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-teal-200/40 via-emerald-100/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 left-10 w-[350px] h-[350px] bg-emerald-50/60 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Main Pitch */}
          <div className="lg:col-span-6 xl:col-span-5 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Smart Pharmacy Management</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.12] mb-6 font-sans">
              Smarter Pharmacy.
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 bg-clip-text text-transparent">
                Safer Operations.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed mb-8 max-w-xl">
              Manage billing, batch-wise inventory, expiry tracking, staff, suppliers and
              purchase orders in one connected pharmacy management system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md shadow-slate-900/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleExploreFeatures}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all shadow-xs hover:border-slate-300 text-sm sm:text-base cursor-pointer"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50/70 border border-teal-200/60 text-teal-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Secure</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Real-time</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-semibold">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Role-based</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Dashboard Preview & Floating Cards */}
          <div className="lg:col-span-6 xl:col-span-7 relative">
            {/* Ambient shadow / backdrop container */}
            <div className="relative mx-auto max-w-[620px] lg:max-w-none">
              {/* Floating Accent Card 1: Top-Left Live Counter */}
              <div className="absolute -top-6 -left-4 sm:-left-8 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/90 animate-float-slow hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">Live Bill</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <div className="text-base font-bold text-slate-900">₹1,255</div>
                  <div className="text-[10px] text-teal-600 font-medium">Customer Bill Completed</div>
                </div>
              </div>

              {/* Floating Accent Card 2: Top-Right Expiry Alert */}
              <div className="absolute -top-4 -right-2 sm:-right-6 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/90 animate-float-reverse hidden sm:flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    Batch Expiry Alert
                  </span>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">Amoxicillin 250mg</div>
                  <div className="text-[10px] text-slate-500">Expires in 28 days</div>
                </div>
              </div>

              {/* Main Dashboard Window Mockup */}
              <div className="relative bg-white rounded-3xl p-4 sm:p-6 shadow-2xl shadow-teal-900/10 border border-slate-200/90 transition-all">
                {/* Mockup Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                      PharmaFlow Dashboard
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 w-44">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">Search medicine, batch...</span>
                    </div>
                    <div className="relative">
                      <Bell className="w-4 h-4 text-slate-500" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                        RS
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 hidden sm:inline">
                        Dr. Sharma
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Stat Cards Row (Indian Rupee ₹) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
                  {/* Today's Sales */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-teal-50/40 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span>Today's Sales</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900">₹25,450</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                      +14.2% today
                    </div>
                  </div>

                  {/* Current Stock */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span>Current Stock</span>
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900">1,248</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Active items</div>
                  </div>

                  {/* Low Stock */}
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 hover:bg-amber-50 transition-colors">
                    <div className="flex items-center justify-between text-amber-700 text-[11px] mb-1">
                      <span>Low Stock</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-900">18</div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Needs reorder</div>
                  </div>

                  {/* Near Expiry */}
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-50 transition-colors">
                    <div className="flex items-center justify-between text-rose-700 text-[11px] mb-1">
                      <span>Near Expiry</span>
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-rose-900">7</div>
                    <div className="text-[10px] text-rose-700 font-semibold mt-0.5">&lt; 60 days left</div>
                  </div>
                </div>

                {/* Sales Chart Mockup */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Pharmacy Revenue Trajectory</span>
                      <span className="text-[10px] text-slate-500 block">Weekly sales & counter dispatch</span>
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      Live Pulse
                    </span>
                  </div>

                  {/* SVG Sales Curve */}
                  <div className="h-24 sm:h-28 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Gradient fill under curve */}
                      <path
                        d="M 0,80 Q 80,65 140,50 T 260,35 T 380,25 T 500,10 L 500,100 L 0,100 Z"
                        fill="url(#chartGradient)"
                      />
                      {/* Smooth top curve */}
                      <path
                        d="M 0,80 Q 80,65 140,50 T 260,35 T 380,25 T 500,10"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {/* Point indicator on current day */}
                      <circle cx="500" cy="10" r="5" fill="#0f766e" />
                      <circle cx="500" cy="10" r="9" fill="#0d9488" opacity="0.3" className="animate-ping" />
                    </svg>

                    {/* Chart X-axis labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span className="font-bold text-teal-700">Today (₹25,450)</span>
                    </div>
                  </div>
                </div>

                {/* Batch Inventory Table Preview */}
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span>Batch Inventory Tracking</span>
                    <span className="text-[10px] text-teal-600 font-bold">FEFO Mode Active</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-slate-800">Paracetamol 500mg</div>
                        <div className="text-[10px] text-slate-400">Batch: B-2024-01 • 20 left</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          10-Nov-2026 (Safe)
                        </span>
                      </div>
                    </div>

                    <div className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-slate-800">Azithromycin 500mg</div>
                        <div className="text-[10px] text-slate-400">Batch: B-2023-11 • 4 left</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Low Stock Alert
                        </span>
                      </div>
                    </div>

                    <div className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-slate-800">Cefixime 200mg</div>
                        <div className="text-[10px] text-slate-400">Batch: B-2024-02 • 12 left</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Near Expiry (18d)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Accent Card 3: Bottom-Left Low Stock Warning */}
              <div className="absolute -bottom-6 -left-3 sm:-left-6 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-slate-900/8 border border-amber-200/90 animate-float-slow hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Low Stock Alert
                  </span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">Azithromycin 500mg</div>
                  <div className="text-[10px] text-slate-500">Only 4 units left • Auto PO Ready</div>
                </div>
              </div>

              {/* Floating Accent Card 4: Bottom-Right FEFO Verified */}
              <div className="absolute -bottom-8 -right-3 sm:-right-6 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-slate-900/8 border border-teal-200/90 animate-float-reverse hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-300 text-teal-700 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded">
                    Medicine Billing
                  </span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">FEFO Batch Prioritized</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Earliest Expiry Sold First</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
