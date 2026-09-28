import React from 'react';
import { ShieldCheck, HeartHandshake, CheckCircle2, Store, Sparkles } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-slate-50/70 border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Visual Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Pharma<span className="text-teal-600">Flow</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Retail Medical Shop & Pharmacy Operating System
                  </p>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Unlike oversized enterprise software or generic ERP tools, PharmaFlow is designed
                expressly for the everyday realities of private retail pharmacies and standalone
                medical chemist shops.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xl font-black text-teal-600 block">100%</span>
                  <span className="text-slate-600 font-medium">Focused on Retail Chemists</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xl font-black text-emerald-600 block">FEFO</span>
                  <span className="text-slate-600 font-medium">Automatic Loss Prevention</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mission and Principles */}
          <div className="lg:col-span-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Our Dedicated Mission</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Built Exclusively for Private Pharmacies
            </h2>

            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Independent pharmacies are the trusted healthcare cornerstone of every local
              neighborhood. Yet, many still battle manual stock ledgers, unexpected expiry losses,
              and stockouts during critical prescription fills.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">
                  <strong>Simpler, Faster Counter Billing:</strong> Generate GST invoices in seconds
                  with automated batch lookup and immediate print options.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">
                  <strong>Zero Expiry Surprises:</strong> Continuous 60-day visual alerts ensure you
                  claim timely dealer returns and avoid write-offs.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">
                  <strong>Automated Distributor Bridge:</strong> Direct link to trusted dealers
                  eliminates frantic phone calls when life-saving medicines run low.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
