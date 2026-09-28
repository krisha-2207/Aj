/**
 * Central Indian Rupee (₹) Currency Formatter
 * Formats numbers into standard Indian numbering system: ₹1,00,000 / ₹25,500 / ₹1,250
 */
export function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Format Date to standard Indian format (e.g. 21 Sep 2026)
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format Date and Time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Dynamic Expiry Status Detector
 * Rules:
 * - If expiry is within 2 months (<= 60 days): RED / 🔴 EXPIRING SOON
 * - If expiry is more than 2 months away: GREEN / 🟢 SAFE
 * - If medicine is already expired: DARK RED / ⚠️ EXPIRED
 */
export function getExpiryDetails(expiryDate) {
  if (!expiryDate) {
    return {
      status: 'UNKNOWN',
      label: 'Unknown',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      rowClass: '',
      daysRemaining: 0,
      isExpired: false,
      isExpiringSoon: false
    };
  }

  const now = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      label: '⚠️ EXPIRED',
      badgeClass: 'bg-red-900/10 text-red-900 border-red-400 font-semibold',
      rowClass: 'bg-red-50/80 hover:bg-red-100/80 border-l-4 border-l-red-800',
      daysRemaining,
      isExpired: true,
      isExpiringSoon: false
    };
  } else if (daysRemaining <= 60) {
    // Within 2 months
    return {
      status: 'EXPIRING_SOON',
      label: '🔴 EXPIRING SOON',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
      rowClass: 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500',
      daysRemaining,
      isExpired: false,
      isExpiringSoon: true
    };
  } else {
    // More than 2 months away
    return {
      status: 'SAFE',
      label: '🟢 SAFE',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
      rowClass: 'hover:bg-slate-50/80',
      daysRemaining,
      isExpired: false,
      isExpiringSoon: false
    };
  }
}
