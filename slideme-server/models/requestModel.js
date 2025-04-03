/**
 * Request model for service requests
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Get request by ID
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} Request details or null if not found
 */
export const getRequestById = async (requestId) => {
  try {
    const requests = await db.query(
      `SELECT 
         r.request_id,
         r.customer_id,
         r.pickup_lat,
         r.pickup_long,
         r.location_from,
         r.dropoff_lat,
         r.dropoff_long,
         r.location_to,
         r.status,
         r.booking_time,
         r.request_time,
         r.offer_id,
         r.payment_id,
         r.customer_message,
         r.vehicletype_id,
         v.vehicletype_name,
         c.first_name AS customer_first_name,
         c.last_name AS customer_last_name,
         c.phone_number AS customer_phone,
         o.driver_id,
         o.offered_price,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name,
         d.phone_number AS driver_phone,
         d.license_plate
       FROM servicerequests r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
       LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
       LEFT JOIN drivers d ON o.driver_id = d.driver_id
       WHERE r.request_id = ?`,
      [requestId]
    );
    
    return requests.length > 0 ? requests[0] : null;
  } catch (error) {
    logger.error('Error getting request by ID', { requestId, error: error.message });
    throw new DatabaseError('Failed to get request details', error);
  }
};

/**
 * Create a new service request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request with ID or null if creation failed
 */
