/**
 * Driver model for driver operations
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';
import { hashPassword, comparePassword } from '../services/auth/passwordService.js';

/**
 * Get driver by ID
 * @param {number} driverId - Driver ID
 * @returns {Promise<Object>} Driver details or null if not found
 */
export const getDriverById = async (driverId) => {
  try {
    const drivers = await db.query(
      `SELECT 
         d.driver_id, 
         d.phone_number, 
         d.first_name, 
         d.last_name, 
         d.license_plate,
         d.id_expiry_date,
         d.province,
         d.vehicletype_id,
         v.vehicletype_name,
         d.created_date, 
         d.birth_date,
         d.approval_status,
         (
           SELECT AVG(rating)
           FROM reviews
           WHERE driver_id = d.driver_id
         ) AS average_rating
       FROM drivers d
       LEFT JOIN vehicle_types v ON d.vehicletype_id = v.vehicletype_id
       WHERE d.driver_id = ?`,
      [driverId]
    );
    
    return drivers.length > 0 ? drivers[0] : null;
  } catch (error) {
    logger.error('Error getting driver by ID', { driverId, error: error.message });
    throw new DatabaseError('Failed to get driver details', error);
  }
};

/**
 * Get driver by phone number
 * @param {string} phoneNumber - Driver phone number
 * @returns {Promise<Object>} Driver details or null if not found
 */
export const getDriverByPhone = async (phoneNumber) => {
  try {
    const drivers = await db.query(
      `SELECT 
         d.driver_id, 
         d.phone_number,  
         d.first_name, 
         d.last_name, 
         d.license_plate,
         d.id_expiry_date,
         d.province,
         d.vehicletype_id,
         v.vehicletype_name,
         d.created_date, 
         d.birth_date,
         d.approval_status,
         d.password
       FROM drivers d
       LEFT JOIN vehicle_types v ON d.vehicletype_id = v.vehicletype_id
       WHERE d.phone_number = ?`,
      [phoneNumber]
    );
    
    return drivers.length > 0 ? drivers[0] : null;
  } catch (error) {
    logger.error('Error getting driver by phone', { phoneNumber, error: error.message });
    throw new DatabaseError('Failed to get driver details', error);
  }
};

/**
 * Create a new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<Object>} Created driver with ID or null if creation failed
 */
