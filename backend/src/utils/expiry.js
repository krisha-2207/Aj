/**
 * Expiry Date Detection Utility
 * Calculates dynamic status based on the current date:
 * - If already expired: DARK RED / EXPIRED
 * - If expiry is within 2 months (<= 60 days): RED / EXPIRING SOON
 * - If expiry is more than 2 months away: GREEN / SAFE
 */
function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return {
      status: 'UNKNOWN',
      label: 'Unknown',
      color: 'GRAY',
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
      color: 'DARK_RED',
      daysRemaining,
      isExpired: true,
      isExpiringSoon: false
    };
  } else if (daysRemaining <= 60) {
    // Within 2 months (<= 60 days)
    return {
      status: 'EXPIRING_SOON',
      label: '🔴 EXPIRING SOON',
      color: 'RED',
      daysRemaining,
      isExpired: false,
      isExpiringSoon: true
    };
  } else {
    // More than 2 months away
    return {
      status: 'SAFE',
      label: '🟢 SAFE',
      color: 'GREEN',
      daysRemaining,
      isExpired: false,
      isExpiringSoon: false
    };
  }
}

module.exports = {
  getExpiryStatus
};
