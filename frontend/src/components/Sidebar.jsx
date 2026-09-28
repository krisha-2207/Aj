import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  Pill,
  ReceiptText,
  Truck,
  ShoppingCart,
  Users,
  WalletCards,
  FileBarChart2,
  UserCheck,
  PackageCheck,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu,
  Clock,
  Send
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;

  // Role-specific navigation definitions
  let navItems = [];

  if (role === 'OWNER') {
    navItems = [
      { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
      { name: 'Billing', path: '/owner/billing', icon: ReceiptText },
      { name: 'Inventory', path: '/owner/inventory', icon: Boxes },
      { name: 'Medicines', path: '/owner/medicines', icon: Pill },
      { name: 'Purchase Orders', path: '/owner/purchase-orders', icon: ShoppingCart },
      { name: 'Suppliers / Dealers', path: '/owner/dealers', icon: Truck },
      { name: 'AI Insights', path: '/owner/ai-insights', icon: Sparkles, highlight: true },
      { name: 'Staff Management', path: '/owner/staff', icon: Users },
      { name: 'Accounts & Ledgers', path: '/owner/accounts', icon: WalletCards, confidential: true },
      { name: 'Analytics & Reports', path: '/owner/reports', icon: FileBarChart2 }
    ];
  } else if (role === 'STAFF') {
    navItems = [
      { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
      { name: 'New Bill (POS)', path: '/staff/billing', icon: ReceiptText },
      { name: 'Billing History', path: '/staff/sales', icon: History },
      { name: 'Inventory View', path: '/staff/inventory', icon: Boxes },
      { name: 'Staff Profile', path: '/staff/profile', icon: UserCheck }
    ];
  } else if (role === 'DEALER') {
    navItems = [
      { name: 'Dashboard', path: '/dealer/dashboard', icon: LayoutDashboard },
      { name: 'Delivery Bills', path: '/dealer/bills', icon: ReceiptText, highlight: true },
      { name: 'Purchase Orders', path: '/dealer/orders', icon: ShoppingCart },
      { name: 'Supplied Medicines', path: '/dealer/medicines', icon: Pill },
      { name: 'Dealer Profile', path: '/dealer/profile', icon: Truck }
    ];
  }

  return (
    <aside
      className={`bg-slate-950 text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800/80 transition-all duration-300 select-none relative z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-teal-300 text-slate-950 font-black shrink-0 shadow-lg shadow-teal-500/25 transition-transform hover:scale-105">
            {/* Medical cross + flow connection */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.5 4a1.5 1.5 0 0 1 3 0v4.5H18a1.5 1.5 0 0 1 0 3h-4.5V16a1.5 1.5 0 0 1-3 0v-4.5H6a1.5 1.5 0 0 1 0-3h4.5V4z" />
              <circle cx="19" cy="5" r="2.5" className="fill-teal-950" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-base font-black text-white tracking-tight leading-none block">
                Pharma<span className="text-teal-400">Flow</span>
              </span>
              <span className="text-[10px] font-semibold text-teal-400/90 uppercase tracking-wider block mt-0.5">
                {role === 'OWNER' ? 'Owner Portal' : role === 'STAFF' ? 'Staff Portal' : 'Dealer Portal'}
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all hidden md:flex items-center justify-center cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Workspace Navigation</span>
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-950/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-300 rounded-r-full shadow-sm shadow-teal-300"></span>
                  )}
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.confidential && (
                    <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/30 font-bold">
                      OWNER
                    </span>
                  )}
                  {!collapsed && item.highlight && (
                    <span className="ml-auto text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-md border border-teal-500/30 font-bold animate-pulse">
                      {item.badgeText || (item.name.includes('AI') ? 'AI' : 'AUTO')}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900"></span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
