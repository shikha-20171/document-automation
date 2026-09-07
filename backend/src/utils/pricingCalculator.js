/**
 * Pricing & Financial Calculation Utility for Quotations
 * Guarantees zero floating-point arithmetic drift with strict 2-decimal rounding.
 */

function round2(num) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Recalculate quotation line items and aggregate totals
 * @param {Array} rawItems Array of items { title, description, quantity, unit, unitPrice, discountPercent, taxPercent }
 * @param {Object} options Options { discountType: 'PERCENTAGE'|'FIXED', discountValue: number, taxRate: number }
 */
function calculateQuotationFinancials(rawItems = [], options = {}) {
  const discountType = options.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const discountValue = Math.max(0, Number(options.discountValue || 0));
  const taxRate = Math.max(0, Number(options.taxRate !== undefined ? options.taxRate : 18)); // Default 18% GST

  let subtotal = 0;
  const items = (rawItems || []).map((item, index) => {
    const quantity = Math.max(0, Number(item.quantity !== undefined ? item.quantity : 1));
    const unitPrice = Math.max(0, Number(item.unitPrice || 0));
    const discountPercent = Math.max(0, Math.min(100, Number(item.discountPercent || 0)));
    const taxPercent = Math.max(0, Number(item.taxPercent || 0));

    // Base price
    const base = quantity * unitPrice;
    const itemDiscount = (base * discountPercent) / 100;
    const taxableItemAmount = base - itemDiscount;
    const itemTax = (taxableItemAmount * taxPercent) / 100;
    const itemTotal = round2(taxableItemAmount + itemTax);

    subtotal += base;

    return {
      id: item.id || undefined,
      title: (item.title || 'Untitled Item').trim(),
      description: item.description ? String(item.description).trim() : null,
      quantity: round2(quantity),
      unit: (item.unit || 'unit').trim(),
      unitPrice: round2(unitPrice),
      discountPercent: round2(discountPercent),
      taxPercent: round2(taxPercent),
      amount: itemTotal,
      sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : index,
    };
  });

  subtotal = round2(subtotal);

  // Global discount
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = round2((subtotal * Math.min(100, discountValue)) / 100);
  } else {
    // Fixed amount
    discountAmount = round2(Math.min(subtotal, discountValue));
  }

  const taxableAmount = Math.max(0, round2(subtotal - discountAmount));
  const taxAmount = round2((taxableAmount * taxRate) / 100);
  const total = round2(taxableAmount + taxAmount);

  return {
    items,
    subtotal,
    discountType,
    discountValue: round2(discountValue),
    discountAmount,
    taxRate: round2(taxRate),
    taxAmount,
    total,
  };
}

/**
 * Format currency with locale and symbol
 */
function formatCurrency(amount, currency = 'INR') {
  const num = round2(amount);
  const symMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SGD: 'S$',
    AUD: 'A$',
  };
  const symbol = symMap[currency.toUpperCase()] || `${currency} `;
  
  // Format numbers nicely (Indian format for INR, US for USD/others)
  try {
    if (currency.toUpperCase() === 'INR') {
      return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (e) {
    return `${symbol}${num.toFixed(2)}`;
  }
}

module.exports = {
  round2,
  calculateQuotationFinancials,
  formatCurrency,
};
