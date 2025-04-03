/**
 * Push notification service
 */
import firebase from 'firebase-admin';
import logger from '../../config/logger.js';
import db from '../../config/db.js';

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;
      
    if (serviceAccount) {
      firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount)
      });
    } else {
      logger.warn('Firebase service account not found, push notifications will be mocked');
    }
  } catch (error) {
    logger.error('Firebase initialization error', { error: error.message });
  }
}

/**
 * Store a device token for a user
 * @param {string} userType - User type (customer or driver)
 * @param {number} userId - User ID
 * @param {string} token - Device token
 * @param {string} platform - Device platform (ios, android, web)
 * @returns {Promise<boolean>} Success status
 */
export const storeDeviceToken = async (userType, userId, token, platform) => {
  try {
    if (!userType || !userId || !token) {
      logger.warn('Missing parameters for storing device token');
      return false;
    }
    
    const result = await db.query(
      `INSERT INTO device_tokens (user_type, user_id, token, platform, created_at) 
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE platform = ?, updated_at = NOW()`,
      [userType, userId, token, platform, platform]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Error storing device token', { error: error.message });
    throw error;
  }
};


/**
 * Remove a device token
 * @param {string} token - Device token to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeDeviceToken = async (token) => {
    try {
      if (!token) {
        logger.warn('Missing token for removal');
        return false;
      }
      
      const result = await db.query(
        'UPDATE device_tokens SET is_active = 0 WHERE token = ?',
        [token]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error removing device token', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Get device tokens for a user
   * @param {string} userType - User type (customer or driver)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of device tokens
   */
  export const getUserDeviceTokens = async (userType, userId) => {
    try {
      if (!userType || !userId) {
        logger.warn('Missing parameters for getting user device tokens');
        return [];
      }
      
      const result = await db.query(
        'SELECT token, platform FROM device_tokens WHERE user_type = ? AND user_id = ? AND is_active = 1',
        [userType, userId]
      );
      
      return result.map(row => ({
        token: row.token,
        platform: row.platform
      }));
    } catch (error) {
      logger.error('Error getting user device tokens', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Send push notification to a specific user
   * @param {string} userType - User type (customer or driver)
   * @param {number} userId - User ID
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} data - Additional data to send
   * @returns {Promise<Array>} Array of notification results
   */
  export const sendUserNotification = async (userType, userId, notification, data = {}) => {
    try {
      // Get user device tokens
      const deviceTokens = await getUserDeviceTokens(userType, userId);
      
      if (deviceTokens.length === 0) {
        logger.warn('No device tokens found for user', { userType, userId });
        return [];
      }
      
      // If Firebase is not initialized, mock notification
      if (!firebase.apps.length) {
        logger.info('Mocking push notification', { userType, userId, notification, data });
        return deviceTokens.map(device => ({
          deviceToken: device.token,
          platform: device.platform,
          success: true,
          messageId: 'mock-message-id'
        }));
      }
      
      // Send notifications to all user devices
      const results = await Promise.all(
        deviceTokens.map(async (device) => {
          try {
            const message = {
              notification,
              data: Object.entries(data).reduce((acc, [key, value]) => {
                // Firebase only accepts string values
                acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
                return acc;
              }, {}),
              token: device.token
            };
            
            const response = await firebase.messaging().send(message);
            
            return {
              deviceToken: device.token,
              platform: device.platform,
              success: true,
              messageId: response
            };
          } catch (error) {
            // If token is invalid, remove it
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              await removeDeviceToken(device.token);
            }
            
            logger.error('Error sending push notification to device', { 
              error: error.message, 
              deviceToken: device.token,
              errorCode: error.code
            });
            
            return {
              deviceToken: device.token,
              platform: device.platform,
              success: false,
              error: error.message
            };
          }
        })
      );
      
      return results;
    } catch (error) {
      logger.error('Error sending user notification', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {string} userType - User type (customer or driver)
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} data - Additional data to send
   * @returns {Promise<Object>} Notification results summary
   */
  export const sendMulticastNotification = async (userIds, userType, notification, data = {}) => {
    try {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        logger.warn('No user IDs provided for multicast notification');
        return { success: 0, failure: 0, results: [] };
      }
      
      // Send notifications to each user
      const results = await Promise.all(
        userIds.map(userId => sendUserNotification(userType, userId, notification, data))
      );
      
      // Flatten results array
      const flatResults = results.flat();
      
      // Count successful and failed notifications
      const success = flatResults.filter(result => result.success).length;
      const failure = flatResults.filter(result => !result.success).length;
      
      return {
        success,
        failure,
        total: success + failure,
        results: flatResults
      };
    } catch (error) {
      logger.error('Error sending multicast notification', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Send notification to nearby drivers about a new request
   * @param {Array} drivers - Array of driver objects with id
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Notification results
   */
  export const notifyDriversOfNewRequest = async (drivers, requestId) => {
    try {
      if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
        logger.warn('No drivers to notify about new request', { requestId });
        return { success: 0, failure: 0, results: [] };
      }
      
      // Get request details
      const [request] = await db.query(
        `SELECT r.location_from, r.location_to, r.request_time, v.vehicletype_name
         FROM servicerequests r
         JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
         WHERE r.request_id = ?`,
        [requestId]
      );
      
      if (!request) {
        logger.warn('Request not found for driver notification', { requestId });
        return { success: 0, failure: 0, results: [] };
      }
      
      // Create notification
      const notification = {
        title: 'คำขอบริการใหม่',
        body: `มีคำขอบริการใหม่จาก ${request.location_from} ไปยัง ${request.location_to}`
      };
      
      // Additional data
      const data = {
        requestId: requestId.toString(),
        type: 'new_request',
        vehicleType: request.vehicletype_name,
        requestTime: new Date(request.request_time).toISOString()
      };
      
      // Send to all drivers
      const driverIds = drivers.map(driver => driver.driver_id);
      return await sendMulticastNotification(driverIds, 'driver', notification, data);
    } catch (error) {
      logger.error('Error notifying drivers of new request', { error: error.message });
      throw error;
    }
  };
  
  /**
   * Notify customer about accepted offer
   * @param {number} customerId - Customer ID
   * @param {number} requestId - Request ID
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object>} Notification result
   */
  export const notifyCustomerOfAcceptedOffer = async (customerId, requestId, driverId) => {
    try {
      // Get driver details
      const [driver] = await db.query(
        `SELECT first_name, last_name, license_plate
         FROM drivers
         WHERE driver_id = ?`,
        [driverId]
      );
      
      if (!driver) {
        logger.warn('Driver not found for customer notification', { driverId });
        return { success: 0, failure: 0 };
      }
      
      // Create notification
      const notification = {
        title: 'ข้อเสนอได้รับการตอบรับ',
        body: `คนขับ ${driver.first_name} ${driver.last_name} ตอบรับคำขอของคุณแล้ว`
      };
      
      // Additional data
      const data = {
        requestId: requestId.toString(),
        driverId: driverId.toString(),
        type: 'offer_accepted',
        licensePlate: driver.license_plate || ''
      };
      
      // Send notification
      return await sendUserNotification('customer', customerId, notification, data);
    } catch (error) {
      logger.error('Error notifying customer of accepted offer', { error: error.message });
      throw error;
    }
  };
  
  export default {
    storeDeviceToken,
    removeDeviceToken,
    getUserDeviceTokens,
    sendUserNotification,
    sendMulticastNotification,
    notifyDriversOfNewRequest,
    notifyCustomerOfAcceptedOffer
  };