export const createDriver = async (driverData) => {
  try {
    // Check if phone number already exists
    const existingDriver = await getDriverByPhone(driverData.phone_number);
    
    if (existingDriver) {
      logger.warn('Phone number already exists', { phoneNumber: driverData.phone_number });
      return null;
    }
    
    // Check if license plate already exists
    if (driverData.license_plate) {
      const licensePlateCheck = await db.query(
        'SELECT driver_id FROM drivers WHERE license_plate = ?',
        [driverData.license_plate]
      );
      
      if (licensePlateCheck.length > 0) {
        logger.warn('License plate already exists', { licensePlate: driverData.license_plate });
        return null;
      }
    }
    
    // Check if license number already exists
    if (driverData.license_number) {
      const licenseNumberCheck = await db.query(
        'SELECT driver_id FROM drivers WHERE license_number = ?',
        [driverData.license_number]
      );
      
      if (licenseNumberCheck.length > 0) {
        logger.warn('License number already exists', { licenseNumber: driverData.license_number });
        return null;
      }
    }
    
    // Hash password if provided
    let hashedPassword = driverData.password;
    if (driverData.password) {
      try {
        hashedPassword = await hashPassword(driverData.password);
      } catch (error) {
        logger.error('Error hashing password', { error: error.message });
        return null;
      }
    }
    
    // Insert driver
    const result = await db.query(
      `INSERT INTO drivers (
         phone_number, 
         first_name, 
         last_name,
         license_plate,
         id_expiry_date,
         province,
         vehicletype_id,
         password,
         created_date, 
         birth_date,
         approval_status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        driverData.phone_number,
        driverData.first_name || null,
        driverData.last_name || null,
        driverData.license_plate || null,
        driverData.id_expiry_date || null,
        driverData.province || 'Unknown',
        driverData.vehicletype_id || 99, // Default vehicle type
        hashedPassword,
        driverData.birth_date || null,
        driverData.approval_status || 'pending'
      ]
    );
    
    if (result.affectedRows > 0) {
      // Initialize driver details record
      await db.query(
        `INSERT INTO driverdetails (driver_id) VALUES (?)`,
        [result.insertId]
      );
      
      // Return the created driver
      return await getDriverById(result.insertId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error creating driver', { driverData, error: error.message });
    throw new DatabaseError('Failed to create driver', error);
  }
};

/**
 * Update driver profile
 * @param {number} driverId - Driver ID
 * @param {Object} driverData - Updated driver data
 * @returns {Promise<Object>} Updated driver or null if update failed
 */
export const updateDriver = async (driverId, driverData) => {
  try {
    // Get existing driver
    const existingDriver = await getDriverById(driverId);
    
    if (!existingDriver) {
      logger.warn('Driver not found for update', { driverId });
      return null;
    }
    
    // Update driver
    const result = await db.query(
      `UPDATE drivers
       SET 
         username = ?,
         first_name = ?,
         last_name = ?,
         id_expiry_date = ?,
         province = ?,
         vehicletype_id = ?,
         birth_date = ?
       WHERE driver_id = ?`,
      [
        driverData.first_name || existingDriver.first_name,
        driverData.last_name || existingDriver.last_name,
        driverData.id_expiry_date || existingDriver.id_expiry_date,
        driverData.province || existingDriver.province,
        driverData.vehicletype_id || existingDriver.vehicletype_id,
        driverData.birth_date || existingDriver.birth_date,
        driverId
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the updated driver
      return await getDriverById(driverId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating driver', { driverId, error: error.message });
    throw new DatabaseError('Failed to update driver', error);
  }
};

/**
 * Update driver location
 * @param {number} driverId - Driver ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {Promise<boolean>} Success status
 */
export const updateDriverLocation = async (driverId, latitude, longitude) => {
  try {
    // Check if driver exists
    const existingDriver = await getDriverById(driverId);
    
    if (!existingDriver) {
      logger.warn('Driver not found for location update', { driverId });
      return false;
    }
    
    // Update driver location
    const result = await db.query(
      `UPDATE driverdetails
       SET 
         current_latitude = ?,
         current_longitude = ?,
         updated_at = NOW()
       WHERE driver_id = ?`,
      [latitude, longitude, driverId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error updating driver location', { 
      driverId, 
      latitude, 
      longitude, 
      error: error.message 
    });
    
    throw new DatabaseError('Failed to update driver location', error);
  }
};

/**
 * Get driver service history
 * @param {number} driverId - Driver ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} List of services
 */
export const getDriverServiceHistory = async (driverId, status = null) => {
  try {
    let query = `
      SELECT 
        r.request_id,
        r.location_from,
        r.location_to,
        r.status,
        r.request_time,
        r.booking_time,
        o.offered_price,
        c.customer_id,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.phone_number AS customer_phone,
        v.vehicletype_name,
        (
          SELECT rating 
          FROM reviews 
          WHERE request_id = r.request_id AND driver_id = o.driver_id
        ) AS rating
      FROM servicerequests r
      JOIN driveroffers o ON r.offer_id = o.offer_id
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      WHERE o.driver_id = ?
    `;
    
    const params = [driverId];
    
    // Add status filter if provided
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    
    // Order by most recent first
    query += ` ORDER BY r.request_time DESC`;
    
    const services = await db.query(query, params);
    
    return services;
  } catch (error) {
    logger.error('Error getting driver service history', { 
      driverId, 
      status, 
      error: error.message 
    });
    
    throw new DatabaseError('Failed to get service history', error);
  }
};

export default {
  getDriverById,
  getDriverByPhone,
  createDriver,
  updateDriver,
  updateDriverLocation,
  getDriverServiceHistory
};