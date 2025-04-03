/**
 * Review model for customer reviews
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Get review by ID
 * @param {number} reviewId - Review ID
 * @returns {Promise<Object>} Review details or null if not found
 */
export const getReviewById = async (reviewId) => {
  try {
    const reviews = await db.query(
      `SELECT 
         r.review_id,
         r.request_id,
         r.customer_id,
         r.driver_id,
         r.rating,
         r.review_text,
         r.driver_comment,
         r.created_at,
         c.first_name AS customer_first_name,
         c.last_name AS customer_last_name,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name
       FROM reviews r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       LEFT JOIN drivers d ON r.driver_id = d.driver_id
       WHERE r.review_id = ?`,
      [reviewId]
    );
    
    return reviews.length > 0 ? reviews[0] : null;
  } catch (error) {
    logger.error('Error getting review by ID', { reviewId, error: error.message });
    throw new DatabaseError('Failed to get review details', error);
  }
};

/**
 * Get review by request ID
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} Review details or null if not found
 */
export const getReviewByRequestId = async (requestId) => {
  try {
    const reviews = await db.query(
      `SELECT 
         r.review_id,
         r.request_id,
         r.customer_id,
         r.driver_id,
         r.rating,
         r.review_text,
         r.driver_comment,
         r.created_at,
         c.first_name AS customer_first_name,
         c.last_name AS customer_last_name,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name
       FROM reviews r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       LEFT JOIN drivers d ON r.driver_id = d.driver_id
       WHERE r.request_id = ?`,
      [requestId]
    );
    
    return reviews.length > 0 ? reviews[0] : null;
  } catch (error) {
    logger.error('Error getting review by request ID', { requestId, error: error.message });
    throw new DatabaseError('Failed to get review details', error);
  }
};

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Created review with ID or null if creation failed
 */
export const createReview = async (reviewData) => {
  try {
    // Validate required fields
    if (!reviewData.request_id || 
        !reviewData.customer_id || 
        !reviewData.driver_id || 
        !reviewData.rating) {
      logger.warn('Missing required fields for review');
      return null;
    }
    
    // Check if review already exists for this request
    const existingReview = await getReviewByRequestId(reviewData.request_id);
    
    if (existingReview) {
      logger.warn('Review already exists for this request', { requestId: reviewData.request_id });
      return null;
    }
    
    // Validate request status (should be completed)
    const requests = await db.query(
      `SELECT status FROM servicerequests WHERE request_id = ?`,
      [reviewData.request_id]
    );
    
    if (requests.length === 0 || requests[0].status !== 'completed') {
      logger.warn('Cannot review a request that is not completed', { 
        requestId: reviewData.request_id,
        status: requests.length > 0 ? requests[0].status : 'not found'
      });
      return null;
    }
    
    // Insert the review
    const result = await db.query(
      `INSERT INTO reviews (
        request_id, customer_id, driver_id, rating, review_text, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        reviewData.request_id,
        reviewData.customer_id,
        reviewData.driver_id,
        reviewData.rating,
        reviewData.review_text || null
      ]
    );
    
    if (!result.insertId) {
      logger.warn('Failed to insert review');
      return null;
    }
    
    // Update driver's average rating
    await updateDriverAverageRating(reviewData.driver_id);
    
    // Return the created review
    const createdReview = await getReviewById(result.insertId);
    return createdReview;
  } catch (error) {
    logger.error('Error creating review', { error: error.message });
    throw new DatabaseError('Failed to create review', error);
  }
};

/**
 * Update an existing review
 * @param {number} reviewId - Review ID to update
 * @param {Object} reviewData - Updated review data
 * @returns {Promise<Object>} Updated review or null if update failed
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    // Check if review exists and belongs to the customer
    const existingReview = await getReviewById(reviewId);
    
    if (!existingReview) {
      logger.warn('Review not found for update', { reviewId });
      return null;
    }
    
    // Validate that the review belongs to the specified customer if customer_id is provided
    if (reviewData.customer_id && existingReview.customer_id !== reviewData.customer_id) {
      logger.warn('Customer does not own this review', { 
        reviewId, 
        customerId: reviewData.customer_id, 
        reviewCustomerId: existingReview.customer_id 
      });
      return null;
    }
    
    // Update the review
    const result = await db.query(
      `UPDATE reviews 
       SET rating = ?, review_text = ?
       WHERE review_id = ?`,
      [
        reviewData.rating || existingReview.rating,
        reviewData.review_text !== undefined ? reviewData.review_text : existingReview.review_text,
        reviewId
      ]
    );
    
    if (result.affectedRows === 0) {
      logger.warn('No rows affected during review update', { reviewId });
      return null;
    }
    
    // Update driver's average rating
    await updateDriverAverageRating(existingReview.driver_id);
    
    // Return the updated review
    return await getReviewById(reviewId);
  } catch (error) {
    logger.error('Error updating review', { reviewId, error: error.message });
    throw new DatabaseError('Failed to update review', error);
  }
};

/**
 * Add a driver comment to a review
 * @param {number} reviewId - Review ID
 * @param {number} driverId - Driver ID
 * @param {string} comment - Driver's comment
 * @returns {Promise<Object>} Updated review or null if update failed
 */
export const addDriverComment = async (reviewId, driverId, comment) => {
  try {
    // Check if review exists and belongs to the driver
    const existingReview = await getReviewById(reviewId);
    
    if (!existingReview) {
      logger.warn('Review not found for adding driver comment', { reviewId });
      return null;
    }
    
    // Validate that the review is for the specified driver
    if (existingReview.driver_id !== driverId) {
      logger.warn('Driver is not associated with this review', { 
        reviewId, 
        driverId, 
        reviewDriverId: existingReview.driver_id 
      });
      return null;
    }
    
    // Update the review with driver's comment
    const result = await db.query(
      `UPDATE reviews 
       SET driver_comment = ?
       WHERE review_id = ?`,
      [comment, reviewId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn('No rows affected during driver comment update', { reviewId });
      return null;
    }
    
    // Return the updated review
    return await getReviewById(reviewId);
  } catch (error) {
    logger.error('Error adding driver comment', { reviewId, driverId, error: error.message });
    throw new DatabaseError('Failed to add driver comment', error);
  }
};

/**
 * Update a driver's average rating
 * @param {number} driverId - Driver ID
 * @returns {Promise<number>} New average rating
 */
export const updateDriverAverageRating = async (driverId) => {
  try {
    // Calculate the average rating for the driver
    const result = await db.query(
      `SELECT AVG(rating) AS average_rating 
       FROM reviews 
       WHERE driver_id = ?`,
      [driverId]
    );
    
    if (result.length === 0 || result[0].average_rating === null) {
      logger.info('No reviews found for driver', { driverId });
      return 0;
    }
    
    const averageRating = parseFloat(result[0].average_rating);
    
    // Store the average rating somewhere if needed
    // This could be in a drivers table field or a separate driver stats table
    // For now, we're just returning the calculated average
    
    logger.info('Updated driver average rating', { driverId, averageRating });
    return averageRating;
  } catch (error) {
    logger.error('Error updating driver average rating', { driverId, error: error.message });
    throw new DatabaseError('Failed to update driver average rating', error);
  }
};

/**
 * Get reviews for a specific driver
 * @param {number} driverId - Driver ID
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<Array>} List of reviews
 */
export const getDriverReviews = async (driverId, options = {}) => {
  try {
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    
    const reviews = await db.query(
      `SELECT 
         r.review_id,
         r.request_id,
         r.customer_id,
         r.driver_id,
         r.rating,
         r.review_text,
         r.driver_comment,
         r.created_at,
         c.first_name AS customer_first_name,
         c.last_name AS customer_last_name
       FROM reviews r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       WHERE r.driver_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [driverId, limit, offset]
    );
    
    return reviews;
  } catch (error) {
    logger.error('Error getting driver reviews', { driverId, error: error.message });
    throw new DatabaseError('Failed to get driver reviews', error);
  }
};

