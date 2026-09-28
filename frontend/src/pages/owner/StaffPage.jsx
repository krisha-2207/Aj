import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate } from '../../utils/formatters';
import { Users, Plus, UserCheck, Mail, Phone, ShieldCheck, AlertCircle } from 'lucide-react';

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    designation: 'Pharmacist',
    salary: '30000'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.post('/staff', formData);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        designation: 'Pharmacist',
        salary: '30000'
      });
      fetchStaff();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Pharmacist Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Administer pharmacy employees, track individual counter sales performance, and manage login access
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((stf) => (
          <div key={stf.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{stf.name}</h3>
                  <p className="text-xs text-slate-500">{stf.designation}</p>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                {stf.employeeCode}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{stf.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{stf.phone || 'No phone recorded'}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Joined: {formatDate(stf.joinedDate)} • Username: <span className="font-mono font-medium text-slate-700">{stf.username}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-semibold text-slate-500">Bills Generated</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{stf.totalBills}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <p className="text-[10px] uppercase font-semibold text-emerald-700">Total Billed</p>
                <p className="text-base font-bold text-emerald-800 mt-0.5">{formatINR(stf.totalSalesAmount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Staff Member</h3>
            <p className="text-xs text-slate-500 mb-4">Provide credentials for pharmacy counter staff</p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@apollocare.com"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ramesh"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
