/**
 * Payment validation utilities
 */

/**
 * Validate credit card number using Luhn algorithm
 * @param {string} cardNumber - Credit card number to validate
 * @returns {boolean} True if the card number is valid
 */
export const validateCardNumber = (cardNumber) => {
    if (!cardNumber) return false;
    
    // Remove spaces and dashes
    const digits = cardNumber.replace(/[\s-]/g, '');
    
    // Check if the number contains only digits
    if (!/^\d+$/.test(digits)) return false;
    
    // Check length (most cards are between 13-19 digits)
    if (digits.length < 13 || digits.length > 19) return false;
    
    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through digits in reverse
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };
  
  /**
   * Validate card expiry date
   * @param {string} expiryDate - Expiry date in MM/YY format
   * @returns {boolean} True if the expiry date is valid and not expired
   */
  export const validateExpiryDate = (expiryDate) => {
    if (!expiryDate) return false;
    
    // Check format
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    
    // Convert to numbers
    const expMonth = parseInt(month, 10);
    const expYear = parseInt('20' + year, 10);
    
    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth is 0-indexed
    const currentYear = now.getFullYear();
    
    // Check if expired
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  };
  
  /**
   * Validate CVV code
   * @param {string} cvv - CVV code
   * @returns {boolean} True if the CVV is valid
   */
  export const validateCVV = (cvv) => {
    if (!cvv) return false;
    
    // CVV should be 3 or 4 digits
    return /^[0-9]{3,4}$/.test(cvv);
  };
  
  /**
   * Validate payment method data
   * @param {Object} paymentData - Payment method data
   * @returns {Object} Validation result with isValid flag and errors array
   */
  export const validatePaymentMethod = (paymentData) => {
    const errors = [];
    
    if (!paymentData) {
      return { isValid: false, errors: ['Payment data is required'] };
    }
    
    // Validate required fields
    if (!paymentData.method_name) {
      errors.push('Payment method name is required');
    }
    
    if (!paymentData.card_number) {
      errors.push('Card number is required');
    } else if (!validateCardNumber(paymentData.card_number)) {
      errors.push('Card number is invalid');
    }
    
    if (!paymentData.card_expiry) {
      errors.push('Card expiry date is required');
    } else if (!validateExpiryDate(paymentData.card_expiry)) {
      errors.push('Card expiry date is invalid or expired');
    }
    
    if (!paymentData.card_cvv) {
      errors.push('CVV is required');
    } else if (!validateCVV(paymentData.card_cvv)) {
      errors.push('CVV is invalid');
    }
    
    if (!paymentData.cardholder_name) {
      errors.push('Cardholder name is required');
    }
    
    if (!paymentData.customer_id) {
      errors.push('Customer ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };