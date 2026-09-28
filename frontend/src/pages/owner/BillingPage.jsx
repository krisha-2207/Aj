import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { formatINR, formatDate, formatDateTime, getExpiryDetails } from '../../utils/formatters';
import InvoiceModal from '../../components/InvoiceModal';
import ExpiryBadge from '../../components/ExpiryBadge';
import PrescriptionScannerModal from '../../components/PrescriptionScannerModal';
import DrugInteractionModal from '../../components/DrugInteractionModal';
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  Phone,
  User,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
  Zap,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  Package,
  Tag,
  Calendar,
  AlertTriangle,
  FileText,
  Printer,
  X,
  History,
  ShoppingCart,
  BadgeAlert
} from 'lucide-react';

export default function BillingPage() {
  // Mode: 'POS_BILLING' | 'SALES_RETURN' | 'RETURN_HISTORY'
  const [activeMode, setActiveMode] = useState('POS_BILLING');

  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMeds, setExpandedMeds] = useState({}); // { [medId]: boolean }

  // Customer Phone Workflow State (POS Billing)
  const [phoneInput, setPhoneInput] = useState('');
  const [customerLookupState, setCustomerLookupState] = useState('IDLE'); // 'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [lookupMessage, setLookupMessage] = useState('');

  // New Customer inline form state (Only Name and Address - Email removed)
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerSavedSuccess, setCustomerSavedSuccess] = useState(false);

  // Billing & Cart state
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discount, setDiscount] = useState(0);

  // Processing & Modal
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [completedBill, setCompletedBill] = useState(null);

  // Agentic AI State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);

  const handleApplyPrescription = ({ items, patientName }) => {
    if (items && items.length > 0) {
      setCart((prev) => {
        const newCart = [...prev];
        items.forEach((item) => {
          const exists = newCart.findIndex((c) => c.batchId === item.batchId);
          if (exists > -1) {
            newCart[exists].quantity += item.quantity;
          } else {
            newCart.push(item);
          }
        });
        return newCart;
      });
      setBillingError('');
    }
    if (patientName && !activeCustomer) {
      setNewCustomerName(patientName);
    }
  };

  // ==========================================================
  // SALES RETURN (CUSTOMER MISTAKEN PURCHASE REFUND) STATE
  // ==========================================================
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [isSearchingBill, setIsSearchingBill] = useState(false);
  const [searchedBill, setSearchedBill] = useState(null);
  const [recentBillsList, setRecentBillsList] = useState([]);
  const [selectedReturnItems, setSelectedReturnItems] = useState({}); // { [itemIndex]: { selected: boolean, returnQty: number, reason: string } }
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [returnErrorMsg, setReturnErrorMsg] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [completedReturnReceipt, setCompletedReturnReceipt] = useState(null);

  // Return History List
  const [returnsHistoryList, setReturnsHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Direct Walk-In Return (without invoice reference)
  const [isDirectReturn, setIsDirectReturn] = useState(false);
  const [directReturnForm, setDirectReturnForm] = useState({
    customerName: '',
    customerPhone: '',
    medicineName: '',
    batchNumber: '',
    quantity: 1,
    unitPrice: '',
    refundAmount: '',
    reason: 'Mistakenly bought by customer'
  });

  useEffect(() => {
    fetchMedicines();
    fetchRecentBills();

    // Check if there are preloaded prescription items from Krisha AI
    const checkPreloaded = () => {
      try {
        const stored = localStorage.getItem('krisha_preloaded_cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.items?.length > 0) {
            handleApplyPrescription(parsed);
          }
          localStorage.removeItem('krisha_preloaded_cart');
        }
      } catch (e) {
        console.error('Error loading preloaded prescription cart', e);
      }
    };

    checkPreloaded();

    const handleCustomEvent = (e) => {
      if (e.detail?.items) {
        handleApplyPrescription(e.detail);
      }
    };

    window.addEventListener('krisha_load_prescription_cart', handleCustomEvent);
    return () => window.removeEventListener('krisha_load_prescription_cart', handleCustomEvent);
  }, []);

  useEffect(() => {
    if (activeMode === 'RETURN_HISTORY') {
      fetchReturnsHistory();
    }
  }, [activeMode]);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data);
    } catch (err) {
      console.error('Failed to load medicines for billing', err);
    }
  };

  const fetchRecentBills = async () => {
    try {
      const res = await api.get('/bills?limit=10');
      setRecentBillsList(res.data?.bills || []);
    } catch (err) {
      console.error('Failed to load recent bills for returns', err);
    }
  };

  const fetchReturnsHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/bills/returns/sales');
      setReturnsHistoryList(res.data || []);
    } catch (err) {
      console.error('Failed to load sales returns history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Toggle dropdown accordion to view batch details for a medicine
  const toggleExpandMed = (medId) => {
    setExpandedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId]
    }));
  };

  // Filter medicines based on search query
  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) {
      return medicines.slice(0, 12);
    }
    const q = searchQuery.toLowerCase().trim();
    return medicines.filter((m) => {
      const matchName = m.name?.toLowerCase().includes(q);
      const matchProdId = m.productId?.toLowerCase().includes(q);
      const matchGeneric = m.genericName?.toLowerCase().includes(q);
      const matchCategory = m.category?.toLowerCase().includes(q);
      const matchBatch = (m.batches || []).some((b) => b.batchNumber?.toLowerCase().includes(q));
      return matchName || matchProdId || matchGeneric || matchCategory || matchBatch;
    }).slice(0, 20);
  }, [medicines, searchQuery]);

  // Automatic Phone Lookup trigger as user types 10 digits
  const handlePhoneChange = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(raw);
    setCustomerSavedSuccess(false);

    if (raw.length === 10) {
      performPhoneLookup(raw);
    } else if (raw.length === 0) {
      setCustomerLookupState('IDLE');
      setActiveCustomer(null);
      setLookupMessage('');
    } else {
      setCustomerLookupState('IDLE');
      setActiveCustomer(null);
      setLookupMessage('Enter full 10-digit mobile number');
    }
  };

  const performPhoneLookup = async (phoneToSearch) => {
    try {
      setCustomerLookupState('SEARCHING');
      setLookupMessage('Searching customer database...');
      const res = await api.get(`/bills/customers/by-phone/${phoneToSearch}`);

      if (res.data && res.data.found && res.data.customer) {
        setActiveCustomer(res.data.customer);
        setCustomerLookupState('FOUND');
        setLookupMessage('✓ Customer Found in Database');
      } else {
        setActiveCustomer(null);
        setCustomerLookupState('NOT_FOUND');
        setLookupMessage('+ New Customer: Phone not found in database');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActiveCustomer(null);
        setCustomerLookupState('NOT_FOUND');
        setLookupMessage('+ New Customer: Phone not registered');
      } else {
        setCustomerLookupState('IDLE');
        setLookupMessage('Phone lookup failed. Please try again.');
      }
    }
  };

  // Save New Customer directly during billing (Name + Address only)
  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !phoneInput.trim()) {
      setBillingError('Customer Name and Phone Number are required.');
      return;
    }

    try {
      setIsSavingCustomer(true);
      setBillingError('');
      const res = await api.post('/bills/customers', {
        name: newCustomerName.trim(),
        phone: phoneInput.trim(),
        address: newCustomerAddress.trim() || null
      });

      const savedCust = res.data.customer;
      setActiveCustomer(savedCust);
      setCustomerLookupState('FOUND');
      setCustomerSavedSuccess(true);
      setLookupMessage('✓ Customer Saved & Selected for Bill');
    } catch (err) {
      setBillingError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Add specific batch directly to invoice cart
  const handleAddBatch = (med, batch) => {
    const exp = getExpiryDetails(batch.expiryDate);
    if (exp.isExpired) {
      setBillingError(`Cannot dispense '${med.name}' (Batch: ${batch.batchNumber}): Batch is expired!`);
      return;
    }
    if (batch.remainingQuantity <= 0) {
      setBillingError(`Batch '${batch.batchNumber}' is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex((i) => i.batchId === batch.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < batch.remainingQuantity) {
        updated[existingIndex].quantity += 1;
        setCart(updated);
        setBillingError('');
      } else {
        setBillingError(`Maximum stock of ${batch.remainingQuantity} units reached for batch ${batch.batchNumber}`);
      }
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          productId: med.productId,
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageUsage: med.dosageUsage || 'Take as advised by physician.',
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          maxStock: batch.remainingQuantity,
          quantity: 1,
          unitPrice: batch.sellingPrice,
          gstRate: med.gstRate !== undefined ? med.gstRate : 12.0,
          availableBatches: med.batches || []
        }
      ]);
      setBillingError('');
    }
  };

  const handleUpdateQty = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > item.maxStock) {
      setBillingError(`Only ${item.maxStock} units available for batch ${item.batchNumber}`);
      return;
    } else {
      item.quantity = newQty;
      setBillingError('');
    }
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculation totals
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = cart.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity * item.gstRate) / 100,
    0
  );
  const numDiscount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - numDiscount);

  // Submit and Generate Bill
  const handleConfirmBill = async () => {
    if (!activeCustomer) {
      setBillingError('Please enter a customer phone number and select/save the customer first.');
      return;
    }
    if (cart.length === 0) {
      setBillingError('Cart is empty. Please search and add at least one medicine batch.');
      return;
    }

    try {
      setIsSubmittingBill(true);
      setBillingError('');

      const billPayload = {
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
        customerAddress: activeCustomer.address || null,
        customerType: activeCustomer.customerType || 'EXISTING',
        paymentMethod,
        discount: numDiscount,
        items: cart.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          usageInstructions: item.dosageUsage
        }))
      };

      const res = await api.post('/bills', billPayload);
      const generatedBill = res.data?.bill || res.data;
      setCompletedBill(generatedBill);

      // Reset cart and customer for next bill
      setCart([]);
      setDiscount(0);
      setPhoneInput('');
      setActiveCustomer(null);
      setCustomerLookupState('IDLE');
      setLookupMessage('');
      setNewCustomerName('');
      setNewCustomerAddress('');
      fetchMedicines(); // Refresh stock counts
      fetchRecentBills();
    } catch (err) {
      setBillingError(err.response?.data?.error || 'Failed to complete bill. Please check batch quantities.');
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // ==========================================================
  // SALES RETURN SEARCH & PROCESS HANDLERS
  // ==========================================================

  // Search Bill by Bill Number or Phone
  const handleSearchBillForReturn = async (e) => {
    if (e) e.preventDefault();
    if (!returnSearchQuery.trim()) return;

    try {
      setIsSearchingBill(true);
      setReturnErrorMsg('');
      setReturnSuccessMsg('');

      const res = await api.get('/bills', {
        params: { search: returnSearchQuery.trim(), limit: 5 }
      });

      const bills = res.data?.bills || [];
      if (bills.length === 0) {
        setSearchedBill(null);
        setReturnErrorMsg(`No invoice found matching "${returnSearchQuery}". You can also use Direct Return below.`);
      } else {
        // Fetch full bill with line items
        const targetBill = bills[0];
        const fullRes = await api.get(`/bills/${targetBill.id}`);
        setSearchedBill(fullRes.data);

        // Initialize selection state for line items
        const initialSelections = {};
        (fullRes.data?.items || []).forEach((item, idx) => {
          initialSelections[idx] = {
            selected: true,
            returnQty: item.quantity,
            reason: 'Mistakenly bought by customer'
          };
        });
        setSelectedReturnItems(initialSelections);
      }
    } catch (err) {
      console.error('Search bill error:', err);
      setReturnErrorMsg('Failed to search invoice. Please check the bill number.');
    } finally {
      setIsSearchingBill(false);
    }
  };

  const handleSelectBillDirectly = async (billId) => {
    try {
      setIsSearchingBill(true);
      setReturnErrorMsg('');
      setReturnSuccessMsg('');
      const res = await api.get(`/bills/${billId}`);
      setSearchedBill(res.data);

      const initialSelections = {};
      (res.data?.items || []).forEach((item, idx) => {
        initialSelections[idx] = {
          selected: true,
          returnQty: item.quantity,
          reason: 'Mistakenly bought by customer'
        };
      });
      setSelectedReturnItems(initialSelections);
    } catch (err) {
      setReturnErrorMsg('Failed to load bill details.');
    } finally {
      setIsSearchingBill(false);
    }
  };

  // Calculate return total
  const returnSummary = useMemo(() => {
    if (!searchedBill || !searchedBill.items) return { totalQty: 0, totalRefund: 0, itemsCount: 0 };

    let totalQty = 0;
    let totalRefund = 0;
    let itemsCount = 0;

    searchedBill.items.forEach((item, idx) => {
      const sel = selectedReturnItems[idx];
      if (sel && sel.selected && sel.returnQty > 0) {
        const qty = parseInt(sel.returnQty, 10);
        const unitP = parseFloat(item.unitPrice || 0);
        const lineRefund = qty * unitP;
        totalQty += qty;
        totalRefund += lineRefund;
        itemsCount += 1;
      }
    });

    return {
      totalQty,
      totalRefund: Number(totalRefund.toFixed(2)),
      itemsCount
    };
  }, [searchedBill, selectedReturnItems]);

  // Submit Sales Return from Bill
  const handleProcessSalesReturn = async () => {
    if (!searchedBill) return;
    if (returnSummary.itemsCount === 0) {
      setReturnErrorMsg('Please select at least one item and quantity to return.');
      return;
    }

    try {
      setIsProcessingReturn(true);
      setReturnErrorMsg('');

      const returnItemsPayload = [];
      searchedBill.items.forEach((item, idx) => {
        const sel = selectedReturnItems[idx];
        if (sel && sel.selected && sel.returnQty > 0) {
          const qty = parseInt(sel.returnQty, 10);
          const unitPrice = parseFloat(item.unitPrice || 0);
          const refundAmount = Number((qty * unitPrice).toFixed(2));
          const gstRefund = Number(((refundAmount * (item.gstRate || 12)) / 100).toFixed(2));

          returnItemsPayload.push({
            medicineName: item.medicine?.name || item.medicineName || 'Medicine',
            batchNumber: item.batch?.batchNumber || item.batchNumber || 'BATCH',
            quantity: qty,
            refundAmount,
            gstRefund,
            reason: sel.reason || 'Mistakenly bought by customer'
          });
        }
      });

      const payload = {
        billId: searchedBill.id,
        customerName: searchedBill.customerName,
        customerPhone: searchedBill.customerPhone,
        doctorName: searchedBill.doctorName,
        items: returnItemsPayload
      };

      const res = await api.post('/bills/returns/sales', payload);

      setReturnSuccessMsg(
        `Success! Sales return receipt generated for ${returnSummary.totalQty} tablets. Refund of ${formatINR(returnSummary.totalRefund)} paid to ${searchedBill.customerName}. Inventory stock restored.`
      );

      setCompletedReturnReceipt({
        returns: res.data?.returns || [res.data?.return],
        billNumber: searchedBill.billNumber,
        customerName: searchedBill.customerName,
        customerPhone: searchedBill.customerPhone,
        totalRefund: returnSummary.totalRefund,
        totalQty: returnSummary.totalQty,
        returnDate: new Date()
      });

      // Refresh data
      fetchMedicines();
      fetchReturnsHistory();
    } catch (err) {
      console.error('Process sales return error:', err);
      setReturnErrorMsg(err.response?.data?.error || 'Failed to process sales return.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Submit Direct Walk-In Return (without prior invoice lookup)
  const handleProcessDirectReturn = async (e) => {
    e.preventDefault();
    if (!directReturnForm.customerName.trim() || !directReturnForm.medicineName.trim() || !directReturnForm.quantity) {
      setReturnErrorMsg('Customer Name, Medicine Name, and Quantity are required.');
      return;
    }

    try {
      setIsProcessingReturn(true);
      setReturnErrorMsg('');

      const qty = parseInt(directReturnForm.quantity, 10);
      const unitP = parseFloat(directReturnForm.unitPrice || 25);
      const refund = parseFloat(directReturnForm.refundAmount) || (qty * unitP);

      const payload = {
        customerName: directReturnForm.customerName.trim(),
        customerPhone: directReturnForm.customerPhone?.trim() || null,
        medicineName: directReturnForm.medicineName.trim(),
        batchNumber: directReturnForm.batchNumber?.trim() || 'BATCH-RET',
        quantity: qty,
        refundAmount: refund,
        gstRefund: Number((refund * 0.12).toFixed(2)),
        reason: directReturnForm.reason
      };

      const res = await api.post('/bills/returns/sales', payload);

      setReturnSuccessMsg(
        `Direct return registered! Restored ${qty} tablets of ${directReturnForm.medicineName} into inventory. Refund: ${formatINR(refund)}.`
      );

      setCompletedReturnReceipt({
        returns: res.data?.returns || [res.data?.return],
        billNumber: 'DIRECT-WALKIN',
        customerName: directReturnForm.customerName,
        customerPhone: directReturnForm.customerPhone,
        totalRefund: refund,
        totalQty: qty,
        returnDate: new Date()
      });

      // Reset form
      setDirectReturnForm({
        customerName: '',
        customerPhone: '',
        medicineName: '',
        batchNumber: '',
        quantity: 1,
        unitPrice: '',
        refundAmount: '',
        reason: 'Mistakenly bought by customer'
      });

      fetchMedicines();
      fetchReturnsHistory();
    } catch (err) {
      setReturnErrorMsg(err.response?.data?.error || 'Failed to process direct return.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Counter Operations & Dispensing
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-teal-600" />
            <span>Smart POS & Sales Return Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue new retail invoices, or process customer sales returns for mistakenly purchased products and restore inventory.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveMode('POS_BILLING');
              setBillingError('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeMode === 'POS_BILLING'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Bill (POS)</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('SALES_RETURN');
              setReturnErrorMsg('');
              setReturnSuccessMsg('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeMode === 'SALES_RETURN'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>⚡ Sales Return / Refund</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('RETURN_HISTORY');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeMode === 'RETURN_HISTORY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Return Receipts</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: STANDARD POS NEW BILLING                         */}
      {/* ======================================================== */}
      {activeMode === 'POS_BILLING' && (
        <div className="space-y-6">
          {/* Global Error Banner */}
          {billingError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="flex-1">{billingError}</span>
              <button
                onClick={() => setBillingError('')}
                className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* AGENTIC AI POS COPILOT ACTION BAR */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-4 md:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
                <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  Krisha AI Dispensing & Clinical Guard
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Scan doctor handwritten prescriptions (OCR) or screen active cart for drug-drug interactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>📸 Scan Prescription (AI OCR)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) {
                    setBillingError('Please add at least 1 medicine to cart to screen interactions.');
                    return;
                  }
                  setIsInteractionModalOpen(true);
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-bold transition transform active:scale-95 cursor-pointer"
              >
                <BadgeAlert className="w-4 h-4 text-amber-300" />
                <span>🛡️ AI Safety Check ({cart.length})</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: CUSTOMER PHONE LOOKUP & PROFILE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Customer Verification</span>
              </h2>
              {activeCustomer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Verified Customer
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  CUSTOMER PHONE NUMBER <span className="text-slate-400 font-normal">(primary billing lookup)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter 10-digit mobile number (e.g. 9845011111)"
                    className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all tracking-wider"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => phoneInput.length === 10 && performPhoneLookup(phoneInput)}
                      disabled={phoneInput.length !== 10 || customerLookupState === 'SEARCHING'}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                    >
                      {customerLookupState === 'SEARCHING' ? 'Checking...' : 'Re-check'}
                    </button>
                  </div>
                </div>

                {lookupMessage && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${
                      customerLookupState === 'FOUND'
                        ? 'text-teal-700'
                        : customerLookupState === 'NOT_FOUND'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {customerLookupState === 'FOUND' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    ) : customerLookupState === 'NOT_FOUND' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ) : null}
                    <span>{lookupMessage}</span>
                  </p>
                )}
              </div>

              <div className="md:col-span-4 flex items-center justify-end">
                {activeCustomer && (
                  <div className="w-full p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                        Active Customer
                      </span>
                      <span className="text-sm font-bold text-slate-900">{activeCustomer.name}</span>
                      {activeCustomer.address && (
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {activeCustomer.address}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setActiveCustomer(null);
                        setPhoneInput('');
                        setCustomerLookupState('IDLE');
                        setLookupMessage('');
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* NEW CUSTOMER FORM */}
            {customerLookupState === 'NOT_FOUND' && (
              <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-3">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Complete Customer Profile (Auto-prefilled with {phoneInput})</span>
                </div>

                <form onSubmit={handleSaveNewCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kumar"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Address / City (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Indiranagar, Bengaluru"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingCustomer || !newCustomerName.trim()}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCustomer ? (
                        <span>Saving Customer...</span>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Customer & Continue Billing</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* SECTION 2: MEDICINE SEARCH & BATCH-WISE DISPENSING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Search & Expandable Batches */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[580px]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-teal-600" />
                      <span>Search & Add Medicines</span>
                    </h2>
                    <span className="text-[11px] font-medium text-slate-400">
                      {filteredMedicines.length} medicines
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Medicine Name, Generic, ID (MED001)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Medicines List with Down-Arrow Batch Drawer */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {filteredMedicines.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold">No medicines matched</p>
                        <p className="text-[11px] text-slate-400">
                          Try searching with another medicine name or generic name.
                        </p>
                      </div>
                    ) : (
                      filteredMedicines.map((med) => {
                        const batches = med.batches || [];
                        const totalStock = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
                        const isOutOfStock = totalStock === 0;
                        const isExpanded = Boolean(expandedMeds[med.id]);

                        const sortedBatches = [...batches].sort(
                          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                        );

                        return (
                          <div
                            key={med.id}
                            className={`rounded-2xl border transition-all ${
                              isExpanded
                                ? 'bg-teal-50/20 border-teal-300 shadow-xs'
                                : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="p-3.5 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {med.name}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    {med.productId}
                                  </span>
                                  {med.strength && (
                                    <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                      {med.strength}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {med.genericName} • {med.category}
                                </p>

                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-700">
                                    Total Stock: <span className={totalStock <= (med.minStockLevel || 10) ? 'text-amber-600' : 'text-teal-700'}>{totalStock} units</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {isOutOfStock ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                    Out of Stock
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandMed(med.id)}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                        : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-200'
                                    }`}
                                    title="Click down arrow to view Batch IDs & Expiry Dates"
                                  >
                                    <span className="text-[11px]">
                                      {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-white" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-teal-600" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Batches Drawer */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-2 border-t border-teal-100 bg-teal-50/30 rounded-b-2xl space-y-2 animate-in fade-in duration-150">
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                                  <span>Select Batch to Dispense (FEFO Sorted):</span>
                                  <span>{sortedBatches.length} available</span>
                                </div>

                                <div className="space-y-1.5">
                                  {sortedBatches.map((b) => {
                                    const exp = getExpiryDetails(b.expiryDate);
                                    const isBatchOutOfStock = b.remainingQuantity <= 0;
                                    const isBatchExpired = exp.isExpired;
                                    const isBatchDisabled = isBatchOutOfStock || isBatchExpired;

                                    return (
                                      <div
                                        key={b.id}
                                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                          isBatchDisabled
                                            ? 'bg-slate-100 border-slate-200 opacity-60'
                                            : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs'
                                        }`}
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono font-bold text-[11px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                              <Tag className="w-3 h-3 text-teal-600" />
                                              {b.batchNumber}
                                            </span>
                                            <ExpiryBadge expiryDate={b.expiryDate} />
                                          </div>

                                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>Exp: <strong className="text-slate-700">{formatDate(b.expiryDate)}</strong></span>
                                            <span>•</span>
                                            <span>Stock: <strong className={b.remainingQuantity <= 10 ? 'text-amber-600' : 'text-slate-800'}>{b.remainingQuantity} units</strong></span>
                                            <span>•</span>
                                            <span className="font-bold text-slate-900">{formatINR(b.sellingPrice)}</span>
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {isBatchExpired ? (
                                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 block">
                                              Expired
                                            </span>
                                          ) : isBatchOutOfStock ? (
                                            <span className="text-[10px] font-medium text-slate-400 px-2 py-1 block">
                                              Out of Stock
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleAddBatch(med, b)}
                                              className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>Add</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Invoice Cart & Checkout */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[580px]">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-teal-600" />
                        <span>Current Invoice Items ({cart.length} Batches)</span>
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Review batch numbers, expiry dates, and quantity per batch.
                      </p>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Cart List */}
                  {cart.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">Invoice cart is empty.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Search and pick medicine batches on the left to add items to this bill.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.batchId}-${idx}`}
                          className="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          {/* Medicine & Batch info */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                {item.medicineName}
                              </h4>
                              <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {item.batchNumber}
                              </span>
                              <ExpiryBadge expiryDate={item.expiryDate} />
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                              <span className="font-semibold text-slate-800 font-mono">{formatINR(item.unitPrice)}</span>
                              <span className="text-slate-400">/ unit</span>
                              <span>•</span>
                              <span className="text-slate-400">+{item.gstRate}% GST</span>
                              <span>•</span>
                              <span className="text-slate-400">Max in Stock: {item.maxStock}</span>
                            </div>
                          </div>

                          {/* Stepper, Line Total & Delete button */}
                          <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-white rounded-xl p-0.5 border border-slate-200 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, -1)}
                                className="w-6 h-6 rounded-lg text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-sm"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-slate-900 text-xs font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, 1)}
                                className="w-6 h-6 rounded-lg text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-sm"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Line Total */}
                            <div className="text-right min-w-[75px]">
                              <span className="font-black text-slate-900 text-sm font-mono block">
                                {formatINR(item.unitPrice * item.quantity)}
                              </span>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkout Controls */}
                <div className="pt-4 border-t border-slate-100 space-y-3 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`py-2 px-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'UPI'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`py-2 px-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'CASH'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`py-2 px-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'CARD'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Card</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Discount Amount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-800">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxes (GST):</span>
                      <span className="font-semibold text-slate-800">{formatINR(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-teal-700">{formatINR(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmBill}
                    disabled={isSubmittingBill || cart.length === 0 || !activeCustomer}
                    className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingBill ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirm & Generate Invoice ({formatINR(grandTotal)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: SALES RETURN / CUSTOMER MISTAKEN PURCHASE REFUND */}
      {/* ======================================================== */}
      {activeMode === 'SALES_RETURN' && (
        <div className="space-y-6">
          {/* Sales Return Banner */}
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center font-black shadow-lg shadow-rose-500/25 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Customer Sales Return & Product Refund</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    MISTAKEN PURCHASE RETURN
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Process customer returns for mistaken purchases, doctor prescription revisions, or unneeded medicines. Restores inventory automatically.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDirectReturn(!isDirectReturn)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              {isDirectReturn ? '← Search Original Invoice' : '+ Direct Walk-In Return'}
            </button>
          </div>

          {/* Feedback Messages */}
          {returnSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="flex-1">{returnSuccessMsg}</span>
              <button
                onClick={() => setReturnSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {returnErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="flex-1">{returnErrorMsg}</span>
              <button
                onClick={() => setReturnErrorMsg('')}
                className="text-rose-600 hover:text-rose-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {!isDirectReturn ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Invoice Search & Recent Invoices */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-600" />
                      <span>Search Original Retail Invoice</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter invoice number (e.g. INV-2026-0001) or customer phone number
                    </p>
                  </div>

                  <form onSubmit={handleSearchBillForReturn} className="flex gap-2">
                    <input
                      type="text"
                      value={returnSearchQuery}
                      onChange={(e) => setReturnSearchQuery(e.target.value)}
                      placeholder="e.g. INV-2026-0001 or 9845011111..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingBill || !returnSearchQuery.trim()}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSearchingBill ? 'Finding...' : 'Find Bill'}
                    </button>
                  </form>

                  {/* Recent Customer Invoices */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Or Pick from Recent Invoices:
                    </span>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {recentBillsList.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleSelectBillDirectly(b.id)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            searchedBill?.id === b.id
                              ? 'bg-rose-50 border-rose-400 shadow-xs'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{b.billNumber}</span>
                            <span className="font-black text-slate-900">{formatINR(b.grandTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{b.customerName} ({b.customerPhone})</span>
                            <span>{formatDate(b.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Bill Items Selection & Refund Process */}
              <div className="lg:col-span-7 space-y-4">
                {searchedBill ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                    {/* Invoice Meta Bar */}
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
                          Original Invoice Found
                        </span>
                        <span className="font-mono font-black text-slate-900 text-sm">{searchedBill.billNumber}</span>
                        <span className="text-slate-500 text-[11px] block mt-0.5">
                          Customer: <strong className="text-slate-800">{searchedBill.customerName}</strong> • Phone: {searchedBill.customerPhone}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">{formatDateTime(searchedBill.createdAt)}</span>
                        <span className="text-xs font-bold text-slate-900">Original Total: {formatINR(searchedBill.grandTotal)}</span>
                      </div>
                    </div>

                    {/* Line Items for Return */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                        <span>Select Products to Return by Customer:</span>
                        <span className="text-rose-700 font-bold">{searchedBill.items?.length || 0} purchased items</span>
                      </h4>

                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {searchedBill.items?.map((item, idx) => {
                          const sel = selectedReturnItems[idx] || { selected: false, returnQty: 1, reason: 'Mistakenly bought by customer' };

                          return (
                            <div
                              key={item.id || idx}
                              className={`p-3.5 rounded-2xl border transition-all text-xs space-y-3 ${
                                sel.selected
                                  ? 'bg-rose-50/40 border-rose-300 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={sel.selected}
                                    onChange={(e) => {
                                      setSelectedReturnItems({
                                        ...selectedReturnItems,
                                        [idx]: { ...sel, selected: e.target.checked }
                                      });
                                    }}
                                    className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                                  />
                                  <div>
                                    <h5 className="font-bold text-slate-900">{item.medicine?.name || item.medicineName}</h5>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                      <span>Batch: <strong className="font-mono text-rose-700">{item.batch?.batchNumber || item.batchNumber}</strong></span>
                                      <span>•</span>
                                      <span>Bought: <strong className="text-slate-800">{item.quantity} units</strong></span>
                                      <span>•</span>
                                      <span>Price: {formatINR(item.unitPrice)}</span>
                                    </div>
                                  </div>
                                </label>

                                <div className="text-right">
                                  <span className="font-black text-rose-900 text-sm">
                                    {formatINR((sel.returnQty || 0) * (item.unitPrice || 0))}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">Refund Value</span>
                                </div>
                              </div>

                              {sel.selected && (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-rose-100 items-center">
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                      Qty to Return (Max {item.quantity})
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.quantity}
                                      value={sel.returnQty}
                                      onChange={(e) => {
                                        const val = Math.min(item.quantity, Math.max(1, parseInt(e.target.value || 1, 10)));
                                        setSelectedReturnItems({
                                          ...selectedReturnItems,
                                          [idx]: { ...sel, returnQty: val }
                                        });
                                      }}
                                      className="w-full p-1.5 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-900"
                                    />
                                  </div>

                                  <div className="sm:col-span-8">
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                      Return Reason / Notes
                                    </label>
                                    <select
                                      value={sel.reason}
                                      onChange={(e) => {
                                        setSelectedReturnItems({
                                          ...selectedReturnItems,
                                          [idx]: { ...sel, reason: e.target.value }
                                        });
                                      }}
                                      className="w-full p-1.5 bg-white border border-rose-200 rounded-xl text-xs text-slate-800"
                                    >
                                      <option value="Mistakenly bought by customer">Mistakenly bought by customer</option>
                                      <option value="Doctor changed prescription / dosage">Doctor changed prescription / dosage</option>
                                      <option value="Wrong medicine requested at counter">Wrong medicine requested at counter</option>
                                      <option value="Customer unneeded / unused item">Customer unneeded / unused item</option>
                                      <option value="Adverse reaction / unsuited">Adverse reaction / unsuited</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Refund Summary & Action */}
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Items to Return:</span>
                          <span className="font-bold text-slate-900">{returnSummary.itemsCount} products ({returnSummary.totalQty} tablets)</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Inventory Auto-Restock:</span>
                          <span className="font-bold text-teal-700">✓ Quantity will be re-added to store stock</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                          <span>Total Refund Payable to Customer:</span>
                          <span className="text-rose-700">{formatINR(returnSummary.totalRefund)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleProcessSalesReturn}
                        disabled={isProcessingReturn || returnSummary.itemsCount === 0}
                        className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingReturn ? (
                          <span>Processing Sales Return...</span>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>Confirm Sales Return & Pay Refund ({formatINR(returnSummary.totalRefund)})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-700">No invoice selected</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Search an invoice number or pick a recent bill on the left to select items for customer refund.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Direct Walk-In Return Form */
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm max-w-2xl mx-auto space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Direct Walk-In Customer Return (No Invoice Ref)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manually register product return when customer does not have their original bill.
                </p>
              </div>

              <form onSubmit={handleProcessDirectReturn} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={directReturnForm.customerName}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, customerName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9845011111"
                      value={directReturnForm.customerPhone}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, customerPhone: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg"
                      value={directReturnForm.medicineName}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, medicineName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch Number (printed on strip)</label>
                    <input
                      type="text"
                      placeholder="e.g. DOLO-2026-BATCH1"
                      value={directReturnForm.batchNumber}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, batchNumber: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tablets Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={directReturnForm.quantity}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, quantity: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 30.00"
                      value={directReturnForm.unitPrice}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, unitPrice: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Refund Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 150.00"
                      value={directReturnForm.refundAmount || (directReturnForm.quantity * (directReturnForm.unitPrice || 0))}
                      onChange={(e) => setDirectReturnForm({ ...directReturnForm, refundAmount: e.target.value })}
                      className="w-full p-2 border border-rose-300 bg-rose-50 rounded-xl font-black text-rose-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Return *</label>
                  <select
                    value={directReturnForm.reason}
                    onChange={(e) => setDirectReturnForm({ ...directReturnForm, reason: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="Mistakenly bought by customer">Mistakenly bought by customer</option>
                    <option value="Doctor changed prescription / dosage">Doctor changed prescription / dosage</option>
                    <option value="Wrong medicine requested at counter">Wrong medicine requested at counter</option>
                    <option value="Customer unneeded / unused item">Customer unneeded / unused item</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectReturn(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingReturn}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingReturn ? 'Processing...' : 'Process Return & Restock'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: SALES RETURN HISTORY & CREDIT NOTES              */}
      {/* ======================================================== */}
      {activeMode === 'RETURN_HISTORY' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-rose-600" />
                <span>Customer Sales Return Receipts & Audit Log</span>
              </h2>
              <p className="text-xs text-slate-500">
                Log of all customer returns, refunded amounts, and restocked tablet batches.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {returnsHistoryList.length} Returns Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <th className="p-3">Return Note</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Medicine & Batch</th>
                  <th className="p-3 text-right">Qty Returned</th>
                  <th className="p-3 text-right">Refund (₹)</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      Loading return receipts...
                    </td>
                  </tr>
                ) : returnsHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No customer returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  returnsHistoryList.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-rose-700">{ret.returnNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{ret.bill?.billNumber || 'Direct Return'}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{ret.customerName}</span>
                        {ret.customerPhone && <span className="text-[10px] text-slate-400 font-mono">{ret.customerPhone}</span>}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{ret.medicineName}</span>
                        <span className="text-[10px] font-mono text-slate-500">Batch: {ret.batchNumber}</span>
                      </td>
                      <td className="p-3 text-right font-black text-teal-800">+{ret.quantity} units</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatINR(ret.refundAmount)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {ret.reason}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{formatDateTime(ret.returnDate || ret.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RETURN RECEIPT MODAL POPUP                               */}
      {/* ======================================================== */}
      {completedReturnReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Sales Return Credit Voucher</h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    {completedReturnReceipt.returns[0]?.returnNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletedReturnReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{completedReturnReceipt.customerName}</span>
              </div>
              {completedReturnReceipt.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono text-slate-800">{completedReturnReceipt.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono font-bold text-slate-900">{completedReturnReceipt.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Returned Units:</span>
                <span className="font-bold text-teal-700">{completedReturnReceipt.totalQty} Tablets (Restocked)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                <span className="text-slate-900">Refund Amount Paid:</span>
                <span className="text-emerald-700">{formatINR(completedReturnReceipt.totalRefund)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Returned Products:</span>
              {completedReturnReceipt.returns.map((r, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{r.medicineName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Batch: {r.batchNumber} • {r.reason}</p>
                  </div>
                  <span className="font-bold text-rose-700">{formatINR(r.refundAmount)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletedReturnReceipt(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Done & Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal for New Bill Generation */}
      {completedBill && (
        <InvoiceModal bill={completedBill} onClose={() => setCompletedBill(null)} />
      )}

      {/* Krisha Agentic AI Prescription Scanner Modal */}
      <PrescriptionScannerModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onApplyToCart={handleApplyPrescription}
        allMedicines={medicines}
      />

      {/* Krisha Agentic AI Drug Interaction & Safety Guard */}
      <DrugInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        cartItems={cart}
      />
    </div>
  );
}

