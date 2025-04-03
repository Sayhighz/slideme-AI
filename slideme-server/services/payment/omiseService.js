/**
 * Omise payment service
 */
import Omise from 'omise';
import logger from '../../config/logger.js';
import env from '../../config/env.js';
import db from '../../config/db.js';
import { calculateApplicationFee, calculateDriverPayout } from '../../utils/constants/paymentTypes.js';

// Omise API keys from environment variables
const OMISE_PUBLIC_KEY = process.env.OMISE_PUBLIC_KEY;
const OMISE_SECRET_KEY = process.env.OMISE_SECRET_KEY;

// Initialize Omise client if keys are available
const omise = OMISE_PUBLIC_KEY && OMISE_SECRET_KEY
  ? Omise({
      publicKey: OMISE_PUBLIC_KEY,
      secretKey: OMISE_SECRET_KEY
    })
  : null;

/**
 * Create a payment token from card details
 * @param {Object} cardDetails - Card details object
 * @param {string} cardDetails.card_number - Card number
 * @param {string} cardDetails.card_name - Cardholder name
 * @param {string} cardDetails.card_expiry - Card expiry in MM/YY format
 * @param {string} cardDetails.card_cvv - Card CVV
 * @returns {Promise<Object>} Omise token object or null if creation fails
 */
export const createToken = async (cardDetails) => {
  try {
    if (!omise) {
      logger.warn('Omise not initialized, API keys missing');
      
      // Return mock token in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock token in development');
        return { id: 'mock_token_' + Date.now() };
      }
      
      return null;
    }
    
    // Validate card details
    if (!cardDetails || !cardDetails.card_number || !cardDetails.card_expiry || !cardDetails.card_cvv) {
      logger.warn('Incomplete card details for token creation');
      return null;
    }
    
    // Parse expiration date
    const [expiryMonth, expiryYear] = cardDetails.card_expiry.split('/');
    
    // Create token
    const token = await omise.tokens.create({
      card: {
        number: cardDetails.card_number.replace(/\s+/g, ''),
        name: cardDetails.card_name,
        expiration_month: parseInt(expiryMonth, 10),
        expiration_year: 2000 + parseInt(expiryYear, 10),
        security_code: cardDetails.card_cvv
      }
    });
    
    logger.info('Successfully created Omise token');
    
    return token;
  } catch (error) {
    logger.error('Error creating Omise token', { error: error.message });
    return null;
  }
};

/**
 * Create a charge for payment
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.token - Omise token ID
 * @param {number} paymentData.amount - Amount in THB (will be converted to satangs)
 * @param {string} paymentData.description - Payment description
 * @param {number} paymentData.customer_id - Customer ID
 * @param {number} paymentData.request_id - Request ID
 * @returns {Promise<Object>} Charge result or null if charging fails
 */
