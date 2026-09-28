import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowUp } from 'lucide-react';

export default function LandingFooter() {
  const navigate = useNavigate();
  const { user, getRoleDashboard } = useAuth();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthLink = () => {
    if (user) {
      navigate(getRoleDashboard(user.role));
    } else {
      navigate('/login');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onClick={scrollToTop}
              className="flex items-center gap-3 cursor-pointer group inline-flex select-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black shadow-md shadow-teal-500/20">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.5 4a1.5 1.5 0 0 1 3 0v4.5H18a1.5 1.5 0 0 1 0 3h-4.5V16a1.5 1.5 0 0 1-3 0v-4.5H6a1.5 1.5 0 0 1 0-3h4.5V4z" />
                  <circle cx="19" cy="5" r="2.5" className="fill-teal-900" />
                  <path
                    d="M17 19c-2 2-6 2-8 0"
                    stroke="#042f2e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Pharma<span className="text-teal-400">Flow</span>
              </span>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Smart pharmacy management for safer and more efficient operations.
            </p>

            <div className="pt-2 text-xs text-slate-500">
              Purpose-built for retail chemists, private pharmacists & medical distributors.
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => scrollTo('hero')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('solutions')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Solutions
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('about')}
                  className="hover:text-teal-400 transition-colors"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={handleAuthLink}
                  className="hover:text-teal-400 transition-colors font-medium text-slate-300"
                >
                  {user ? 'My Dashboard' : 'Login'}
                </button>
              </li>
            </ul>
          </div>

          {/* Product Capabilities */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  Billing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('solutions')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  Inventory
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  Analytics
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('solutions')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  Suppliers
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('solutions')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  Purchase Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-teal-400 transition-colors text-left"
                >
                  AI Prediction
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 PharmaFlow. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <span>Private Pharmacy Management System</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
