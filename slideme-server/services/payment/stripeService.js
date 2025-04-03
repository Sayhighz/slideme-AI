/**
 * Stripe payment service
 */
import Stripe from 'stripe';
import logger from '../../config/logger.js';
import env from '../../config/env.js';
import db from '../../config/db.js';
import { calculateApplicationFee, calculateDriverPayout } from '../../utils/constants/paymentTypes.js';

// Stripe API key from environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe client if key is available
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

/**
 * Create a payment intent
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Amount in THB
 * @param {string} paymentData.currency - Currency code (default: 'thb')
 * @param {string} paymentData.description - Payment description
 * @param {number} paymentData.customer_id - Customer ID
 * @returns {Promise<Object>} Payment intent object or null if creation fails
 */
export const createPaymentIntent = async (paymentData) => {
  try {
    if (!stripe) {
      logger.warn('Stripe not initialized, API key missing');
      
      // Return mock payment intent in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock payment intent in development');
        return {
          id: 'mock_pi_' + Date.now(),
          client_secret: 'mock_secret_' + Date.now(),
          amount: paymentData.amount,
          currency: paymentData.currency || 'thb'
        };
      }
      
      return null;
    }
    
    // Validate payment data
    if (!paymentData || !paymentData.amount) {
      logger.warn('Incomplete payment data for payment intent creation');
      return null;
    }
    
    // Convert amount to smallest currency unit (for THB, it's satangs)
    const amountInSmallestUnit = Math.round(paymentData.amount * 100);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: paymentData.currency || 'thb',
      description: paymentData.description || 'SlideMe service payment',
      metadata: {
        customer_id: paymentData.customer_id.toString()
      }
    });
    
    logger.info('Successfully created Stripe payment intent', { 
      paymentIntentId: paymentIntent.id,
      amount: paymentData.amount
    });
    
    return {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentData.amount,
      currency: paymentData.currency || 'thb'
    };
  } catch (error) {
    logger.error('Error creating Stripe payment intent', { error: error.message });
    return null;
  }
};

/**
 * Confirm payment intent status
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent status or null if retrieval fails
 */
export const confirmPaymentStatus = async (paymentIntentId) => {
  try {
    if (!stripe) {
      logger.warn('Stripe not initialized, API key missing');
      
      // Return mock status in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock payment status in development');
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 100,
          currency: 'thb'
        };
      }
      
      return null;
    }
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    logger.info('Retrieved Stripe payment intent status', { 
      paymentIntentId,
      status: paymentIntent.status
    });
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from smallest unit back to THB
      currency: paymentIntent.currency
    };
  } catch (error) {
    logger.error('Error confirming Stripe payment status', { 
      paymentIntentId, 
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Process payment for a service request using Stripe
 * @param {number} requestId - Request ID
 * @param {number} customerId - Customer ID
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment result or null if payment fails
 */
export const processRequestPayment = async (requestId, customerId, paymentIntentId) => {
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
    
    // Verify payment intent status
    const paymentStatus = await confirmPaymentStatus(paymentIntentId);
    
    if (!paymentStatus || paymentStatus.status !== 'succeeded') {
      logger.warn('Payment not successful', { 
        paymentIntentId, 
        status: paymentStatus?.status 
      });
      return null;
    }
    
    // Start a database transaction
    const connection = await db.beginTransaction();
    
    try {
      // Insert payment record
      const paymentResult = await db.transactionQuery(
        connection,
        `INSERT INTO payments (customer_id, amount, payment_status, payment_method_id, created_at)
         VALUES (?, ?, ?, NULL, NOW())`,
        [
          customerId,
          request.offered_price,
          'Completed'
        ]
      );
      
      const paymentId = paymentResult.insertId;
      
      // Update request with payment ID
      await db.transactionQuery(
        connection,
        `UPDATE servicerequests SET payment_id = ? WHERE request_id = ?`,
        [paymentId, requestId]
      );
      
      // Calculate driver payout amount
      const driverPayout = calculateDriverPayout(request.offered_price);
      
      // Commit transaction
      await db.commitTransaction(connection);
      
      logger.info('Successfully processed Stripe payment for request', { 
        requestId, 
        paymentId,
        amount: request.offered_price,
        driverPayout
      });
      
      return {
        payment_id: paymentId,
        amount: request.offered_price,
        status: 'Completed',
        driver_payout: driverPayout
      };
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error processing request payment with Stripe', { 
      requestId, 
      customerId,
      paymentIntentId,
      error: error.message 
    });
    
    return null;
  }
};

export default {
  createPaymentIntent,
  confirmPaymentStatus,
  processRequestPayment
};