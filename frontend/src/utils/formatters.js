/**
 * Utility functions for formatting data in the UI.
 */

/**
 * Formats a number with thousands separators and two decimal places.
 * @param {number} value - The number to format.
 * @returns {string} The formatted number string.
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
