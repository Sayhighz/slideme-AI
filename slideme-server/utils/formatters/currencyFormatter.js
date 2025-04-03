/**
 * Currency formatting utilities
 */

/**
 * Format a number as Thai Baht
 * @param {number} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include ฿ symbol
 * @returns {string} Formatted currency string
 */
export const formatThaiBaht = (amount, includeSymbol = true) => {
    if (amount === null || amount === undefined) return '';
    
    const formattedAmount = Number(amount).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return includeSymbol ? `฿${formattedAmount}` : formattedAmount;
  };
  
  /**
   * Format a number with thousand separators
   * @param {number} value - The value to format
   * @returns {string} Formatted number string
   */
  export const formatNumber = (value) => {
    if (value === null || value === undefined) return '';
    
    return Number(value).toLocaleString('th-TH');
  };
  
  /**
   * Format a decimal number with specified decimal places
   * @param {number} value - The value to format
   * @param {number} decimalPlaces - Number of decimal places
   * @returns {string} Formatted decimal string
   */
  export const formatDecimal = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined) return '';
    
    return Number(value).toLocaleString('th-TH', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  };