export const createCharge = async (paymentData) => {
  try {
    // Start a database transaction
    const connection = await db.beginTransaction();
    
    try {
      if (!omise) {
        logger.warn('Omise not initialized, API keys missing');
        
        // In development, create a mock payment record
        if (env.IS_DEVELOPMENT) {
          logger.info('Using mock charge in development');
          
          // Insert payment record
          const paymentResult = await db.transactionQuery(
            connection,
            `INSERT INTO payments (customer_id, amount, payment_status, payment_method_id, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
              paymentData.customer_id,
              paymentData.amount,
              'Completed',
              paymentData.payment_method_id
            ]
          );
          
          const paymentId = paymentResult.insertId;
          
          // Update request with payment ID
          if (paymentData.request_id) {
            await db.transactionQuery(
              connection,
              `UPDATE servicerequests SET payment_id = ? WHERE request_id = ?`,
              [paymentId, paymentData.request_id]
            );
          }
          
          await db.commitTransaction(connection);
          
          return {
            id: 'mock_charge_' + Date.now(),
            status: 'successful',
            amount: paymentData.amount,
            payment_id: paymentId
          };
        }
        
        await db.rollbackTransaction(connection);
        return null;
      }
      
      // Validate payment data
      if (!paymentData || !paymentData.token || !paymentData.amount) {
        logger.warn('Incomplete payment data for charge creation');
        await db.rollbackTransaction(connection);
        return null;
      }
      
      // Convert amount from THB to satangs (1 THB = 100 satangs)
      const amountInSatangs = Math.round(paymentData.amount * 100);
      
      // Create charge
      const charge = await omise.charges.create({
        amount: amountInSatangs,
        currency: 'thb',
        card: paymentData.token,
        description: paymentData.description || 'SlideMe service payment'
      });
      
      // Check if charge was successful
      if (charge.status !== 'successful') {
        logger.warn('Charge was not successful', { chargeId: charge.id, status: charge.status });
        await db.rollbackTransaction(connection);
        return null;
      }
      
      // Insert payment record
      const paymentResult = await db.transactionQuery(
        connection,
        `INSERT INTO payments (customer_id, amount, payment_status, payment_method_id, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          paymentData.customer_id,
          paymentData.amount,
          'Completed',
          paymentData.payment_method_id
        ]
      );
      
      const paymentId = paymentResult.insertId;
      
      // Update request with payment ID if provided
      if (paymentData.request_id) {
        await db.transactionQuery(
          connection,
          `UPDATE servicerequests SET payment_id = ? WHERE request_id = ?`,
          [paymentId, paymentData.request_id]
        );
      }
      
      // Commit transaction
      await db.commitTransaction(connection);
      
      logger.info('Successfully created Omise charge', { 
        chargeId: charge.id, 
        amount: paymentData.amount,
        paymentId
      });
      
      return {
        id: charge.id,
        status: charge.status,
        amount: paymentData.amount,
        payment_id: paymentId
      };
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error creating Omise charge', { error: error.message });
    return null;
  }
};

/**
 * Process payment for a service request
 * @param {number} requestId - Request ID
 * @param {number} customerId - Customer ID
 * @param {number} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Payment result or null if payment fails
 */
export const processRequestPayment = async (requestId, customerId, paymentMethodId) => {
  try {
    // Get request details including offered price
    const db = (await import('../../config/db.js')).default;
    const requests = await db.query(
      `SELECT r.request_id, r.customer_id, r.status, o.offered_price, o.driver_id
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE r.request_id = ? AND r.customer_id = ?`,
      [requestId, customerId]
    );
    
    if (requests.length === 0) {
      logger.warn('Request not found for payment processing', { requestId, customerId });
      return null;
    }
    
    const request = requests[0];
    
    // Check if request is in the right status
    if (request.status !== 'accepted') {
      logger.warn('Request is not in accepted status for payment', { 
        requestId, 
        status: request.status 
      });
      return null;
    }
    
    // Get payment method details
    const paymentMethods = await db.query(
      `SELECT method_name, card_number
       FROM paymentmethod
       WHERE payment_method_id = ? AND customer_id = ? AND is_active = 1`,
      [paymentMethodId, customerId]
    );
    
    if (paymentMethods.length === 0) {
      logger.warn('Payment method not found', { paymentMethodId, customerId });
      return null;
    }
    
    // Process payment
    const paymentResult = await createCharge({
      token: 'tok_test', // In a real implementation, token would come from frontend
      amount: request.offered_price,
      description: `Payment for SlideMe service #${requestId}`,
      customer_id: customerId,
      request_id: requestId,
      payment_method_id: paymentMethodId
    });
    
    if (!paymentResult) {
      logger.warn('Payment processing failed', { requestId });
      return null;
    }
    
    // Calculate driver payout amount
    const driverPayout = calculateDriverPayout(request.offered_price);
    
    // Update driver earnings (this would be done when the service is completed)
    // In a real implementation, this would be a separate process or transaction
    
    logger.info('Successfully processed payment for request', { 
      requestId, 
      paymentId: paymentResult.payment_id,
      amount: request.offered_price,
      driverPayout
    });
    
    return {
      payment_id: paymentResult.payment_id,
      amount: request.offered_price,
      status: 'Completed',
      driver_payout: driverPayout
    };
  } catch (error) {
    logger.error('Error processing request payment', { 
      requestId, 
      customerId,
      error: error.message 
    });
    
    return null;
  }
};

export default {
  createToken,
  createCharge,
  processRequestPayment
};