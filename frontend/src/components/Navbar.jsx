import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  ShieldCheck,
  UserCheck,
  Truck,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  Activity
} from 'lucide-react';

import MedicineQuickSearch from './MedicineQuickSearch';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  if (!user) return null;

  // Extract readable breadcrumb and page title from URL pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const portalName = pathParts[0] ? pathParts[0].toUpperCase() : 'PORTAL';
  const rawPage = pathParts[1] || 'dashboard';
  const pageTitle = rawPage
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const roleBadges = {
    OWNER: {
      label: 'PHARMACY OWNER',
      color: 'bg-purple-50 text-purple-800 border-purple-200/80 shadow-xs shadow-purple-500/10',
      icon: ShieldCheck
    },
    STAFF: {
      label: 'PHARMACIST / STAFF',
      color: 'bg-teal-50 text-teal-800 border-teal-200/80 shadow-xs shadow-teal-500/10',
      icon: UserCheck
    },
    DEALER: {
      label: 'DEALER / SUPPLIER',
      color: 'bg-blue-50 text-blue-800 border-blue-200/80 shadow-xs shadow-blue-500/10',
      icon: Truck
    }
  };

  const badge = roleBadges[user.role] || roleBadges.STAFF;
  const RoleIcon = badge.icon;

  return (
    <header className="h-16 dynamic-glass bg-white/90 sticky top-0 z-30 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs shrink-0 select-none transition-all">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="hover:text-slate-600 transition-colors">{portalName}</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-teal-700 font-semibold">{pageTitle}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>{pageTitle}</span>
          </h2>
        </div>
      </div>

      {/* Center: Interactive Global Medicine & Batch Search */}
      <div className="hidden md:flex items-center">
        <MedicineQuickSearch userRole={user.role} />
      </div>

      {/* Right: Date, Live Pulse, Notifications, Role Badge & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dynamic Live Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>FEFO Engine Active</span>
        </div>

        {/* Date Stamp */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* Notifications */}
        <div className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" title="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
        </div>

        {/* Role Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${badge.color}`}>
          <RoleIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.name?.charAt(0) || 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-none">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">{user.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
