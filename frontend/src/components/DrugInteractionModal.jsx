import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';

export default function DrugInteractionModal({ isOpen, onClose, cartItems = [] }) {
  const [isChecking, setIsChecking] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      runCheck();
    }
  }, [isOpen, cartItems]);

  if (!isOpen) return null;

  const runCheck = async () => {
    try {
      setIsChecking(true);
      setErrorMsg('');
      const medicineNames = cartItems.map((i) => `${i.medicineName} (${i.genericName || ''})`);

      const res = await api.post('/ai/check-interactions', {
        medicines: medicineNames
      });

      setAnalysis(res.data);
    } catch (err) {
      console.error('Failed to check drug interactions', err);
      setErrorMsg(err.response?.data?.error || 'Interaction check failed. Please check network.');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" /> HIGH CLINICAL RISK
          </span>
        );
      case 'MODERATE':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> MODERATE PRECAUTION
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> SAFE COMBINATION
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <ShieldAlert className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Clinical Drug Interaction & Safety Guard
              </h3>
              <p className="text-xs text-indigo-200">
                Automated clinical screening across active POS cart medicines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cart Medicines Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Screening {cartItems.length} Cart Medicines:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cartItems.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  {item.medicineName}
                </span>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isChecking ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-700">Evaluating clinical safety & interactions...</p>
              <p className="text-xs text-slate-400 mt-1">Cross-referencing drug contraindications and duplicates</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Risk Level Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Overall Safety Assessment</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{analysis.summary}</p>
                </div>
                <div>{getRiskBadge(analysis.riskLevel)}</div>
              </div>

              {/* Alerts List */}
              {analysis.alerts && analysis.alerts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Specific Warnings & Precautions ({analysis.alerts.length})
                  </p>
                  {analysis.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        alert.severity === 'HIGH'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : alert.severity === 'MEDIUM'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-blue-50/80 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                          {alert.severity === 'HIGH' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-slate-700">{alert.description}</p>
                      {alert.recommendation && (
                        <div className="pt-1 text-[11px] font-medium text-slate-800 flex items-start gap-1">
                          <strong className="text-indigo-700">Action:</strong> {alert.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-emerald-900 text-sm">No Known Adverse Interactions</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    All items in this bill can be safely dispensed together according to clinical guidelines.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={runCheck}
            disabled={isChecking}
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            Re-run Safety Check
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
