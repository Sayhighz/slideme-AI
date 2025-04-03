/**
 * Customer model for user operations
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';
import { hashPassword, comparePassword } from '../services/auth/passwordService.js';

/**
 * Get customer by ID
 * @param {number} customerId - Customer ID
 * @returns {Promise<Object>} Customer details or null if not found
 */
export const getCustomerById = async (customerId) => {
  try {
    const customers = await db.query(
      `SELECT 
         customer_id, 
         phone_number, 
         email, 
         username,
         first_name, 
         last_name, 
         created_at, 
         birth_date
       FROM customers
       WHERE customer_id = ?`,
      [customerId]
    );
    
    return customers.length > 0 ? customers[0] : null;
  } catch (error) {
    logger.error('Error getting customer by ID', { customerId, error: error.message });
    throw new DatabaseError('Failed to get customer details', error);
  }
};

/**
 * Get customer by phone number
 * @param {string} phoneNumber - Customer phone number
 * @returns {Promise<Object>} Customer details or null if not found
 */
export const getCustomerByPhone = async (phoneNumber) => {
  try {
    const customers = await db.query(
      `SELECT 
         customer_id, 
         phone_number, 
         email, 
         username,
         first_name, 
         last_name, 
         created_at, 
         birth_date
       FROM customers
       WHERE phone_number = ?`,
      [phoneNumber]
    );
    
    return customers.length > 0 ? customers[0] : null;
  } catch (error) {
    logger.error('Error getting customer by phone', { phoneNumber, error: error.message });
    throw new DatabaseError('Failed to get customer details', error);
  }
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Created customer with ID or null if creation failed
 */
export const createCustomer = async (customerData) => {
  try {
    // Check if phone number already exists
    const existingCustomer = await getCustomerByPhone(customerData.phone_number);
    
    if (existingCustomer) {
      logger.warn('Phone number already exists', { phoneNumber: customerData.phone_number });
      return null;
    }
    
    // Insert customer
    const result = await db.query(
      `INSERT INTO customers (
         phone_number, 
         email, 
         username,
         first_name, 
         last_name, 
         created_at, 
         birth_date
       ) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [
        customerData.phone_number,
        customerData.email || null,
        customerData.username || null,
        customerData.first_name || null,
        customerData.last_name || null,
        customerData.birth_date || null
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the created customer
      return await getCustomerById(result.insertId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error creating customer', { customerData, error: error.message });
    throw new DatabaseError('Failed to create customer', error);
  }
};

/**
 * Update customer profile
 * @param {number} customerId - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise<Object>} Updated customer or null if update failed
 */
export const updateCustomer = async (customerId, customerData) => {
  try {
    // Get existing customer
    const existingCustomer = await getCustomerById(customerId);
    
    if (!existingCustomer) {
      logger.warn('Customer not found for update', { customerId });
      return null;
    }
    
    // Update customer
    const result = await db.query(
      `UPDATE customers
       SET 
         email = ?,
         username = ?,
         first_name = ?,
         last_name = ?,
         birth_date = ?
       WHERE customer_id = ?`,
      [
        customerData.email || existingCustomer.email,
        customerData.username || existingCustomer.username,
        customerData.first_name || existingCustomer.first_name,
        customerData.last_name || existingCustomer.last_name,
        customerData.birth_date || existingCustomer.birth_date,
        customerId
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the updated customer
      return await getCustomerById(customerId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating customer', { customerId, error: error.message });
    throw new DatabaseError('Failed to update customer', error);
  }
};

/**
 * Get customer request history
 * @param {number} customerId - Customer ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} List of requests
 */
export const getCustomerRequestHistory = async (customerId, status = null) => {
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
        d.driver_id,
        d.first_name AS driver_first_name,
        d.last_name AS driver_last_name,
        d.phone_number AS driver_phone,
        v.vehicletype_name
      FROM servicerequests r
      LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
      LEFT JOIN drivers d ON o.driver_id = d.driver_id
      LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      WHERE r.customer_id = ?
    `;
    
    const params = [customerId];
    
    // Add status filter if provided
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    
    // Order by most recent first
    query += ` ORDER BY r.request_time DESC`;
    
    const requests = await db.query(query, params);
    
    return requests;
  } catch (error) {
    logger.error('Error getting customer request history', { 
      customerId, 
      status, 
      error: error.message 
    });
    
    throw new DatabaseError('Failed to get request history', error);
  }
};

export default {
  getCustomerById,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  getCustomerRequestHistory
};