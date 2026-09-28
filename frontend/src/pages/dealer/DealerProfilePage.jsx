import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Truck, Store, Phone, Mail, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function DealerProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dealers/my-portal/data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dealer profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { dealer, stats } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Distributorship Profile</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Verified company records, drug wholesale licenses, and authorized trade partnerships
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 font-black text-xl">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{dealer.companyName}</h3>
              <p className="text-xs text-blue-700 font-semibold">Authorized Pharmaceutical Distributor</p>
              <p className="text-xs text-slate-500">Contact: {dealer.contactPerson}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{dealer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{dealer.email}</span>
            </div>
            <div className="flex items-start gap-2 pt-1 text-slate-500 text-[11px]">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{dealer.address}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
            <p><span className="text-slate-500">GSTIN:</span> <strong className="font-mono text-slate-900">{dealer.gstin}</strong></p>
            {dealer.dlNumber && (
              <p><span className="text-slate-500">Drug License:</span> <strong className="font-mono text-slate-900">{dealer.dlNumber}</strong></p>
            )}
          </div>
        </div>

        {/* Assigned Pharmacy */}
        {dealer.assignedPharmacy && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{dealer.assignedPharmacy.name}</h3>
                <p className="text-xs text-emerald-700 font-medium">Designated Pharmacy Partner</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <p><span className="text-slate-400">Store Address:</span> {dealer.assignedPharmacy.address}</p>
              <p><span className="text-slate-400">Store Telephone:</span> {dealer.assignedPharmacy.phone}</p>
              <p><span className="text-slate-400">Pharmacy GSTIN:</span> <strong className="font-mono text-slate-800">{dealer.assignedPharmacy.gstin}</strong></p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs font-medium">
              Your distributorship supplies medicines directly to this store. All batches confirmed as received are automatically booked into its active inventory.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
