import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../api/axios';
import { formatINR, formatDate } from '../utils/formatters';

export default function PrescriptionScannerModal({ isOpen, onClose, onApplyToCart, allMedicines = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setImagePreview(event.target.result);
      setScanResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setIsAnalyzing(true);
      setErrorMsg('');
      const res = await api.post('/ai/scan-prescription', {
        imageBase64: selectedImage,
        mimeType: 'image/jpeg'
      });

      if (res.data?.success && res.data?.data) {
        setScanResult(res.data.data);
      } else {
        setErrorMsg('Could not extract prescription details. Please check image clarity.');
      }
    } catch (err) {
      console.error('Prescription scanning failed', err);
      setErrorMsg(err.response?.data?.error || 'AI Prescription scanning failed. Please try a clearer image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyItems = () => {
    if (!scanResult || !scanResult.detectedItems) return;

    const itemsToAdd = [];
    scanResult.detectedItems.forEach((item) => {
      if (item.matchedInStock && item.medicineId && item.batchId) {
        const med = allMedicines.find((m) => m.id === item.medicineId);
        const batch = (med?.batches || []).find((b) => b.id === item.batchId);

        itemsToAdd.push({
          medicineId: item.medicineId,
          productId: med?.productId || 'MED',
          medicineName: item.matchedMedicineName || item.prescribedName,
          genericName: med?.genericName || '',
          category: med?.category || 'General',
          dosageUsage: item.directions || item.dosage || 'Take as advised by doctor.',
          batchId: item.batchId,
          batchNumber: item.batchNumber || batch?.batchNumber || 'BATCH',
          expiryDate: batch?.expiryDate || new Date(Date.now() + 180 * 86400000).toISOString(),
          maxStock: item.availableStock || batch?.remainingQuantity || 50,
          quantity: item.calculatedQuantity || 1,
          unitPrice: item.unitPrice || batch?.sellingPrice || 10,
          gstRate: med?.gstRate !== undefined ? med.gstRate : 12.0,
          availableBatches: med?.batches || []
        });
      }
    });

    if (itemsToAdd.length > 0) {
      onApplyToCart({
        items: itemsToAdd,
        patientName: scanResult.patientName,
        doctorName: scanResult.doctorName
      });
      onClose();
    } else {
      setErrorMsg('No matched items in stock to add to cart.');
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setScanResult(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
                Krisha AI Prescription Scanner
                <span className="text-xs bg-emerald-400/30 text-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-300/40">
                  Multimodal OCR + FEFO
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90">
                Upload or capture doctor handwriting to automatically match stock & populate POS cart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {!imagePreview ? (
            /* Upload Drop Area */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="p-4 bg-emerald-100 rounded-2xl group-hover:scale-110 transition-transform shadow-sm text-emerald-700 mb-4">
                <Upload className="w-10 h-10" />
              </div>
              <p className="text-base font-bold text-slate-800 mb-1">
                Upload or Drag & Drop Doctor's Prescription
              </p>
              <p className="text-xs text-slate-500 text-center max-w-sm">
                Supports camera snapshots, scanned prescriptions, digital RX slips (PNG, JPG, WEBP)
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-lg">
                <Camera className="w-4 h-4" />
                <span>Snap or Browse Files</span>
              </div>
            </div>
          ) : (
            /* Image Preview & Analysis Results Grid */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Image Preview */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-64 md:h-80 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Prescription Preview"
                    className="w-full h-full object-contain"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <div className="relative mb-3">
                        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                        <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-ping" />
                      </div>
                      <p className="font-semibold text-sm">Analyzing handwriting with Gemini AI...</p>
                      <p className="text-xs text-emerald-200 mt-1">Cross-referencing store FEFO stock</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Change Image
                  </button>
                  {!scanResult && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 py-2 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isAnalyzing ? 'Scanning...' : 'Scan Prescription'}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: AI Extraction & Stock Matching */}
              <div className="md:col-span-7 flex flex-col">
                {!scanResult ? (
                  <div className="flex-1 border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="font-bold text-slate-700 text-sm">Ready for AI Analysis</h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Click the <strong className="text-emerald-700">"Scan Prescription"</strong> button to read doctor notes and match unexpired medicine batches.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-4">
                    {/* Prescription Metadata Badges */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Doctor</p>
                          <p className="font-semibold text-slate-800 truncate">
                            {scanResult.doctorName || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Patient</p>
                          <p className="font-semibold text-slate-800 truncate">
                            {scanResult.patientName || 'Walk-in Patient'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prescribed Medicines List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Extracted Medications ({scanResult.detectedItems?.length || 0})</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Confidence: <span className="font-bold text-emerald-700">{scanResult.confidenceScore}</span>
                        </span>
                      </p>

                      {scanResult.detectedItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all text-xs ${
                            item.matchedInStock
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-amber-50/60 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">{item.prescribedName}</p>
                                {item.matchedInStock ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> In Stock
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Out of Stock / Unmatched
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 mt-0.5">
                                Dosage: <span className="font-semibold text-slate-700">{item.dosage}</span> ({item.duration || 'Standard course'})
                              </p>
                              {item.directions && (
                                <p className="text-slate-500 italic text-[11px] mt-0.5">
                                  "{item.directions}"
                                </p>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                Qty: {item.calculatedQuantity || 1}
                              </span>
                            </div>
                          </div>

                          {item.matchedInStock && (
                            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                              <span className="font-medium">
                                FEFO Batch: <strong className="font-mono">{item.batchNumber}</strong>
                              </span>
                              <span className="font-bold">{formatINR(item.unitPrice || 0)} / unit</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Clinical Safety Notes */}
                    {scanResult.safetyNotes && scanResult.safetyNotes.length > 0 && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                        <p className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1 text-blue-800 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Pharmacist Note
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-800">
                          {scanResult.safetyNotes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>

          {scanResult && (
            (() => {
              const matchedCount = (scanResult.detectedItems || []).filter((i) => i.matchedInStock && i.medicineId).length;
              const unmatchedCount = (scanResult.detectedItems || []).length - matchedCount;

              return (
                <button
                  onClick={handleApplyItems}
                  disabled={matchedCount === 0}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-slate-400 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {unmatchedCount === 0
                      ? `✅ All ${matchedCount} Tablets in Stock — Add to Billing Cart`
                      : `⚡ Add ${matchedCount} Available Tablets to Cart (${unmatchedCount} Out of Stock)`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
