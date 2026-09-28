/**
 * Central Indian Currency Formatter (₹)
 * Formats numbers into standard Indian numbering system: ₹1,00,000 / ₹25,500 / ₹1,250.00
 */
function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
}

module.exports = {
  formatINR
};