/**
 * Get average rating for a driver
 * @param {number} driverId - Driver ID
 * @returns {Promise<number>} Average rating
 */
export const getDriverAverageRating = async (driverId) => {
  try {
    const result = await db.query(
      `SELECT AVG(rating) AS average_rating, COUNT(*) AS total_reviews
       FROM reviews
       WHERE driver_id = ?`,
      [driverId]
    );
    
    return {
      averageRating: result[0].average_rating ? parseFloat(parseFloat(result[0].average_rating).toFixed(1)) : 0,
      totalReviews: result[0].total_reviews || 0
    };
  } catch (error) {
    logger.error('Error getting driver average rating', { driverId, error: error.message });
    throw new DatabaseError('Failed to get driver average rating', error);
  }
};

/**
 * Get reviews submitted by a customer
 * @param {number} customerId - Customer ID
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<Array>} List of reviews
 */
export const getCustomerReviews = async (customerId, options = {}) => {
  try {
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    
    const reviews = await db.query(
      `SELECT 
         r.review_id,
         r.request_id,
         r.customer_id,
         r.driver_id,
         r.rating,
         r.review_text,
         r.driver_comment,
         r.created_at,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name
       FROM reviews r
       LEFT JOIN drivers d ON r.driver_id = d.driver_id
       WHERE r.customer_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );
    
    return reviews;
  } catch (error) {
    logger.error('Error getting customer reviews', { customerId, error: error.message });
    throw new DatabaseError('Failed to get customer reviews', error);
  }
};

/**
 * Delete a review
 * @param {number} reviewId - Review ID
 * @param {number} customerId - Customer ID (for verification)
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteReview = async (reviewId, customerId) => {
  try {
    // Check if review exists and belongs to the customer
    const existingReview = await getReviewById(reviewId);
    
    if (!existingReview) {
      logger.warn('Review not found for deletion', { reviewId });
      return false;
    }
    
    // Verify the review belongs to the customer
    if (existingReview.customer_id !== customerId) {
      logger.warn('Customer does not own this review', { 
        reviewId, 
        customerId, 
        reviewCustomerId: existingReview.customer_id 
      });
      return false;
    }
    
    // Delete the review
    const result = await db.query(
      `DELETE FROM reviews WHERE review_id = ?`,
      [reviewId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn('No rows affected during review deletion', { reviewId });
      return false;
    }
    
    // Update driver's average rating
    await updateDriverAverageRating(existingReview.driver_id);
    
    return true;
  } catch (error) {
    logger.error('Error deleting review', { reviewId, customerId, error: error.message });
    throw new DatabaseError('Failed to delete review', error);
  }
};

export default {
  getReviewById,
  getReviewByRequestId,
  createReview,
  updateReview,
  addDriverComment,
  updateDriverAverageRating,
  getDriverReviews,
  getDriverAverageRating,
  getCustomerReviews,
  deleteReview
};