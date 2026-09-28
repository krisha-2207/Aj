import React from 'react';
import { getExpiryDetails } from '../utils/formatters';

export default function ExpiryBadge({ expiryDate }) {
  const details = getExpiryDetails(expiryDate);

  // Dynamic ping color based on status
  const pingConfig = {
    EXPIRING_SOON: {
      pingBg: 'bg-rose-400',
      dotBg: 'bg-rose-500',
      glow: 'shadow-rose-500/20'
    },
    SAFE: {
      pingBg: 'bg-emerald-400',
      dotBg: 'bg-emerald-500',
      glow: 'shadow-emerald-500/15'
    },
    EXPIRED: {
      pingBg: 'bg-red-600',
      dotBg: 'bg-red-800',
      glow: 'shadow-red-800/30'
    }
  };

  const currentPing = pingConfig[details.status] || pingConfig.SAFE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium whitespace-nowrap shadow-xs transition-all duration-200 hover:scale-105 ${details.badgeClass}`}
      title={
        details.isExpired
          ? `Expired ${Math.abs(details.daysRemaining)} days ago`
          : `${details.daysRemaining} days remaining until expiry`
      }
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {details.status === 'EXPIRING_SOON' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentPing.pingBg} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${currentPing.dotBg}`}></span>
      </span>
      <span>{details.label}</span>
    </span>
  );
}
