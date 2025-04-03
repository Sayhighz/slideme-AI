/**
 * Wallet service for managing driver earnings and customer balances
 */
import logger from '../../config/logger.js';
import db from '../../config/db.js';
import { DatabaseError } from '../../utils/errors/customErrors.js';

/**
 * Get driver earnings
 * @param {number} driverId - Driver ID
 * @param {string} period - Time period ('day', 'week', 'month', 'year', 'all')
 * @returns {Promise<Object>} Earnings data or null if retrieval fails
 */
export const getDriverEarnings = async (driverId, period = 'all') => {
  try {
    if (!driverId) {
      logger.warn('Missing driver ID for earnings retrieval');
      return null;
    }
    
    // Build WHERE clause based on period
    let timeCondition = '';
    
    switch (period) {
      case 'day':
        timeCondition = 'AND DATE(r.request_time) = CURDATE()';
        break;
      case 'week':
        timeCondition = 'AND YEARWEEK(r.request_time, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'month':
        timeCondition = 'AND YEAR(r.request_time) = YEAR(CURDATE()) AND MONTH(r.request_time) = MONTH(CURDATE())';
        break;
      case 'year':
        timeCondition = 'AND YEAR(r.request_time) = YEAR(CURDATE())';
        break;
      default:
        timeCondition = '';
    }
    
    // Get earnings data
    const earnings = await db.query(
      `SELECT 
         SUM(o.offered_price * 0.85) AS total_earnings,
         COUNT(r.request_id) AS total_trips
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE o.driver_id = ?
       AND r.status = 'completed'
       ${timeCondition}`,
      [driverId]
    );
    
    if (!earnings || earnings.length === 0) {
      return {
        total_earnings: 0,
        total_trips: 0
      };
    }
    
    // Get recent trips
    const recentTrips = await db.query(
      `SELECT 
         r.request_id,
         r.location_from,
         r.location_to,
         r.request_time,
         o.offered_price,
         (o.offered_price * 0.85) AS driver_earnings
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE o.driver_id = ?
       AND r.status = 'completed'
       ORDER BY r.request_time DESC
       LIMIT 5`,
      [driverId]
    );
    
    logger.info('Retrieved driver earnings', { 
      driverId, 
      period,
      totalEarnings: earnings[0].total_earnings || 0
    });
    
    return {
      total_earnings: earnings[0].total_earnings || 0,
      total_trips: earnings[0].total_trips || 0,
      recent_trips: recentTrips
    };
  } catch (error) {
    logger.error('Error retrieving driver earnings', { 
      driverId, 
      period,
      error: error.message 
    });
    
    throw new DatabaseError('Failed to retrieve driver earnings', error);
  }
};

/**
 * Process driver payout when service is completed
 * @param {number} requestId - Request ID
 * @returns {Promise<boolean>} Success status
 */
export const processDriverPayout = async (requestId) => {
  try {
    if (!requestId) {
      logger.warn('Missing request ID for driver payout');
      return false;
    }
    
    // Start database transaction
    const connection = await db.beginTransaction();
    
    try {
      // Get request details
      const requests = await db.transactionQuery(
        connection,
        `SELECT r.request_id, r.status, o.offered_price, o.driver_id
         FROM servicerequests r
         JOIN driveroffers o ON r.offer_id = o.offer_id
         WHERE r.request_id = ? AND r.status = 'completed'`,
        [requestId]
      );
      
      if (requests.length === 0) {
        logger.warn('Request not found or not completed for driver payout', { requestId });
        await db.rollbackTransaction(connection);
        return false;
      }
      
      const request = requests[0];
      
      // Calculate driver payout (85% of the offered price)
      const payoutAmount = request.offered_price * 0.85;
      
      // In a real implementation, this would update a driver_earnings or wallet table
      // and potentially trigger an actual bank transfer or other payout method
      
      // For now, we'll just log the payout
      logger.info('Driver payout processed', { 
        requestId, 
        driverId: request.driver_id,
        payoutAmount
      });
      
      // Commit transaction
      await db.commitTransaction(connection);
      
      return true;
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error processing driver payout', { 
      requestId, 
      error: error.message 
    });
    
    return false;
  }
};

/**
 * Get driver earnings by time period (daily, weekly, monthly)
 * @param {number} driverId - Driver ID
 * @returns {Promise<Object>} Earnings breakdown or null if retrieval fails
 */
export const getEarningsBreakdown = async (driverId) => {
  try {
    if (!driverId) {
      logger.warn('Missing driver ID for earnings breakdown');
      return null;
    }
    
    // Get daily earnings for the last 7 days
    const dailyEarnings = await db.query(
      `SELECT 
         DATE(r.request_time) AS date,
         SUM(o.offered_price * 0.85) AS earnings,
         COUNT(r.request_id) AS trips
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE o.driver_id = ?
       AND r.status = 'completed'
       AND r.request_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(r.request_time)
       ORDER BY date DESC`,
      [driverId]
    );
    
    // Get weekly earnings for the last 4 weeks
    const weeklyEarnings = await db.query(
      `SELECT 
         YEARWEEK(r.request_time, 1) AS week,
         MIN(DATE(r.request_time)) AS week_start,
         SUM(o.offered_price * 0.85) AS earnings,
         COUNT(r.request_id) AS trips
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE o.driver_id = ?
       AND r.status = 'completed'
       AND r.request_time >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
       GROUP BY YEARWEEK(r.request_time, 1)
       ORDER BY week DESC`,
      [driverId]
    );
    
    // Get monthly earnings for the last 6 months
    const monthlyEarnings = await db.query(
      `SELECT 
         DATE_FORMAT(r.request_time, '%Y-%m') AS month,
         SUM(o.offered_price * 0.85) AS earnings,
         COUNT(r.request_id) AS trips
       FROM servicerequests r
       JOIN driveroffers o ON r.offer_id = o.offer_id
       WHERE o.driver_id = ?
       AND r.status = 'completed'
       AND r.request_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(r.request_time, '%Y-%m')
       ORDER BY month DESC`,
      [driverId]
    );
    
    logger.info('Retrieved earnings breakdown', { driverId });
    
    return {
      daily: dailyEarnings,
      weekly: weeklyEarnings,
      monthly: monthlyEarnings
    };
  } catch (error) {
    logger.error('Error retrieving earnings breakdown', { 
      driverId, 
      error: error.message 
    });
    
    return null;
  }
};

export default {
  getDriverEarnings,
  processDriverPayout,
  getEarningsBreakdown
};