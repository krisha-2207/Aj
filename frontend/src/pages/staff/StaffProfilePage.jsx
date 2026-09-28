import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import { 
  Store, ShieldCheck, Mail, Phone, Calendar, 
  Clock, Receipt, ArrowUpRight, Zap, Target, Sparkles, LogOut, LogIn
} from 'lucide-react';

export default function StaffProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockMsg, setClockMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockToggle = async () => {
    try {
      setClockLoading(true);
      const res = await api.post('/staff/clock-action');
      setClockMsg(res.data.message);
      await fetchProfile();
      setTimeout(() => setClockMsg(''), 4000);
    } catch (err) {
      console.error('Failed to toggle shift', err);
    } finally {
      setClockLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { assignedPharmacy, compensation, attendance, performance, recentBills } = profile;
  const isClockedIn = attendance?.activeShift?.status === 'CLOCKED_IN';

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Member Portal</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified Pharmacist
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Your personal employment record, sales commission incentives, milestone targets, and shift log
          </p>
        </div>

        {/* Shift Duty Clock Button */}
        <div className="flex items-center gap-3">
          {clockMsg && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
              {clockMsg}
            </span>
          )}
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
              isClockedIn 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {clockLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isClockedIn ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Clock Out Duty</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Clock In Shift</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 4 Metric Highlight Cards (Incentive Focused) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Earned Sales Incentive */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-md shadow-emerald-700/15 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Incentive Commission</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{formatINR(compensation?.monthIncentive || 0)}</p>
          <p className="text-[11px] text-emerald-100 font-medium mt-1">2.5% on retail customer sales</p>
        </div>

        {/* Monthly Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Target</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatINR(compensation?.monthlyTarget || 50000)}</p>
          <p className="text-[11px] text-blue-600 font-bold mt-1">{compensation?.targetProgress || 0}% Achieved this month</p>
        </div>

        {/* Commission Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">2.50%</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Direct commission on every bill</p>
        </div>

        {/* Active Duty Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duty Shift Status</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <p className="text-lg font-bold text-slate-900">{isClockedIn ? 'On Active Duty' : 'Off Duty'}</p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {isClockedIn ? 'Shift active since 09:00 AM' : 'Shift not clocked in'}
          </p>
        </div>
      </div>

      {/* Main Grid: Profile & Store details + Sales Target Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pharmacist Identity & Store */}
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black text-xl">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{profile.name}</h3>
                <p className="text-xs text-emerald-700 font-semibold">{profile.designation}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">Staff ID: {profile.employeeCode}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined: {formatDate(profile.joinedDate)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Today's Sales</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">{formatINR(performance?.todaySales || 0)}</p>
                <p className="text-[10px] text-slate-400">{performance?.todayBillsCount || 0} Bills Generated</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Lifetime Billed</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{formatINR(performance?.totalSales || 0)}</p>
                <p className="text-[10px] text-slate-400">{performance?.totalBillsCount || 0} Invoices</p>
              </div>
            </div>
          </div>

          {/* Assigned Pharmacy Store */}
          {assignedPharmacy && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{assignedPharmacy.name}</h3>
                  <p className="text-[11px] text-slate-500">Authorized Retail Medical License</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <p><span className="text-slate-400">GSTIN:</span> <strong className="font-mono text-slate-800">{assignedPharmacy.gstin}</strong></p>
                <p><span className="text-slate-400">Drug License:</span> <strong className="font-mono text-slate-800">{assignedPharmacy.dlNumber}</strong></p>
                <p className="text-[11px] text-slate-500 pt-1">{assignedPharmacy.address}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All customer bills generated by you are officially linked to this medical license.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Incentive Breakdown & Personal Bill Ledgers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Sales Incentive Target Milestone Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monthly Incentive Target</h3>
                  <p className="text-xs text-slate-500">Target: {formatINR(compensation?.monthlyTarget || 50000)} | Unlock +₹2,500 Bonus</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                {compensation?.targetProgress || 0}% Achieved
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, compensation?.targetProgress || 0)}%` }}
              />
            </div>

            {/* Incentive Milestone Tiers */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tier 1 (Base)</p>
                <p className="font-bold text-slate-800 mt-0.5">2.5% Commission</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Active on all bills</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tier 2 (₹25k Sales)</p>
                <p className="font-bold text-slate-800 mt-0.5">+₹1,000 Bonus</p>
                <p className="text-[10px] text-slate-500">Milestone payout</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tier 3 (₹50k Sales)</p>
                <p className="font-bold text-slate-800 mt-0.5">+₹2,500 Bonus</p>
                <p className="text-[10px] text-purple-600 font-semibold">Star Pharmacist</p>
              </div>
            </div>
          </div>

          {/* Personal Staff Billing & Commission History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Your Recent Billed Invoices</h3>
                  <p className="text-xs text-slate-500">Customer invoices billed by you with calculated 2.5% commission</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {recentBills?.length || 0} Records
              </span>
            </div>

            {(!recentBills || recentBills.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No invoices generated yet. Generate customer bills in the POS terminal to earn commissions!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4 text-right">Bill Total</th>
                      <th className="py-3 px-4 text-right">Commission (+2.5%)</th>
                      <th className="py-3 px-4 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {bill.billNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{bill.customerName}</p>
                          <p className="text-[10px] text-slate-400">{bill.customerPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                          {bill.doctorName}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatINR(bill.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            +{formatINR(bill.incentiveEarned)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                          {formatDateTime(bill.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

