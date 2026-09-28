import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function RoleCardsSection() {
  const navigate = useNavigate();
  const { user, getRoleDashboard } = useAuth();

  const handlePortalNavigate = (targetRole) => {
    if (user && user.role === targetRole) {
      navigate(getRoleDashboard(user.role));
    } else {
      navigate('/login');
    }
  };

  const roles = [
    {
      roleKey: 'OWNER',
      title: 'Pharmacy Owner',
      badge: 'Full Executive Control',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: ShieldCheck,
      description:
        'Monitor pharmacy operations, sales, inventory, staff activity, suppliers and financial performance.',
      features: [
        'Dashboard',
        'Sales Analytics',
        'Accounts',
        'Inventory',
        'Staff Management',
        'Supplier Management',
      ],
      highlight: 'Access to net revenue, margins, staff audits & cash ledgers',
    },
    {
      roleKey: 'STAFF',
      title: 'Staff',
      badge: 'Counter Billing & Dispensing',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      iconBg: 'bg-teal-100 text-teal-700 border-teal-200',
      icon: UserCheck,
      description:
        'Handle customer billing, medicine sales and inventory operations with controlled access.',
      features: [
        'New Bill',
        'Customer Details',
        'Medicine Search',
        'Batch Selection',
        'Billing History',
        'Personal Sales',
      ],
      importantNotice:
        'Staff must NOT see Pharmacy Owner/Admin account management or owner-only financial controls.',
    },
    {
      roleKey: 'DEALER',
      title: 'Dealer / Supplier',
      badge: 'Fulfillment & Logistics',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Truck,
      description:
        'Receive pharmacy purchase requirements, manage orders and handle medicine supply and returns.',
      features: [
        'Purchase Orders',
        'Required Medicines',
        'Dispatch',
        'Supplier Billing',
        'Returns',
      ],
      highlight: 'Instant notification whenever pharmacy shelf stock falls low',
    },
  ];

  return (
    <section className="py-12 bg-slate-50/70 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Dedicated Workspaces
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            One Pharmacy. Three Connected Portals.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Tailored operational interfaces designed specifically for private pharmacy workflows,
            preserving data privacy and security.
          </p>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.roleKey}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${item.iconBg}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                    {item.description}
                  </p>

                  {/* Features Tag List */}
                  <div className="mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                      Included Modules:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Role Specific Highlight or Important Notice */}
                  {item.importantNotice ? (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2 mb-4">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span className="font-medium text-[11px] leading-tight">
                        <strong>Privacy Safeguard:</strong> {item.importantNotice}
                      </span>
                    </div>
                  ) : item.highlight ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium mb-4">
                      💡 {item.highlight}
                    </div>
                  ) : null}
                </div>

                {/* Card Action Button */}
                <button
                  onClick={() => handlePortalNavigate(item.roleKey)}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 transition-all flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white cursor-pointer"
                >
                  <span>Enter {item.title} Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
