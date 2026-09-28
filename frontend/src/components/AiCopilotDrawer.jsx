import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RefreshCw,
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  UserCheck,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Stethoscope,
  User,
  Paperclip
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';

export default function AiCopilotDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningPrescription, setIsScanningPrescription] = useState(false);
  const [allMedicinesCatalog, setAllMedicinesCatalog] = useState([]);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! 👋 I am **Krisha AI**, your intelligent Pharmacy & Medical Supply Management AI.\n\nI can identify tablets from our database, suggest in-stock alternatives with clinical reasons, scan doctor prescriptions, check expiring batches, and autonomously draft Purchase Orders. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolExecuted: null
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isOwner = user?.role === 'PHARMACY_OWNER' || user?.role === 'ADMIN';

  useEffect(() => {
    // Fetch catalog for batch/cart mapping
    api.get('/medicines').then((res) => {
      setAllMedicinesCatalog(res.data || []);
    }).catch((e) => console.error('Failed to pre-fetch medicines', e));
  }, []);

  // Role-specific quick suggestion chips
  const quickPrompts = isOwner
    ? [
        { label: '📸 Import Doctor Prescription', action: 'UPLOAD_RX' },
        { label: '💊 Alternative for Paracetamol / Sold Items', prompt: 'What are the in-stock alternative tablets for Paracetamol or sold out medicines, and why?' },
        { label: '📦 Low Stock & Reorder Alerts', prompt: 'Which medicines are low in stock and need reordering?' },
        { label: '🔴 Expiring Batches (<60d)', prompt: 'List all batches expiring within the next 60 days (RED status).' },
        { label: '📊 Store Financials & Valuation', prompt: 'What is our total inventory valuation and recent sales performance?' }
      ]
    : [
        { label: '📸 Import Doctor Prescription', action: 'UPLOAD_RX' },
        { label: '💊 Alternative for Sold Tablets', prompt: 'Recommend in-stock alternatives with medical reasons for out-of-stock items.' },
        { label: '📦 Search Medicine Stock', prompt: 'Check stock levels and unexpired batches for Paracetamol and Amoxicillin.' },
        { label: '🛡️ Check Drug Interaction', prompt: 'Are there any contraindications between Aspirin 75mg and Warfarin 5mg?' }
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome' && !m.isPrescriptionCard)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const res = await api.post('/ai/chat', {
        message: query,
        chatHistory: history
      });

      const aiReply = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data?.reply || 'I processed your request.',
        toolExecuted: res.data?.toolExecuted || null,
        toolData: res.data?.toolData || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('AI chat failed', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ **Error**: ${err.response?.data?.error || 'Unable to connect to Krisha AI. Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Prescription Slip Image Handler
  const handlePrescriptionFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      await processPrescriptionImage(base64Data, file.name);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processPrescriptionImage = async (base64Data, fileName) => {
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: `Uploaded Doctor's Prescription: **${fileName || 'Prescription Slip'}** 📄`,
      imagePreview: base64Data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsScanningPrescription(true);

    try {
      const res = await api.post('/ai/scan-prescription', {
        imageBase64: base64Data,
        mimeType: 'image/jpeg'
      });

      if (res.data?.success && res.data?.data) {
        const scanData = res.data.data;
        const availableItems = (scanData.detectedItems || []).filter((i) => i.matchedInStock && i.medicineId);
        const unavailableItems = (scanData.detectedItems || []).filter((i) => !i.matchedInStock || !i.medicineId);

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          isPrescriptionCard: true,
          scanData: scanData,
          availableItems,
          unavailableItems,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `⚠️ **Scan Incomplete**: Could not extract legible medicines from this slip. Please ensure the prescription photo is clear and well-lit.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Prescription processing failed', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ **Scan Failed**: ${err.response?.data?.error || 'Unable to analyze prescription.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsScanningPrescription(false);
    }
  };

  // Redirect to Billing with Available Items
  const handleRedirectToBilling = (availableItems, patientName, doctorName) => {
    if (!availableItems || availableItems.length === 0) return;

    const formattedCartItems = [];
    availableItems.forEach((item) => {
      const med = allMedicinesCatalog.find((m) => m.id === item.medicineId);
      const batch = (med?.batches || []).find((b) => b.id === item.batchId) || (med?.batches || [])[0];

      formattedCartItems.push({
        medicineId: item.medicineId,
        productId: med?.productId || 'MED',
        medicineName: item.matchedMedicineName || item.prescribedName,
        genericName: med?.genericName || '',
        category: med?.category || 'General',
        dosageUsage: item.directions || item.dosage || 'Take as advised by doctor.',
        batchId: item.batchId || batch?.id,
        batchNumber: item.batchNumber || batch?.batchNumber || 'BATCH',
        expiryDate: batch?.expiryDate || new Date(Date.now() + 180 * 86400000).toISOString(),
        maxStock: item.availableStock || batch?.remainingQuantity || 50,
        quantity: item.calculatedQuantity || 1,
        unitPrice: item.unitPrice || batch?.sellingPrice || 10,
        gstRate: med?.gstRate !== undefined ? med.gstRate : 12.0,
        availableBatches: med?.batches || []
      });
    });

    const payload = {
      items: formattedCartItems,
      patientName: patientName || '',
      doctorName: doctorName || ''
    };

    // Store in localStorage for instant retrieval on Billing page
    localStorage.setItem('krisha_preloaded_cart', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('krisha_load_prescription_cart', { detail: payload }));

    // Close drawer and navigate to billing page
    setIsOpen(false);
    const targetRoute = isOwner ? '/owner/billing' : '/staff/billing';
    navigate(targetRoute);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Chat cleared. Ready for your next pharmacy management query, prescription scan, or autonomous action!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-800 text-sm mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-slate-900 text-base mt-2.5 mb-1.5 text-emerald-800">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-700 min-h-[1rem] my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        </p>
      );
    });
  };

  const formatInline = (str) => {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-emerald-800 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>')
      .replace(/₹([0-9,]+)/g, '<span class="font-bold text-emerald-700">₹$1</span>');
  };

  return (
    <>
      {/* Hidden File Input for Prescription Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handlePrescriptionFile}
      />

      {/* Floating Trigger Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-4 py-3 rounded-full shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          title="Open Krisha AI"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-100" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <span className="font-bold text-sm tracking-wide">Krisha AI</span>
          <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Slide-Over Drawer Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop for mobile */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs md:hidden pointer-events-auto transition-opacity"
          />

          {/* Drawer Box */}
          <div
            className={`pointer-events-auto bg-white flex flex-col h-full shadow-2xl border-l border-slate-200 transition-all duration-300 ${
              isExpanded ? 'w-full md:w-[750px]' : 'w-full md:w-[480px]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl">
                  <Bot className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base tracking-wide">Krisha AI</h3>
                    <span className="text-[10px] uppercase font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 px-2 py-0.5 rounded-full">
                      Agentic Tool-Calling
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80">
                    Prescription Scanner, Medicine Intelligence & Reorders
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Import Doctor Prescription Image"
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold px-2"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan RX</span>
                </button>
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Collapse width' : 'Expand width'}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition hidden md:block cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Krisha AI"
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (qp.action === 'UPLOAD_RX') {
                      fileInputRef.current?.click();
                    } else {
                      handleSendMessage(qp.prompt);
                    }
                  }}
                  disabled={isLoading || isScanningPrescription}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full shadow-2xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    qp.action === 'UPLOAD_RX'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 border border-emerald-600'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {qp.action === 'UPLOAD_RX' && <Camera className="w-3.5 h-3.5" />}
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Standard Message */}
                  {!msg.isPrescriptionCard ? (
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-2xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-2xs'
                      }`}
                    >
                      {msg.imagePreview && (
                        <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                          <img src={msg.imagePreview} alt="Prescription Upload" className="w-full object-cover" />
                        </div>
                      )}

                      {msg.toolExecuted && (
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md w-fit">
                          <Zap className="w-3 h-3 text-teal-600" />
                          Executed Tool: {msg.toolExecuted}
                        </div>
                      )}

                      {msg.sender === 'user' ? (
                        <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                      ) : (
                        <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                      )}
                    </div>
                  ) : (
                    /* Interactive Prescription Analysis Action Card */
                    <div className="max-w-[96%] w-full bg-white border border-emerald-200 rounded-2xl p-4 shadow-md space-y-3.5 animate-fade-in">
                      {/* Doctor & Patient Bar */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">
                              Prescription Analysis Results
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Doctor: <strong className="text-slate-700">{msg.scanData?.doctorName || 'General Physician'}</strong> • Patient: <strong className="text-slate-700">{msg.scanData?.patientName || 'Walk-in'}</strong>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {msg.scanData?.detectedItems?.length || 0} Tablets Extracted
                        </span>
                      </div>

                      {/* 1. AVAILABLE MEDICINES IN SHOP */}
                      {msg.availableItems && msg.availableItems.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available in Shop ({msg.availableItems.length})</span>
                          </p>
                          <div className="space-y-1.5">
                            {msg.availableItems.map((item, i) => (
                              <div
                                key={i}
                                className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <strong className="text-slate-900">{item.matchedMedicineName || item.prescribedName}</strong>
                                    <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded">
                                      Batch: {item.batchNumber}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    Dosage: {item.dosage} • Qty: <strong className="text-emerald-800">{item.calculatedQuantity || 1}</strong>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-slate-900">{formatINR(item.unitPrice || 0)}</span>
                                  <p className="text-[10px] text-emerald-700 font-semibold">{item.availableStock} in stock</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. UNAVAILABLE / OUT OF STOCK TABLETS */}
                      {msg.unavailableItems && msg.unavailableItems.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Out of Stock / Unavailable ({msg.unavailableItems.length})</span>
                          </p>
                          <div className="space-y-1.5">
                            {msg.unavailableItems.map((item, i) => (
                              <div
                                key={i}
                                className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 text-xs text-rose-950"
                              >
                                <div className="flex items-center justify-between">
                                  <strong className="text-rose-900">{item.prescribedName}</strong>
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                    Out of Stock
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Prescribed: {item.dosage} ({item.duration || 'course'})
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* REDIRECT ACTION BUTTON */}
                      <div className="pt-2">
                        {msg.availableItems && msg.availableItems.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleRedirectToBilling(msg.availableItems, msg.scanData?.patientName, msg.scanData?.doctorName)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer ${
                              msg.unavailableItems.length === 0
                                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-emerald-500/25'
                                : 'bg-gradient-to-r from-teal-600 to-slate-800 hover:from-teal-700 hover:to-slate-900 shadow-teal-500/25'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {msg.unavailableItems.length === 0
                                ? `✅ All ${msg.availableItems.length} Tablets Available — Proceed to Billing`
                                : `⚡ Proceed to Billing with ${msg.availableItems.length} Available Tablet${msg.availableItems.length > 1 ? 's' : ''}`}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">
                            None of the prescribed tablets are currently in stock.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {/* Scanning / Loading Indicators */}
              {(isLoading || isScanningPrescription) && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 rounded-bl-2xs shadow-xs flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span className="text-xs text-slate-700 font-medium">
                      {isScanningPrescription
                        ? "Krisha AI is reading doctor's handwriting & matching in-stock batches..."
                        : 'Krisha AI is analyzing inventory database...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar with RX Camera Button */}
            <div className="p-3.5 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import Doctor Prescription Image"
                  className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl transition cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask stock, alternatives, or click camera to scan prescription..."
                  disabled={isLoading || isScanningPrescription}
                  className="flex-1 bg-slate-100 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || isScanningPrescription}
                  className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-slate-300 text-white rounded-xl shadow-md transition transform active:scale-95 disabled:scale-100 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>📸 Snap doctor prescription slip $\rightarrow$ Instant auto-billing</span>
                <span className="font-semibold text-emerald-700">₹ INR FEFO Stock</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
