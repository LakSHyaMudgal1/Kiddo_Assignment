/**
 * Format a numeric price to a display string.
 */
export const formatPrice = (
  amount: number,
  currency = 'INR',
  locale = 'en-IN',
): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Calculate discount percentage between original and sale price.
 */
export const discountPercent = (
  originalPrice: number,
  salePrice: number,
): number =>
  Math.round(((originalPrice - salePrice) / originalPrice) * 100);
