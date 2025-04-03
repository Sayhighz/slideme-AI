/**
 * Offer model for driver offers
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Get offer by ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<Object>} Offer details or null if not found
 */
export const getOfferById = async (offerId) => {
  try {
    const offers = await db.query(
      `SELECT 
         o.offer_id,
         o.request_id,
         o.driver_id,
         o.offered_price,
         o.offer_status,
         o.created_at,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name,
         d.phone_number AS driver_phone,
         d.license_plate,
         r.location_from,
         r.location_to,
         v.vehicletype_name
       FROM driveroffers o
       JOIN drivers d ON o.driver_id = d.driver_id
       JOIN servicerequests r ON o.request_id = r.request_id
       JOIN vehicle_types v ON d.vehicletype_id = v.vehicletype_id
       WHERE o.offer_id = ?`,
      [offerId]
    );
    
    return offers.length > 0 ? offers[0] : null;
  } catch (error) {
    logger.error('Error getting offer by ID', { offerId, error: error.message });
    throw new DatabaseError('Failed to get offer details', error);
  }
};

/**
 * Get offers for a specific request
 * @param {number} requestId - Request ID
 * @returns {Promise<Array>} List of offers
 */
export const getOffersByRequestId = async (requestId) => {
  try {
    const offers = await db.query(
      `SELECT 
         o.offer_id,
         o.request_id,
         o.driver_id,
         o.offered_price,
         o.offer_status,
         o.created_at,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name,
         d.phone_number AS driver_phone,
         d.license_plate,
         (
           SELECT AVG(rating)
           FROM reviews
           WHERE driver_id = d.driver_id
         ) AS driver_rating
       FROM driveroffers o
       JOIN drivers d ON o.driver_id = d.driver_id
       WHERE o.request_id = ?
       ORDER BY o.offered_price ASC`,
      [requestId]
    );
    
    return offers;
  } catch (error) {
    logger.error('Error getting offers by request ID', { requestId, error: error.message });
    throw new DatabaseError('Failed to get request offers', error);
  }
};

/**
 * Get driver's active offers
 * @param {number} driverId - Driver ID
 * @returns {Promise<Array>} List of active offers
 */
export const getDriverActiveOffers = async (driverId) => {
  try {
    const offers = await db.query(
      `SELECT 
         o.offer_id,
         o.request_id,
         o.driver_id,
         o.offered_price,
         o.offer_status,
         o.created_at,
         r.location_from,
         r.location_to,
         r.status AS request_status,
         v.vehicletype_name
       FROM driveroffers o
       JOIN servicerequests r ON o.request_id = r.request_id
       JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
       WHERE o.driver_id = ? AND o.offer_status != 'rejected'
       AND r.status IN ('pending', 'accepted')
       ORDER BY o.created_at DESC`,
      [driverId]
    );
    
    return offers;
  } catch (error) {
    logger.error('Error getting driver active offers', { driverId, error: error.message });
    throw new DatabaseError('Failed to get driver offers', error);
  }
};

/**
 * Create a new offer
 * @param {Object} offerData - Offer data
 * @returns {Promise<Object>} Created offer with ID or null if creation failed
 */
export const createOffer = async (offerData) => {
  try {
    // Check if driver already has an offer for this request
    const existingOffers = await db.query(
      `SELECT offer_id FROM driveroffers
       WHERE request_id = ? AND driver_id = ?`,
      [offerData.request_id, offerData.driver_id]
    );
    
    if (existingOffers.length > 0) {
      logger.warn('Driver already has an offer for this request', { 
        requestId: offerData.request_id, 
        driverId: offerData.driver_id 
      });
      return null;
    }
    
    // Create offer
    const result = await db.query(
      `INSERT INTO driveroffers (
         request_id,
         driver_id,
         offered_price,
         offer_status,
         created_at
       ) VALUES (?, ?, ?, 'pending', NOW())`,
      [
        offerData.request_id,
        offerData.driver_id,
        offerData.offered_price
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the created offer
      return await getOfferById(result.insertId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error creating offer', { offerData, error: error.message });
    throw new DatabaseError('Failed to create offer', error);
  }
};

/**
 * Update offer status
 * @param {number} offerId - Offer ID
 * @param {string} status - New status ('pending', 'accepted', 'rejected')
 * @returns {Promise<Object>} Updated offer or null if update failed
 */
export const updateOfferStatus = async (offerId, status) => {
  try {
    // Validate status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      logger.warn('Invalid offer status', { status });
      return null;
    }
    
    // Get existing offer
    const existingOffer = await getOfferById(offerId);
    
    if (!existingOffer) {
      logger.warn('Offer not found for status update', { offerId });
      return null;
    }
    
    // If trying to accept an offer, check if another offer is already accepted
    if (status === 'accepted') {
      const acceptedOffers = await db.query(
        `SELECT o.offer_id
         FROM driveroffers o
         WHERE o.request_id = ? AND o.offer_status = 'accepted'`,
        [existingOffer.request_id]
      );
      
      if (acceptedOffers.length > 0) {
        logger.warn('Another offer is already accepted for this request', { 
          requestId: existingOffer.request_id,
          acceptedOfferId: acceptedOffers[0].offer_id
        });
        return null;
      }
    }
    
    // Start a transaction
    const connection = await db.beginTransaction();
    
    try {
      // Update offer status
      await db.transactionQuery(
        connection,
        `UPDATE driveroffers SET offer_status = ? WHERE offer_id = ?`,
        [status, offerId]
      );
      
      // If accepting offer, update request status and set offer_id
      if (status === 'accepted') {
        await db.transactionQuery(
          connection,
          `UPDATE servicerequests SET status = 'accepted', offer_id = ? WHERE request_id = ?`,
          [offerId, existingOffer.request_id]
        );
        
        // Reject all other offers for this request
        await db.transactionQuery(
          connection,
          `UPDATE driveroffers 
           SET offer_status = 'rejected' 
           WHERE request_id = ? AND offer_id != ?`,
          [existingOffer.request_id, offerId]
        );
      }
      
      // Commit transaction
      await db.commitTransaction(connection);
      
      // Return updated offer
      return await getOfferById(offerId);
    } catch (error) {
      // Rollback on error
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error updating offer status', { offerId, status, error: error.message });
    throw new DatabaseError('Failed to update offer status', error);
  }
};

/**
 * Cancel an offer
 * @param {number} offerId - Offer ID
 * @param {number} driverId - Driver ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export const cancelOffer = async (offerId, driverId) => {
  try {
    // Check if offer exists and belongs to driver
    const existingOffer = await db.query(
      `SELECT offer_id, offer_status 
       FROM driveroffers 
       WHERE offer_id = ? AND driver_id = ?`,
      [offerId, driverId]
    );
    
    if (existingOffer.length === 0) {
      logger.warn('Offer not found or does not belong to driver', { offerId, driverId });
      return false;
    }
    
    // Check if offer can be cancelled (only pending offers can be cancelled)
    if (existingOffer[0].offer_status !== 'pending') {
      logger.warn('Cannot cancel non-pending offer', { 
        offerId, 
        status: existingOffer[0].offer_status 
      });
      return false;
    }
    
    // Update offer status to rejected
    const result = await db.query(
      `UPDATE driveroffers SET offer_status = 'rejected' WHERE offer_id = ?`,
      [offerId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error cancelling offer', { offerId, driverId, error: error.message });
    throw new DatabaseError('Failed to cancel offer', error);
  }
};

export default {
  getOfferById,
  getOffersByRequestId,
  getDriverActiveOffers,
  createOffer,
  updateOfferStatus,
  cancelOffer
};