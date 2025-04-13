/**
 * Driver offer controller
 * Handles driver offer management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError, ValidationError, NotFoundError, ForbiddenError } from '../../utils/errors/customErrors.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { validateOfferCreation } from '../../utils/validators/requestValidator.js';
import { OFFER_STATUS, REQUEST_STATUS } from '../../utils/constants/requestStatus.js';
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
      throw new ValidationError(validation.errors.join(', '));
    }

    // Check if driver is approved
    const driverStatus = await db.query(
      "SELECT approval_status FROM drivers WHERE driver_id = ?",
      [driver_id]
    );

    if (driverStatus.length === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
    }

    if (driverStatus[0].approval_status !== 'approved') {
      throw new ForbiddenError(ERROR_MESSAGES.AUTH.ACCOUNT_NOT_APPROVED);
    }

    // Check if request exists and is pending
    const requestStatus = await db.query(
      "SELECT status FROM servicerequests WHERE request_id = ?",
      [request_id]
    );

    if (requestStatus.length === 0) {
      throw new NotFoundError("ไม่พบคำขอบริการ");
    }

    if (requestStatus[0].status !== REQUEST_STATUS.PENDING) {
      throw new ValidationError("คำขอบริการนี้ไม่อยู่ในสถานะที่สามารถรับข้อเสนอได้");
    }

    // Check if driver already made an offer for this request
    const existingOffer = await db.query(
      "SELECT offer_id, offer_status FROM driveroffers WHERE request_id = ? AND driver_id = ?",
      [request_id, driver_id]
    );

    if (existingOffer.length > 0) {
        // If offer exists but was rejected, allow creating a new one
        if (existingOffer[0].offer_status === OFFER_STATUS.REJECTED) {
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
      
          return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
            offer_id: existingOffer[0].offer_id
          }, "อัปเดตข้อเสนอเรียบร้อย"));
        }
      
        // ใช้ ValidationError แทน ConflictError
        throw new ValidationError("คุณได้เสนอราคาสำหรับคำขอบริการนี้ไปแล้ว");
      }
      
    

    // Insert new offer
    const result = await db.query(
      "INSERT INTO driveroffers (request_id, driver_id, offered_price, offer_status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
      [request_id, driver_id, offered_price]
    );

    if (!result.insertId) {
      throw new DatabaseError('Failed to create offer');
    }

    // Get customer ID for notification
    const customerData = await db.query(
      "SELECT customer_id FROM servicerequests WHERE request_id = ?",
      [request_id]
    );

    // Notify customer about new offer if socket is available
    // if (socketService && customerData.length > 0) {
    //   const customer_id = customerData[0].customer_id;
    //   socketService.notifyCustomer(customer_id, 'newOffer', {
    //     request_id,
    //     driver_id,
    //     offer_id: result.insertId,
    //     price: offered_price
    //   });
    // }

    logger.info('Driver created new offer', {
      driver_id,
      request_id,
      offer_id: result.insertId,
      price: offered_price
    });

    return res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
      offer_id: result.insertId
    }, "เสนอราคาสำเร็จ"));
  } catch (error) {
    logger.error('Error creating driver offer', { error: error.message });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof NotFoundError) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof ForbiddenError) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatErrorResponse(error.message));
    }
    
    // ลบการตรวจสอบ ConflictError
    
    if (error instanceof DatabaseError) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
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
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
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
      AND d.offer_status != '${OFFER_STATUS.REJECTED}'
      AND s.status != '${REQUEST_STATUS.COMPLETED}'
      AND s.status != '${REQUEST_STATUS.CANCELLED}'
      ORDER BY d.created_at DESC
    `;

    const offers = await db.query(sql, [driver_id]);

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      Count: offers.length,
      Result: offers
    }));
  } catch (error) {
    logger.error('Error fetching driver offers', { 
      driver_id: req.query.driver_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
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
      throw new ValidationError("กรุณาระบุ offer_id และ driver_id");
    }

    // Verify the offer belongs to this driver
    const offerCheck = await db.query(
      "SELECT o.offer_id, o.offer_status, s.status as request_status FROM driveroffers o JOIN servicerequests s ON o.request_id = s.request_id WHERE o.offer_id = ? AND o.driver_id = ?",
      [offer_id, driver_id]
    );

    if (offerCheck.length === 0) {
      throw new NotFoundError("ไม่พบข้อเสนอ หรือข้อเสนอไม่ได้เป็นของคนขับนี้");
    }

    const offer = offerCheck[0];

    // Check if offer can be cancelled
    if (offer.offer_status === OFFER_STATUS.ACCEPTED) {
      if (offer.request_status === REQUEST_STATUS.ACCEPTED) {
        throw new ValidationError("ไม่สามารถยกเลิกข้อเสนอที่ถูกยอมรับและกำลังดำเนินการแล้ว");
      }
    }

    // Update offer status to rejected
    const result = await db.query(
      `UPDATE driveroffers SET offer_status = '${OFFER_STATUS.REJECTED}' WHERE offer_id = ?`,
      [offer_id]
    );

    if (result.affectedRows === 0) {
      throw new DatabaseError('Failed to cancel offer');
    }

    logger.info('Driver cancelled offer', {
      driver_id,
      offer_id
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, "ยกเลิกข้อเสนอเรียบร้อย"));
  } catch (error) {
    logger.error('Error cancelling driver offer', { 
      offer_id: req.body.offer_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof NotFoundError) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof DatabaseError) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
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
      throw new ValidationError("กรุณาระบุ offer_id");
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
      throw new NotFoundError("ไม่พบข้อเสนอ");
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(offers[0]));
  } catch (error) {
    logger.error('Error fetching offer details', { 
      offer_id: req.query.offer_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof NotFoundError) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
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
      throw new ValidationError("กรุณาระบุ driver_id");
    }

    // Update all pending offers to rejected
    const result = await db.query(
      `UPDATE driveroffers SET offer_status = '${OFFER_STATUS.REJECTED}' WHERE driver_id = ? AND offer_status = '${OFFER_STATUS.PENDING}'`,
      [driver_id]
    );

    logger.info('Rejected all pending offers for driver', {
      driver_id,
      affected_offers: result.affectedRows
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      AffectedOffers: result.affectedRows
    }, "ยกเลิกข้อเสนอที่รอการตอบรับทั้งหมดเรียบร้อย"));
  } catch (error) {
    logger.error('Error rejecting all pending offers', { 
      driver_id: req.body.driver_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
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
      throw new ValidationError("กรุณาระบุ driver_id");
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
      AND d.offer_status = '${OFFER_STATUS.ACCEPTED}'
      AND s.status = '${REQUEST_STATUS.COMPLETED}'
      ORDER BY s.request_time DESC
      LIMIT ? OFFSET ?
    `;

    const offers = await db.query(sql, [driver_id, limit, offset]);

    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM driveroffers d
       JOIN servicerequests s ON d.request_id = s.request_id
       WHERE d.driver_id = ? AND d.offer_status = '${OFFER_STATUS.ACCEPTED}' AND s.status = '${REQUEST_STATUS.COMPLETED}'`,
      [driver_id]
    );

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      Count: offers.length,
      Total: countResult[0].total,
      Result: offers,
      Pagination: {
        limit,
        offset,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    }));
  } catch (error) {
    logger.error('Error fetching offers history', { 
      driver_id: req.query.driver_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
  }
};

/**
 * Check if driver has an accepted offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkAcceptedOffer = async (req, res) => {
  try {
    const { driver_id } = req.query;
    
    if (!driver_id) {
      throw new ValidationError("กรุณาระบุ driver_id");
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
        s.customer_id,
        s.customer_message,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone_number as customer_phone,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        v.vehicletype_name
      FROM driveroffers d
      JOIN servicerequests s ON d.request_id = s.request_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
      WHERE d.driver_id = ?
      AND d.offer_status = '${OFFER_STATUS.ACCEPTED}'
      AND s.status = '${REQUEST_STATUS.ACCEPTED}'
      LIMIT 1
    `;

    const offers = await db.query(sql, [driver_id]);

    if (offers.length === 0) {
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
        has_accepted_offer: false,
        offer: null
      }));
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      has_accepted_offer: true,
      offer: offers[0]
    }));
  } catch (error) {
    logger.error('Error checking accepted offer', { 
      driver_id: req.query.driver_id,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
  }
};

export default {
  createOffer,
  getDriverOffers,
  cancelOffer,
  getOfferDetails,
  rejectAllPendingOffers,
  getOffersHistory,
  checkAcceptedOffer
};