export const createRequest = async (requestData) => {
  try {
    // Validate required fields
    if (!requestData.customer_id || 
        !requestData.pickup_lat || 
        !requestData.pickup_long || 
        !requestData.location_from || 
        !requestData.dropoff_lat || 
        !requestData.dropoff_long || 
        !requestData.location_to || 
        !requestData.vehicletype_id) {
      logger.warn('Missing required fields for service request');
      return null;
    }
    
    // Insert request
    const result = await db.query(
      `INSERT INTO servicerequests (
         customer_id,
         pickup_lat,
         pickup_long,
         location_from,
         dropoff_lat,
         dropoff_long,
         location_to,
         status,
         booking_time,
         request_time,
         customer_message,
         vehicletype_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?, ?)`,
      [
        requestData.customer_id,
        requestData.pickup_lat,
        requestData.pickup_long,
        requestData.location_from,
        requestData.dropoff_lat,
        requestData.dropoff_long,
        requestData.location_to,
        requestData.booking_time || null,
        requestData.customer_message || null,
        requestData.vehicletype_id
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the created request
      return await getRequestById(result.insertId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error creating service request', { requestData, error: error.message });
    throw new DatabaseError('Failed to create service request', error);
  }
};

/**
 * Update request status
 * @param {number} requestId - Request ID
 * @param {string} status - New status ('pending', 'accepted', 'completed', 'cancelled')
 * @returns {Promise<Object>} Updated request or null if update failed
 */
export const updateRequestStatus = async (requestId, status) => {
  try {
    // Validate status
    if (!['pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
      logger.warn('Invalid request status', { status });
      return null;
    }
    
    // Get existing request
    const existingRequest = await getRequestById(requestId);
    
    if (!existingRequest) {
      logger.warn('Request not found for status update', { requestId });
      return null;
    }
    
    // Check valid status transitions
    const validTransitions = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[existingRequest.status].includes(status)) {
      logger.warn('Invalid status transition', { 
        currentStatus: existingRequest.status, 
        newStatus: status 
      });
      return null;
    }
    
    // Update request status
    const result = await db.query(
      `UPDATE servicerequests SET status = ? WHERE request_id = ?`,
      [status, requestId]
    );
    
    if (result.affectedRows > 0) {
      // Return the updated request
      return await getRequestById(requestId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating request status', { requestId, status, error: error.message });
    throw new DatabaseError('Failed to update request status', error);
  }
};

/**
 * Get pending requests for drivers
 * @param {number} driverId - Driver ID (to filter out requests with existing offers)
 * @param {Object} filters - Optional filters
 * @param {number} filters.vehicleTypeId - Filter by vehicle type
 * @param {number} filters.maxDistance - Maximum distance in kilometers
 * @returns {Promise<Array>} List of pending requests
 */
export const getPendingRequestsForDrivers = async (driverId, filters = {}) => {
  try {
    // Base query to get pending requests
    let query = `
      SELECT 
        r.request_id,
        r.pickup_lat,
        r.pickup_long,
        r.location_from,
        r.dropoff_lat,
        r.dropoff_long,
        r.location_to,
        r.status,
        r.booking_time,
        r.request_time,
        r.customer_message,
        r.vehicletype_id,
        v.vehicletype_name,
        (
          SELECT COUNT(*)
          FROM driveroffers
          WHERE request_id = r.request_id
        ) AS offer_count
      FROM servicerequests r
      JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      WHERE r.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM driveroffers
        WHERE request_id = r.request_id AND driver_id = ?
      )
    `;
    
    const params = [driverId];
    
    // Add vehicle type filter if specified
    if (filters.vehicleTypeId) {
      query += ` AND r.vehicletype_id = ?`;
      params.push(filters.vehicleTypeId);
    }
    
    // Filter by distance if specified
    if (filters.maxDistance && filters.driverLat && filters.driverLng) {
      query += `
        AND (
          6371 * acos(
            cos(radians(?)) * 
            cos(radians(r.pickup_lat)) * 
            cos(radians(r.pickup_long) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(r.pickup_lat))
          )
        ) <= ?
      `;
      params.push(filters.driverLat, filters.driverLng, filters.driverLat, filters.maxDistance);
    }
    
    // Order by most recent first
    query += ` ORDER BY r.request_time DESC`;
    
    const requests = await db.query(query, params);
    
    return requests;
  } catch (error) {
    logger.error('Error getting pending requests for drivers', { 
      driverId, 
      filters, 
      error: error.message 
    });
    
    throw new DatabaseError('Failed to get pending requests', error);
  }
};

/**
 * Get active request for a driver
 * @param {number} driverId - Driver ID
 * @returns {Promise<Object>} Active request or null if none found
 */
export const getDriverActiveRequest = async (driverId) => {
  try {
    const requests = await db.query(
      `SELECT 
         r.request_id,
         r.customer_id,
         r.pickup_lat,
         r.pickup_long,
         r.location_from,
         r.dropoff_lat,
         r.dropoff_long,
         r.location_to,
         r.status,
         r.booking_time,
         r.request_time,
         r.customer_message,
         r.vehicletype_id,
         v.vehicletype_name,
         c.first_name AS customer_first_name,
         c.last_name AS customer_last_name,
         c.phone_number AS customer_phone,
         o.offered_price
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       JOIN customers c ON r.customer_id = c.customer_id
       JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
       WHERE o.driver_id = ? AND r.status = 'accepted'
       ORDER BY r.request_time DESC
       LIMIT 1`,
      [driverId]
    );
    
    return requests.length > 0 ? requests[0] : null;
  } catch (error) {
    logger.error('Error getting driver active request', { driverId, error: error.message });
    throw new DatabaseError('Failed to get active request', error);
  }
};

/**
 * Get active request for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Object>} Active request or null if none found
 */
export const getCustomerActiveRequest = async (customerId) => {
  try {
    const requests = await db.query(
      `SELECT 
         r.request_id,
         r.customer_id,
         r.pickup_lat,
         r.pickup_long,
         r.location_from,
         r.dropoff_lat,
         r.dropoff_long,
         r.location_to,
         r.status,
         r.booking_time,
         r.request_time,
         r.customer_message,
         r.vehicletype_id,
         v.vehicletype_name,
         o.driver_id,
         o.offered_price,
         d.first_name AS driver_first_name,
         d.last_name AS driver_last_name,
         d.phone_number AS driver_phone,
         d.license_plate,
         dd.current_latitude AS driver_current_lat,
         dd.current_longitude AS driver_current_lng,
         dd.updated_at AS driver_location_updated
       FROM servicerequests r
       LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
       LEFT JOIN drivers d ON o.driver_id = d.driver_id
       LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
       JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
       WHERE r.customer_id = ? AND r.status IN ('pending', 'accepted')
       ORDER BY FIELD(r.status, 'accepted', 'pending'), r.request_time DESC
       LIMIT 1`,
      [customerId]
    );
    
    return requests.length > 0 ? requests[0] : null;
  } catch (error) {
    logger.error('Error getting customer active request', { customerId, error: error.message });
    throw new DatabaseError('Failed to get active request', error);
  }
};

export default {
  getRequestById,
  createRequest,
  updateRequestStatus,
  getPendingRequestsForDrivers,
  getDriverActiveRequest,
  getCustomerActiveRequest
};