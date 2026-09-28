import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const { user, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['hero', 'features', 'solutions', 'about'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthAction = () => {
    if (user) {
      navigate(getRoleDashboard(user.role));
    } else {
      navigate('/login');
    }
  };

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
          : 'bg-white/70 backdrop-blur-xs border-b border-slate-100/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-md shadow-teal-500/20 text-white transition-transform group-hover:scale-105">
              {/* Medical cross + flow connection SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10.5 4a1.5 1.5 0 0 1 3 0v4.5H18a1.5 1.5 0 0 1 0 3h-4.5V16a1.5 1.5 0 0 1-3 0v-4.5H6a1.5 1.5 0 0 1 0-3h4.5V4z" />
                <circle cx="19" cy="5" r="2.5" className="fill-teal-200" />
                <path
                  d="M17 19c-2 2-6 2-8 0"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
                  Pharma<span className="text-teal-600">Flow</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 leading-none hidden sm:block">
                Smart Pharmacy Management
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 p-1 rounded-full border border-slate-200/60">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Login / Dashboard Button */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={handleAuthAction}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>Dashboard</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/20 text-white">
                  {user.role}
                </span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handleAuthAction}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200/80">
            <button
              onClick={handleAuthAction}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm"
            >
              <span>{user ? `Go to ${user.role} Dashboard` : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
