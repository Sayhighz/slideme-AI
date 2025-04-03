/**
 * Address model for saved addresses
 */
import db from '../config/db.js';
import logger from '../config/logger.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Get saved addresses for a customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} List of saved addresses
 */
export const getSavedAddresses = async (customerId) => {
  try {
    const addresses = await db.query(
      `SELECT 
         address_id, 
         customer_id, 
         save_name, 
         location_from, 
         pickup_lat, 
         pickup_long, 
         location_to, 
         dropoff_lat, 
         dropoff_long,
         vehicletype_id,
         created_at
       FROM addresses
       WHERE customer_id = ? AND is_deleted = 0
       ORDER BY created_at DESC`,
      [customerId]
    );
    
    return addresses;
  } catch (error) {
    logger.error('Error getting saved addresses', { customerId, error: error.message });
    throw new DatabaseError('Failed to get saved addresses', error);
  }
};

/**
 * Get a single address by ID
 * @param {number} addressId - Address ID
 * @param {number} customerId - Customer ID (for authorization)
 * @returns {Promise<Object>} Address details or null if not found
 */
export const getAddressById = async (addressId, customerId) => {
  try {
    const addresses = await db.query(
      `SELECT 
         a.address_id, 
         a.customer_id, 
         a.save_name, 
         a.location_from, 
         a.pickup_lat, 
         a.pickup_long, 
         a.location_to, 
         a.dropoff_lat, 
         a.dropoff_long,
         a.vehicletype_id,
         v.vehicletype_name,
         a.created_at
       FROM addresses a
       JOIN vehicle_types v ON a.vehicletype_id = v.vehicletype_id
       WHERE a.address_id = ? AND a.customer_id = ? AND a.is_deleted = 0`,
      [addressId, customerId]
    );
    
    return addresses.length > 0 ? addresses[0] : null;
  } catch (error) {
    logger.error('Error getting address by ID', { addressId, customerId, error: error.message });
    throw new DatabaseError('Failed to get address details', error);
  }
};

/**
 * Save a new address bookmark
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address with ID or null if creation failed
 */
export const saveAddress = async (addressData) => {
  try {
    // Validate required fields
    if (!addressData.customer_id || !addressData.location_from || !addressData.location_to) {
      logger.warn('Missing required fields for saving address');
      return null;
    }
    
    const result = await db.query(
      `INSERT INTO addresses (
         customer_id, 
         save_name, 
         location_from, 
         pickup_lat, 
         pickup_long, 
         location_to, 
         dropoff_lat, 
         dropoff_long,
         vehicletype_id,
         created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        addressData.customer_id,
        addressData.save_name || `Trip ${new Date().toISOString().split('T')[0]}`,
        addressData.location_from,
        addressData.pickup_lat,
        addressData.pickup_long,
        addressData.location_to,
        addressData.dropoff_lat,
        addressData.dropoff_long,
        addressData.vehicletype_id
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the created address
      const savedAddress = await getAddressById(result.insertId, addressData.customer_id);
      return savedAddress;
    }
    
    return null;
  } catch (error) {
    logger.error('Error saving address', { addressData, error: error.message });
    throw new DatabaseError('Failed to save address', error);
  }
};

/**
 * Update a saved address
 * @param {number} addressId - Address ID
 * @param {Object} addressData - Updated address data
 * @param {number} customerId - Customer ID (for authorization)
 * @returns {Promise<Object>} Updated address or null if update failed
 */
export const updateAddress = async (addressId, addressData, customerId) => {
  try {
    // Check if address exists and belongs to customer
    const existingAddress = await getAddressById(addressId, customerId);
    
    if (!existingAddress) {
      logger.warn('Address not found or does not belong to customer', { addressId, customerId });
      return null;
    }
    
    // Update the address
    const result = await db.query(
      `UPDATE addresses
       SET 
         save_name = ?,
         location_from = ?,
         pickup_lat = ?,
         pickup_long = ?,
         location_to = ?,
         dropoff_lat = ?,
         dropoff_long = ?,
         vehicletype_id = ?
       WHERE address_id = ? AND customer_id = ? AND is_deleted = 0`,
      [
        addressData.save_name || existingAddress.save_name,
        addressData.location_from || existingAddress.location_from,
        addressData.pickup_lat || existingAddress.pickup_lat,
        addressData.pickup_long || existingAddress.pickup_long,
        addressData.location_to || existingAddress.location_to,
        addressData.dropoff_lat || existingAddress.dropoff_lat,
        addressData.dropoff_long || existingAddress.dropoff_long,
        addressData.vehicletype_id || existingAddress.vehicletype_id,
        addressId,
        customerId
      ]
    );
    
    if (result.affectedRows > 0) {
      // Return the updated address
      return await getAddressById(addressId, customerId);
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating address', { addressId, customerId, error: error.message });
    throw new DatabaseError('Failed to update address', error);
  }
};

/**
 * Delete a saved address (soft delete)
 * @param {number} addressId - Address ID
 * @param {number} customerId - Customer ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export const deleteAddress = async (addressId, customerId) => {
  try {
    // Soft delete the address
    const result = await db.query(
      `UPDATE addresses
       SET is_deleted = 1
       WHERE address_id = ? AND customer_id = ?`,
      [addressId, customerId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error deleting address', { addressId, customerId, error: error.message });
    throw new DatabaseError('Failed to delete address', error);
  }
};

export default {
  getSavedAddresses,
  getAddressById,
  saveAddress,
  updateAddress,
  deleteAddress
};