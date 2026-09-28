import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { formatINR, formatDate } from '../../utils/formatters';
import ExpiryBadge from '../../components/ExpiryBadge';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  CheckCircle2,
  X,
  Package,
  Layers,
  Building,
  RotateCcw,
  IndianRupee,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AIInsightsPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const medsRes = await api.get('/medicines');
      setMedicines(medsRes.data || []);
    } catch (err) {
      console.error('Failed to load AI insights data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Generate analytical AI insights from database records
  const insights = medicines.map((m) => {
    const currentStock = m.totalStock || 0;
    const minStock = m.minStockLevel || 15;
    const totalSold = m.totalSold || 0;

    // Projected 30-day demand modeled on sales velocity
    const baseDailyRate = Math.max(0.2, (totalSold / 14));
    const predictedDemand = Math.round(baseDailyRate * 30 + (minStock * 1.2));
    const suggestedPurchase = Math.max(0, predictedDemand - currentStock);

    // Days of supply remaining
    const daysOfStock = baseDailyRate > 0 ? Math.round(currentStock / baseDailyRate) : 99;

    let stockOutRisk = 'LOW';
    let riskColor = 'bg-teal-100 text-teal-800 border-teal-300';
    if (currentStock === 0) {
      stockOutRisk = 'CRITICAL';
      riskColor = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (daysOfStock <= 7 || currentStock <= minStock) {
      stockOutRisk = 'HIGH';
      riskColor = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (daysOfStock <= 15) {
      stockOutRisk = 'MODERATE';
      riskColor = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    // Velocity classification:
    // Fast moving: High sales (>= 20) or high turnover
    // Slow moving: Low sales (<= 15) with existing store stock
    const isFastMoving = totalSold >= 20;
    const isSlowMoving = totalSold <= 15 && currentStock > 0;

    // Calculate revenue and inventory value
    const avgSellingPrice = m.batches?.length ? m.batches[0].sellingPrice : 30;
    const avgPurchasePrice = m.batches?.length ? m.batches[0].purchasePrice : 20;
    const totalRevenue = totalSold * avgSellingPrice;
    const holdingValue = currentStock * avgPurchasePrice;

    return {
      id: m.id,
      productId: m.productId,
      name: m.name,
      genericName: m.genericName,
      category: m.category,
      manufacturer: m.manufacturer,
      dosageForm: m.dosageForm || 'Tablet',
      strength: m.strength || '',
      currentStock,
      minStock,
      totalSold,
      predictedDemand,
      suggestedPurchase,
      daysOfStock,
      stockOutRisk,
      riskColor,
      isFastMoving,
      isSlowMoving,
      totalRevenue,
      holdingValue,
      avgSellingPrice,
      avgPurchasePrice,
      batches: m.batches || []
    };
  });

  const filteredInsights = filterCategory === 'ALL'
    ? insights
    : insights.filter((i) => i.category === filterCategory);

  const highRiskCount = insights.filter((i) => i.stockOutRisk === 'CRITICAL' || i.stockOutRisk === 'HIGH').length;

  // Sorted lists
  const fastMovingList = [...insights]
    .filter((i) => i.isFastMoving)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 6);

  const slowMovingList = [...insights]
    .filter((i) => i.isSlowMoving)
    .sort((a, b) => a.totalSold - b.totalSold || b.currentStock - a.currentStock)
    .slice(0, 6);

  const totalSuggestedPurchaseQty = insights.reduce((acc, i) => acc + i.suggestedPurchase, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PharmaFlow AI Inventory & Demand Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Algorithmic demand prediction, stock-out vulnerability scores, velocity segmentation, and auto-purchase quantities. Click any card to inspect full intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/owner/purchase-orders"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Review Requisitions</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock-Out Vulnerability"
          value={highRiskCount}
          subtitle="Medicines needing replenishment ≤ 7 days"
          icon={AlertTriangle}
          color="rose"
          alert={highRiskCount > 0 ? `${highRiskCount} items at risk` : null}
        />
        <StatCard
          title="Suggested Procurement"
          value={`${totalSuggestedPurchaseQty} units`}
          subtitle="Estimated optimal order volume"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Fast Moving SKUs"
          value={fastMovingList.length}
          subtitle="High velocity dispensing medicines"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Slow Moving SKUs"
          value={slowMovingList.length}
          subtitle="Dormant inventory / Surplus capital"
          icon={ArrowDownRight}
          color="amber"
        />
      </div>

      {/* AI Recommendation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-teal-300">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-200">Algorithmic Demand Planning Summary</h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
              Based on recent prescription trends, <strong>{highRiskCount} medicines</strong> have inventory below the safe threshold.
              Click any fast or slow moving medicine below to inspect sales velocity, batch expiration timelines, and suggested restock quantities.
            </p>
          </div>
        </div>
        <Link
          to="/owner/dealers"
          className="self-start md:self-auto shrink-0 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md"
        >
          Contact Suppliers &rarr;
        </Link>
      </div>

      {/* Velocity Classification Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Moving */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Fast Moving Medicines (Top Velocity)
                </h3>
                <p className="text-[10px] text-slate-400">Click any card to view detailed batch & demand insights</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              High Turnover
            </span>
          </div>

          <div className="space-y-2.5">
            {fastMovingList.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMedicine(m)}
                className="p-3.5 rounded-2xl bg-teal-50/40 hover:bg-teal-50 border border-teal-200/80 hover:border-teal-400 flex items-center justify-between text-xs cursor-pointer transition-all dynamic-card group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{m.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">({m.productId})</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{m.genericName} • {m.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="font-black text-teal-900 bg-teal-100 px-2 py-0.5 rounded-lg text-xs">
                      {m.totalSold} sold
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Stock: {m.currentStock} left</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow Moving */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Slow Moving Dormant Inventory
                </h3>
                <p className="text-[10px] text-slate-400">Click any card to inspect holding cost & return options</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Surplus Capital
            </span>
          </div>

          <div className="space-y-2.5">
            {slowMovingList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No slow moving inventory detected.</p>
            ) : (
              slowMovingList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMedicine(m)}
                  className="p-3.5 rounded-2xl bg-amber-50/30 hover:bg-amber-50 border border-amber-200/70 hover:border-amber-400 flex items-center justify-between text-xs cursor-pointer transition-all dynamic-card group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">{m.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">({m.productId})</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{m.genericName} • {m.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg text-xs">
                        {m.currentStock} in stock
                      </span>
                      <p className="text-[10px] text-amber-700 mt-0.5 font-bold">Only {m.totalSold} sold</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Demand Prediction Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              30-Day Demand Forecast & Suggested Purchase Quantity
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any medicine row to open complete velocity metrics, active batches, and demand breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Analgesics / Antipyretic">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Antacids / Gastrointestinal">Antacids</option>
              <option value="Antihistamines">Antihistamines</option>
              <option value="Antidiabetic">Antidiabetic</option>
              <option value="Cardiovascular / Antihypertensive">Cardiovascular</option>
              <option value="Respiratory / Antiallergic">Respiratory</option>
              <option value="Vitamins & Supplements">Vitamins & Supplements</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Product ID</th>
                <th className="py-3 px-3">Medicine Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Min Threshold</th>
                <th className="py-3 px-3 text-right">Predicted Demand</th>
                <th className="py-3 px-3 text-right font-black text-teal-800">Suggested Purchase</th>
                <th className="py-3 px-3 text-center">Stock-Out Risk</th>
                <th className="py-3 px-3 text-right">Days of Stock</th>
                <th className="py-3 px-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInsights.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedMedicine(item)}
                  className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.productId}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.genericName}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{item.category}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {item.currentStock} units
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {item.minStock} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700">
                    {item.predictedDemand} units
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.suggestedPurchase > 0 ? (
                      <span className="font-mono font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        +{item.suggestedPurchase} units
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Optimal</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.riskColor}`}>
                      {item.stockOutRisk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-medium">
                    {item.daysOfStock < 90 ? `~${item.daysOfStock} days` : '> 90 days'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMedicine(item);
                      }}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-[10px] border border-teal-200"
                    >
                      View AI Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MEDICINE AI INTELLIGENCE & VELOCITY MODAL
          ======================================================== */}
      {selectedMedicine && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3.5 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${
                  selectedMedicine.isFastMoving
                    ? 'bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-400'
                }`}>
                  {selectedMedicine.isFastMoving ? <TrendingUp className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight">{selectedMedicine.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      selectedMedicine.isFastMoving
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {selectedMedicine.isFastMoving ? '🟢 FAST MOVING SKU' : '🟡 SLOW MOVING SKU'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedMedicine.genericName} • {selectedMedicine.category} • Product ID: <strong className="font-mono text-slate-200">{selectedMedicine.productId}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMedicine(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Velocity & Stock Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Total Units Sold</span>
                  <span className="text-2xl font-black text-teal-900 block mt-0.5">{selectedMedicine.totalSold} Units</span>
                  <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                    Est. Sales: {formatINR(selectedMedicine.totalRevenue)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">In-Store Stock</span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5">{selectedMedicine.currentStock} Units</span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Min Safety Level: {selectedMedicine.minStock}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Predicted 30D Demand</span>
                  <span className="text-2xl font-black text-blue-900 block mt-0.5">{selectedMedicine.predictedDemand} Units</span>
                  <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                    {selectedMedicine.daysOfStock < 90 ? `~${selectedMedicine.daysOfStock} days runway` : '> 90 days runway'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Suggested Purchase</span>
                  <span className="text-2xl font-black text-purple-900 block mt-0.5">
                    {selectedMedicine.suggestedPurchase > 0 ? `+${selectedMedicine.suggestedPurchase}` : '0'} Units
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                    Risk: {selectedMedicine.stockOutRisk}
                  </span>
                </div>
              </div>

              {/* AI Strategic Advisory Card */}
              <div className={`p-4 rounded-2xl border ${
                selectedMedicine.isFastMoving
                  ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMedicine.isFastMoving ? 'bg-teal-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {selectedMedicine.isFastMoving ? 'High Turnover Replenishment Recommendation' : 'Dormant Inventory Optimization Strategy'}
                    </h4>
                    <p className="text-xs leading-relaxed">
                      {selectedMedicine.isFastMoving ? (
                        <>
                          This medicine experiences high counter dispensing (<strong>{selectedMedicine.totalSold} units sold</strong>). 
                          To prevent counter stock-outs and maintain uninterrupted patient dispensing, maintain a replenishment safety order of 
                          <strong> +{selectedMedicine.suggestedPurchase || selectedMedicine.minStock * 2} units</strong> with your authorized distributor.
                        </>
                      ) : (
                        <>
                          This item has slow demand velocity (<strong>{selectedMedicine.totalSold} units dispensed</strong> with <strong>{selectedMedicine.currentStock} units in stock</strong>, holding <strong>{formatINR(selectedMedicine.holdingValue)}</strong> of capital). 
                          Avoid over-ordering new batches. If existing batches approach ≤ 2 months to expiry, initiate a supplier credit return immediately.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Batches Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Active Store Batches ({selectedMedicine.batches.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">FEFO Managed Batches</span>
                </div>

                {selectedMedicine.batches.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    No active batches currently in store inventory.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 font-mono">Batch Number</th>
                          <th className="p-2.5 text-right">Remaining Stock</th>
                          <th className="p-2.5 text-right">Sold</th>
                          <th className="p-2.5 text-right">Purchase Price</th>
                          <th className="p-2.5 text-right">Selling Price</th>
                          <th className="p-2.5">Expiry Date</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMedicine.batches.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                            <td className="p-2.5 text-right font-black text-teal-900">{b.remainingQuantity} units</td>
                            <td className="p-2.5 text-right text-slate-600">{b.soldQuantity} units</td>
                            <td className="p-2.5 text-right text-slate-600">{formatINR(b.purchasePrice)}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(b.sellingPrice)}</td>
                            <td className="p-2.5 text-slate-700">{formatDate(b.expiryDate)}</td>
                            <td className="p-2.5 text-center">
                              <ExpiryBadge expiryDate={b.expiryDate} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Verified PharmaFlow AI Predictive Model</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMedicine(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                {selectedMedicine.isFastMoving ? (
                  <button
                    onClick={() => navigate('/owner/purchase-orders')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Create Purchase Order</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/owner/dealers')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Check Supplier Returns</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

