/**
 * Payment types and related constants
 */

/**
 * Payment method types
 */
export const PAYMENT_METHOD_TYPES = {
    MASTERCARD: 'Mastercard',
    // Add more payment method types as needed
  };
  
  /**
   * Default transaction fee percentage
   */
  export const DEFAULT_TRANSACTION_FEE_PERCENT = 2.5;
  
  /**
   * Service fee percentage
   */
  export const SERVICE_FEE_PERCENT = 10;
  
  /**
   * Calculate the application fee amount
   * @param {number} amount - Transaction amount
   * @returns {number} Application fee amount
   */
  export const calculateApplicationFee = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    
    const transactionFee = (amount * DEFAULT_TRANSACTION_FEE_PERCENT) / 100;
    const serviceFee = (amount * SERVICE_FEE_PERCENT) / 100;
    
    return parseFloat((transactionFee + serviceFee).toFixed(2));
  };
  
  /**
   * Calculate driver payout amount
   * @param {number} amount - Transaction amount
   * @returns {number} Driver payout amount
   */
  export const calculateDriverPayout = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    
    const applicationFee = calculateApplicationFee(amount);
    
    return parseFloat((amount - applicationFee).toFixed(2));
  };