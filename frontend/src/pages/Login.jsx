import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, UserCheck, Truck, ArrowRight, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('owner@apollocare.com');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('OWNER');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(identifier, password, role);
      const destination = getRoleDashboard(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (!err.response || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (email, pass, r) => {
    setIdentifier(email);
    setPassword(pass);
    setRole(r);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-teal-500/20 to-emerald-500/0 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse-subtle"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-blue-500/0 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20 animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Subtle Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Back to Landing Page link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 text-left relative z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* PharmaFlow Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-teal-300 text-slate-950 mb-4 shadow-xl shadow-teal-500/25 transition-transform hover:scale-105 duration-300">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.5 4a1.5 1.5 0 0 1 3 0v4.5H18a1.5 1.5 0 0 1 0 3h-4.5V16a1.5 1.5 0 0 1-3 0v-4.5H6a1.5 1.5 0 0 1 0-3h4.5V4z" />
            <circle cx="19" cy="5" r="2.5" className="fill-teal-950" />
            <path
              d="M17 19c-2 2-6 2-8 0"
              stroke="#022c22"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Pharma<span className="text-teal-400">Flow</span>
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
          Retail Pharmacy Management & Medical Supply Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl shadow-black/50 rounded-3xl border border-slate-800 relative overflow-hidden">
          {/* Subtle Top Glowing Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-purple-500"></div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Your Portal Role
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setRole('OWNER')}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'OWNER'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DEALER')}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'DEALER'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Dealer</span>
                </button>
              </div>
            </div>

            {/* Email / Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address / Username
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-950/60 text-white placeholder-slate-500"
                  placeholder="name@example.com or username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-950/60 text-white placeholder-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 transition-all shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50 dynamic-shimmer-btn"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Quick One-Click Demo Credentials</span>
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill('owner@apollocare.com', 'admin123', 'OWNER')}
                className="w-full text-left p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/50 flex items-center justify-between transition-all text-xs cursor-pointer group hover:scale-[1.01]"
              >
                <div>
                  <span className="font-bold text-purple-200 block group-hover:text-purple-100">Dr. Rajesh Sharma (Pharmacy Owner)</span>
                  <span className="text-purple-400 text-[10px]">owner@apollocare.com • admin123</span>
                </div>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  OWNER
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff@apollocare.com', 'staff123', 'STAFF')}
                className="w-full text-left p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/40 border border-teal-800/50 flex items-center justify-between transition-all text-xs cursor-pointer group hover:scale-[1.01]"
              >
                <div>
                  <span className="font-bold text-teal-200 block group-hover:text-teal-100">Kavita Reddy (Pharmacist Staff)</span>
                  <span className="text-teal-400 text-[10px]">staff@apollocare.com • staff123</span>
                </div>
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md">
                  STAFF
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('dealer1@medisupply.com', 'dealer123', 'DEALER')}
                className="w-full text-left p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/50 flex items-center justify-between transition-all text-xs cursor-pointer group hover:scale-[1.01]"
              >
                <div>
                  <span className="font-bold text-blue-200 block group-hover:text-blue-100">Vikram Mehta (MediSupply Dealer)</span>
                  <span className="text-blue-400 text-[10px]">dealer1@medisupply.com • dealer123</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
                  DEALER
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
