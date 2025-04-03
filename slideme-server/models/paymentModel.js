/**
 * Payment model for payment operations
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Get payment by ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Payment details or null if not found
 */
export const getPaymentById = async (paymentId) => {
  try {
    const payments = await db.query(
      `SELECT 
         p.payment_id,
         p.customer_id,
         p.amount,
         p.payment_status,
         p.payment_method_id,
         p.created_at,
         pm.method_name,
         pm.card_number,
         pm.cardholder_name
       FROM payments p
       LEFT JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
       WHERE p.payment_id = ?`,
      [paymentId]
    );
    
    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    logger.error('Error getting payment by ID', { paymentId, error: error.message });
    throw new DatabaseError('Failed to get payment details', error);
  }
};

/**
 * Get payment methods for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} List of payment methods
 */
export const getCustomerPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await db.query(
      `SELECT 
         payment_method_id,
         method_name,
         card_number,
         card_expiry,
         cardholder_name,
         is_active
       FROM paymentmethod
       WHERE customer_id = ? AND is_active = 1
       ORDER BY payment_method_id DESC`,
      [customerId]
    );
    
    // Mask card numbers for security
    return paymentMethods.map(method => ({
      ...method,
      card_number: maskCardNumber(method.card_number)
    }));
  } catch (error) {
    logger.error('Error getting customer payment methods', { customerId, error: error.message });
    throw new DatabaseError('Failed to get payment methods', error);
  }
};

/**
 * Mask card number for security
 * @param {string} cardNumber - Full card number
 * @returns {string} Masked card number
 */
const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  
  // Keep first 4 and last 4 digits, mask the rest
  const firstFour = cardNumber.substring(0, 4);
  const lastFour = cardNumber.substring(cardNumber.length - 4);
  const maskedLength = cardNumber.length - 8;
  const masked = '*'.repeat(maskedLength);
  
  return `${firstFour}${masked}${lastFour}`;
};

/**
 * Add payment method for customer
 * @param {Object} paymentMethodData - Payment method data
 * @returns {Promise<Object>} Created payment method with ID or null if creation failed
 */
export const addPaymentMethod = async (paymentMethodData) => {
  try {
    // Validate required fields
    if (!paymentMethodData.customer_id || 
        !paymentMethodData.card_number || 
        !paymentMethodData.card_expiry || 
        !paymentMethodData.card_cvv || 
        !paymentMethodData.cardholder_name) {
      logger.warn('Missing required fields for payment method');
      return null;
    }
    
    // Insert payment method
    const result = await db.query(
      `INSERT INTO paymentmethod (
         method_name,
         card_number,
         card_expiry,
         card_cvv,
         cardholder_name,
         is_active,
         customer_id
       ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        paymentMethodData.method_name || 'Mastercard',
        paymentMethodData.card_number,
        paymentMethodData.card_expiry,
        paymentMethodData.card_cvv,
        paymentMethodData.cardholder_name,
        paymentMethodData.customer_id
      ]
    );
    
    if (result.affectedRows > 0) {
      // Get the created payment method
      const paymentMethods = await db.query(
        `SELECT 
           payment_method_id,
           method_name,
           card_number,
           card_expiry,
           cardholder_name,
           is_active
         FROM paymentmethod
         WHERE payment_method_id = ?`,
        [result.insertId]
      );
      
      if (paymentMethods.length > 0) {
        // Mask card number for security
        return {
          ...paymentMethods[0],
          card_number: maskCardNumber(paymentMethods[0].card_number)
        };
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error adding payment method', { paymentMethodData, error: error.message });
    throw new DatabaseError('Failed to add payment method', error);
  }
};

/**
 * Delete payment method
 * @param {number} paymentMethodId - Payment method ID
 * @param {number} customerId - Customer ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export const deletePaymentMethod = async (paymentMethodId, customerId) => {
  try {
    // Soft delete by setting is_active to 0
    const result = await db.query(
      `UPDATE paymentmethod
       SET is_active = 0
       WHERE payment_method_id = ? AND customer_id = ?`,
      [paymentMethodId, customerId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error deleting payment method', { paymentMethodId, customerId, error: error.message });
    throw new DatabaseError('Failed to delete payment method', error);
  }
};

/**
 * Create a payment record
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created payment with ID or null if creation failed
 */
export const createPayment = async (paymentData) => {
  try {
    // Validate required fields
    if (!paymentData.customer_id || 
        !paymentData.amount || 
        !paymentData.payment_status) {
      logger.warn('Missing required fields for payment');
      return null;
    }
    
    // Insert payment
    const result = await db.query(
      `INSERT INTO payments (
         customer_id,
         amount,
         payment_status,
         payment_method_id,
         created_at
       ) VALUES (?, ?, ?, ?, NOW())`,
      [
        paymentData.customer_id,
        paymentData.amount,
        paymentData.payment_status,
        paymentData.payment_method_id || null
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the created payment
      return await getPaymentById(result.insertId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error creating payment', { paymentData, error: error.message });
    throw new DatabaseError('Failed to create payment', error);
  }
};

/**
 * Update payment status
 * @param {number} paymentId - Payment ID
 * @param {string} status - New status ('Pending', 'Completed', 'Failed')
 * @returns {Promise<Object>} Updated payment or null if update failed
 */
export const updatePaymentStatus = async (paymentId, status) => {
  try {
    // Validate status
    if (!['Pending', 'Completed', 'Failed'].includes(status)) {
      logger.warn('Invalid payment status', { status });
      return null;
    }
    
    // Update payment status
    const result = await db.query(
      `UPDATE payments SET payment_status = ? WHERE payment_id = ?`,
      [status, paymentId]
    );
    
    if (result.affectedRows > 0) {
      // Return the updated payment
      return await getPaymentById(paymentId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating payment status', { paymentId, status, error: error.message });
    throw new DatabaseError('Failed to update payment status', error);
  }
};

/**
 * Get payment history for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} List of payments
 */
export const getCustomerPaymentHistory = async (customerId) => {
  try {
    const payments = await db.query(
      `SELECT 
         p.payment_id,
         p.amount,
         p.payment_status,
         p.created_at,
         pm.method_name,
         pm.card_number,
         r.request_id,
         r.location_from,
         r.location_to
       FROM payments p
       LEFT JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
       LEFT JOIN servicerequests r ON r.payment_id = p.payment_id
       WHERE p.customer_id = ?
       ORDER BY p.created_at DESC`,
      [customerId]
    );
    
    // Mask card numbers for security
    return payments.map(payment => ({
      ...payment,
      card_number: payment.card_number ? maskCardNumber(payment.card_number) : null
    }));
  } catch (error) {
    logger.error('Error getting customer payment history', { customerId, error: error.message });
    throw new DatabaseError('Failed to get payment history', error);
  }
};

export default {
  getPaymentById,
  getCustomerPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  createPayment,
  updatePaymentStatus,
  getCustomerPaymentHistory
};