/**
 * String helper functions
 */

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} ellipsis - Ellipsis character(s)
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength = 100, ellipsis = '...') => {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength - ellipsis.length) + ellipsis;
  };
  
  /**
   * Convert a string to title case
   * @param {string} str - String to convert
   * @returns {string} Title case string
   */
  export const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    
    return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
  };
  
  /**
   * Generate a random string of specified length
   * @param {number} length - Length of the string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  export const generateRandomString = (length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };
  
  /**
   * Mask sensitive data like credit card numbers or phone numbers
   * @param {string} str - String to mask
   * @param {number} visibleStart - Number of characters visible at the start
   * @param {number} visibleEnd - Number of characters visible at the end
   * @param {string} maskChar - Character to use for masking
   * @returns {string} Masked string
   */
  export const maskString = (str, visibleStart = 4, visibleEnd = 4, maskChar = '*') => {
    if (!str || typeof str !== 'string') return '';
    
    const len = str.length;
    if (len <= visibleStart + visibleEnd) return str;
    
    const start = str.substring(0, visibleStart);
    const end = str.substring(len - visibleEnd);
    const masked = maskChar.repeat(len - visibleStart - visibleEnd);
    
    return start + masked + end;
  };
  
  /**
   * Format card number with spaces
   * @param {string} cardNumber - Card number to format
   * @returns {string} Formatted card number
   */
  export const formatCardNumber = (cardNumber) => {
    if (!cardNumber || typeof cardNumber !== 'string') return '';
    
    // Remove all non-digit characters
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Add a space every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };