/**
 * Driver offer controller
 * Handles driver offer management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError } from '../../utils/errors/customErrors.js';
import { validateOfferCreation } from '../../utils/validators/requestValidator.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Create new offer for a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createOffer = async (req, res) => {
  try {
    const { request_id, driver_id, offered_price } = req.body;

    // Validate offer data
    const validation = validateOfferCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        Status: false,
        Error: validation.errors.join(', ')
      });
    }

    // Check if driver is approved
    const driverStatus = await db.query(
      "SELECT approval_status FROM drivers WHERE driver_id = ?",
      [driver_id]
    );

    if (driverStatus.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบข้อมูลคนขับ"
      });
    }

    if (driverStatus[0].approval_status !== 'approved') {
      return res.status(403).json({
        Status: false,
        Error: "คนขับยังไม่ได้รับการอนุมัติ"
      });
    }

    // Check if request exists and is pending
    const requestStatus = await db.query(
      "SELECT status FROM servicerequests WHERE request_id = ?",
      [request_id]
    );

    if (requestStatus.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบคำขอบริการ"
      });
    }

    if (requestStatus[0].status !== 'pending') {
      return res.status(400).json({
        Status: false,
        Error: "คำขอบริการนี้ไม่อยู่ในสถานะที่สามารถรับข้อเสนอได้"
      });
    }

    // Check if driver already made an offer for this request
    const existingOffer = await db.query(
      "SELECT offer_id, offer_status FROM driveroffers WHERE request_id = ? AND driver_id = ?",
      [request_id, driver_id]
    );

    if (existingOffer.length > 0) {
      // If offer exists but was rejected, allow creating a new one
      if (existingOffer[0].offer_status === 'rejected') {
        // Update existing offer
        await db.query(
          "UPDATE driveroffers SET offered_price = ?, offer_status = 'pending', created_at = NOW() WHERE offer_id = ?",
          [offered_price, existingOffer[0].offer_id]
        );

        logger.info('Driver updated rejected offer', {
          driver_id,
          request_id,
          offer_id: existingOffer[0].offer_id,
          price: offered_price
        });

        return res.status(200).json({
          Status: true,
          Message: "อัปเดตข้อเสนอเรียบร้อย",
          offer_id: existingOffer[0].offer_id
        });
      }

      return res.status(409).json({
        Status: false,
        Error: "คุณได้เสนอราคาสำหรับคำขอบริการนี้ไปแล้ว"
      });
    }

    // Insert new offer
    const result = await db.query(
      "INSERT INTO driveroffers (request_id, driver_id, offered_price, offer_status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
      [request_id, driver_id, offered_price]
    );

    if (!result.insertId) {
      throw new Error('Failed to create offer');
    }

    // Get customer ID for notification
    const customerData = await db.query(
      "SELECT customer_id FROM servicerequests WHERE request_id = ?",
      [request_id]
    );

    // Notify customer about new offer if socket is available
    if (socketService && customerData.length > 0) {
      const customer_id = customerData[0].customer_id;
      socketService.notifyCustomer(customer_id, 'newOffer', {
        request_id,
        driver_id,
        offer_id: result.insertId,
        price: offered_price
      });
    }

    logger.info('Driver created new offer', {
      driver_id,
      request_id,
      offer_id: result.insertId,
      price: offered_price
    });

    return res.status(201).json({
      Status: true,
      Message: "เสนอราคาสำเร็จ",
      offer_id: result.insertId
    });
  } catch (error) {
    logger.error('Error creating driver offer', { error: error.message });
    
    if (error instanceof DatabaseError) {
      return res.status(500).json({
        Status: false,
        Error: "เกิดข้อผิดพลาดในฐานข้อมูล"
      });
    }
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Get driver's offers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverOffers = async (req, res) => {
  try {
    const { driver_id } = req.query;
    
    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
    }

    const sql = `
      SELECT
        d.offer_id,
        d.request_id,
        d.offered_price,
        d.offer_status,
        d.created_at,
        s.location_from,
        s.location_to,
        s.status as request_status,
        s.pickup_lat,
        s.pickup_long,
        s.dropoff_lat,
        s.dropoff_long,
        v.vehicletype_name,
        s.customer_message
      FROM driveroffers d
      LEFT JOIN servicerequests s ON d.request_id = s.request_id
      LEFT JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
      WHERE d.driver_id = ?
      AND d.offer_status != 'rejected'
      AND s.status != 'completed'
      AND s.status != 'cancelled'
      ORDER BY d.created_at DESC
    `;

    const offers = await db.query(sql, [driver_id]);

    return res.status(200).json({
      Status: true,
      Count: offers.length,
      Result: offers
    });
  } catch (error) {
    logger.error('Error fetching driver offers', { 
      driver_id: req.query.driver_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Cancel/withdraw an offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const cancelOffer = async (req, res) => {
  try {
    const { offer_id, driver_id } = req.body;
    
    if (!offer_id || !driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ offer_id และ driver_id"
      });
    }

    // Verify the offer belongs to this driver
    const offerCheck = await db.query(
      "SELECT o.offer_id, o.offer_status, s.status as request_status FROM driveroffers o JOIN servicerequests s ON o.request_id = s.request_id WHERE o.offer_id = ? AND o.driver_id = ?",
      [offer_id, driver_id]
    );

    if (offerCheck.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบข้อเสนอ หรือข้อเสนอไม่ได้เป็นของคนขับนี้"
      });
    }

    const offer = offerCheck[0];

    // Check if offer can be cancelled
    if (offer.offer_status === 'accepted') {
      if (offer.request_status === 'accepted') {
        return res.status(400).json({
          Status: false,
          Error: "ไม่สามารถยกเลิกข้อเสนอที่ถูกยอมรับและกำลังดำเนินการแล้ว"
        });
      }
    }

    // Update offer status to rejected
    const result = await db.query(
      "UPDATE driveroffers SET offer_status = 'rejected' WHERE offer_id = ?",
      [offer_id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to cancel offer');
    }

    logger.info('Driver cancelled offer', {
      driver_id,
      offer_id
    });

    return res.status(200).json({
      Status: true,
      Message: "ยกเลิกข้อเสนอเรียบร้อย"
    });
  } catch (error) {
    logger.error('Error cancelling driver offer', { 
      offer_id: req.body.offer_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Get offer details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOfferDetails = async (req, res) => {
  try {
    const { offer_id, driver_id } = req.query;
    
    if (!offer_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ offer_id"
      });
    }

    let sql = `
      SELECT
        d.offer_id,
        d.request_id,
        d.driver_id,
        d.offered_price,
        d.offer_status,
        d.created_at,
        s.location_from,
        s.location_to,
        s.status as request_status,
        s.pickup_lat,
        s.pickup_long,
        s.dropoff_lat,
        s.dropoff_long,
        s.customer_id,
        s.customer_message,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        v.vehicletype_name
      FROM driveroffers d
      JOIN servicerequests s ON d.request_id = s.request_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
      WHERE d.offer_id = ?
    `;

    const params = [offer_id];

    // If driver_id is provided, ensure offer belongs to this driver
    if (driver_id) {
      sql += " AND d.driver_id = ?";
      params.push(driver_id);
    }

    const offers = await db.query(sql, params);

    if (offers.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบข้อเสนอ"
      });
    }

    return res.status(200).json({
      Status: true,
      Result: offers[0]
    });
  } catch (error) {
    logger.error('Error fetching offer details', { 
      offer_id: req.query.offer_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Reject all pending offers from a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const rejectAllPendingOffers = async (req, res) => {
  try {
    const { driver_id } = req.body;
    
    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
    }

    // Update all pending offers to rejected
    const result = await db.query(
      "UPDATE driveroffers SET offer_status = 'rejected' WHERE driver_id = ? AND offer_status = 'pending'",
      [driver_id]
    );

    logger.info('Rejected all pending offers for driver', {
      driver_id,
      affected_offers: result.affectedRows
    });

    return res.status(200).json({
      Status: true,
      Message: "ยกเลิกข้อเสนอที่รอการตอบรับทั้งหมดเรียบร้อย",
      AffectedOffers: result.affectedRows
    });
  } catch (error) {
    logger.error('Error rejecting all pending offers', { 
      driver_id: req.body.driver_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Get history of driver's completed offers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOffersHistory = async (req, res) => {
  try {
    const { driver_id } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
    }

    const sql = `
      SELECT
        d.offer_id,
        d.request_id,
        d.offered_price,
        d.created_at,
        s.location_from,
        s.location_to,
        s.status as request_status,
        s.request_time,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        v.vehicletype_name,
        r.rating
      FROM driveroffers d
      JOIN servicerequests s ON d.request_id = s.request_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
      LEFT JOIN reviews r ON r.request_id = s.request_id AND r.driver_id = d.driver_id
      WHERE d.driver_id = ?
      AND d.offer_status = 'accepted'
      AND s.status = 'completed'
      ORDER BY s.request_time DESC
      LIMIT ? OFFSET ?
    `;

    const offers = await db.query(sql, [driver_id, limit, offset]);

    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM driveroffers d
       JOIN servicerequests s ON d.request_id = s.request_id
       WHERE d.driver_id = ? AND d.offer_status = 'accepted' AND s.status = 'completed'`,
      [driver_id]
    );

    return res.status(200).json({
      Status: true,
      Count: offers.length,
      Total: countResult[0].total,
      Result: offers,
      Pagination: {
        limit,
        offset,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching offers history', { 
      driver_id: req.query.driver_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

export default {
  createOffer,
  getDriverOffers,
  cancelOffer,
  getOfferDetails,
  rejectAllPendingOffers,
  getOffersHistory
};