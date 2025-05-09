import db from "../../config/db.js";
import logger from "../../config/logger.js";
import { STATUS_CODES } from "../../utils/constants/statusCodes.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { validateAddress, validateBookmark } from "../../utils/validators/addressValidator.js";
import { pick } from "../../utils/helpers/objectHelpers.js";
import geocodingService from "../../services/location/geocodingService.js";
import { asyncHandler } from "../../utils/errors/errorHandler.js";

/**
 * Edit address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const editAddress = asyncHandler(async (req, res) => {
  // Validate address data
  const validation = validateAddress(req.body);
  if (!validation.isValid) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse(validation.errors.join(", "))
    );
  }

  // Optional: Validate coordinates using geocoding service
  if (req.body.pickup_lat && req.body.pickup_long) {
    const pickupLocation = await geocodingService.reverseGeocode(
      req.body.pickup_lat, 
      req.body.pickup_long
    );
    if (!pickupLocation) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse("พิกัดจุดรับไม่ถูกต้อง")
      );
    }
  }

  if (req.body.dropoff_lat && req.body.dropoff_long) {
    const dropoffLocation = await geocodingService.reverseGeocode(
      req.body.dropoff_lat, 
      req.body.dropoff_long
    );
    if (!dropoffLocation) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse("พิกัดจุดส่งไม่ถูกต้อง")
      );
    }
  }

  // Select only the fields we want to update
  const updateFields = pick(req.body, [
    'save_name', 
    'location_from', 
    'pickup_lat', 
    'pickup_long', 
    'location_to', 
    'dropoff_lat', 
    'dropoff_long', 
    'vehicletype_id'
  ]);

  const sql = `
    UPDATE addresses 
    SET 
      save_name = ?, 
      location_from = ?,
      pickup_lat = ?,
      pickup_long = ?,
      location_to = ?,
      dropoff_lat = ?, 
      dropoff_long = ?,
      vehicletype_id = ?
    WHERE address_id = ?
  `;

  const values = [
    updateFields.save_name,
    updateFields.location_from,
    updateFields.pickup_lat,
    updateFields.pickup_long,
    updateFields.location_to,
    updateFields.dropoff_lat,
    updateFields.dropoff_long,
    updateFields.vehicletype_id,
    req.body.address_id
  ];

  try {
    const result = await db.query(sql, values);
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
      }, "Address updated successfully")
    );
  } catch (error) {
    logger.error('Error editing address', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการแก้ไขที่อยู่")
    );
  }
});

/**
 * Add bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addBookmark = async (req, res) => {
    try {
      const validation = validateBookmark(req.body);
      if (!validation.isValid) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          formatErrorResponse(validation.errors.join(", "))
        );
      }
  
      // Check if customer exists
      const [customerCheck] = await db.query(
        "SELECT customer_id FROM customers WHERE customer_id = ?", 
        [req.body.customer_id]
      );
  
      if (!customerCheck) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          formatErrorResponse("ไม่พบข้อมูลลูกค้า กรุณาตรวจสอบอีกครั้ง")
        );
      }
  
      // Optional: Validate coordinates using geocoding service
      const pickupLocation = await geocodingService.reverseGeocode(
        req.body.pickup_lat, 
        req.body.pickup_long
      );
      if (!pickupLocation) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          formatErrorResponse("พิกัดจุดรับไม่ถูกต้อง")
        );
      }
  
      const dropoffLocation = await geocodingService.reverseGeocode(
        req.body.dropoff_lat, 
        req.body.dropoff_long
      );
      if (!dropoffLocation) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          formatErrorResponse("พิกัดจุดส่งไม่ถูกต้อง")
        );
      }
  
      const sql = `
        INSERT INTO addresses (
          customer_id,
          save_name,
          location_from,
          pickup_lat,
          pickup_long,
          location_to,
          dropoff_lat,  
          dropoff_long,
          vehicletype_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        req.body.customer_id,
        req.body.save_name,
        req.body.location_from,
        req.body.pickup_lat,
        req.body.pickup_long,
        req.body.location_to,
        req.body.dropoff_lat,
        req.body.dropoff_long,
        req.body.vehicletype_id,
      ];
  
      const result = await db.query(sql, values);
  
      return res.status(STATUS_CODES.CREATED).json(
        formatSuccessResponse({
          InsertId: result.insertId
        }, "เพิ่มที่คั่นหน้าสำเร็จ")
      );
  
    } catch (error) {
      logger.error('Error adding bookmark', { 
        error: error.message,
        body: req.body
      });
  
      // Check for specific MySQL foreign key constraint error
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          formatErrorResponse("ไม่พบข้อมูลลูกค้า กรุณาตรวจสอบอีกครั้ง")
        );
      }
  
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการเพิ่มที่คั่นหน้า")
      );
    }
  };
  
/**
 * Disable bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disableBookmark = asyncHandler(async (req, res) => {
  if (!req.body.address_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("address_id is required")
    );
  }

  const sql = `
    UPDATE addresses 
    SET 
      is_deleted = 1
    WHERE address_id = ?
  `;

  const values = [req.body.address_id];

  try {
    const result = await db.query(sql, values);
    
    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("Address not found")
      );
    }
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
      }, "Bookmark disabled successfully")
    );
  } catch (error) {
    logger.error('Error disabling bookmark', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการปิดใช้งานที่คั่นหน้า")
    );
  }
});

/**
 * Get user bookmarks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getuserBookmarks = asyncHandler(async (req, res) => {
  const customer_id = req.query.customer_id || null;
  
  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("customer_id is required")
    );
  }
  
  const sql = `
    SELECT
      address_id,
      save_name,
      location_from,
      pickup_lat,
      pickup_long,
      location_to,
      dropoff_lat,
      dropoff_long,
      vehicletype_id
    FROM
      addresses
    WHERE
      customer_id = ?
      AND is_deleted = 0;
  `;
  
  try {
    const result = await db.query(sql, [customer_id]);
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(result)
    );
  } catch (error) {
    logger.error('Error fetching bookmarks', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลที่คั่นหน้า")
    );
  }
});

/**
 * Get service info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getServiceInfo = asyncHandler(async (req, res) => {
  const request_id = req.query.request_id || null;
  
  if (!request_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("request_id is required")
    );
  }
  
  const sql = `
    SELECT 
      c.first_name,
      c.last_name,
      AVG(r.rating) AS average_rating,
      do.offered_price AS price,
      sr.location_from,
      sr.pickup_lat,
      sr.pickup_long,
      sr.location_to,
      sr.dropoff_lat,
      sr.dropoff_long
    FROM servicerequests sr
    INNER JOIN customers c 
      ON sr.customer_id = c.customer_id
    INNER JOIN driveroffers do 
      ON sr.request_id = do.request_id
      AND do.offer_status = 'accepted'
    LEFT JOIN reviews r 
      ON do.driver_id = r.driver_id
    WHERE sr.request_id = ?
    GROUP BY
      sr.request_id,
      c.first_name,
      c.last_name,
      do.offered_price,
      sr.pickup_lat,
      sr.pickup_long,
      sr.location_from,
      sr.dropoff_lat,
      sr.dropoff_long,
      sr.location_to;
  `;
  
  try {
    const result = await db.query(sql, [request_id]);
    
    if (result.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("Service not found")
      );
    }
    
    // Optional: Enrich data with more location details
    const enrichedResult = await Promise.all(result.map(async (item) => {
      const pickupDetails = await geocodingService.reverseGeocode(
        item.pickup_lat, 
        item.pickup_long
      );
      const dropoffDetails = await geocodingService.reverseGeocode(
        item.dropoff_lat, 
        item.dropoff_long
      );
      
      return {
        ...item,
        pickup_address: pickupDetails || item.location_from,
        dropoff_address: dropoffDetails || item.location_to
      };
    }));
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(enrichedResult)
    );
  } catch (error) {
    logger.error('Unexpected error in getServiceInfo', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลบริการ")
    );
  }
});

/**
 * Get order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const orderStatus = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  
  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("customer_id is required")
    );
  }
  
  const sql = `
    SELECT sr.request_id, do.driver_id, sr.status
    FROM servicerequests sr
    INNER JOIN driveroffers do 
      ON sr.request_id = do.request_id
      AND do.offer_status = 'accepted'
    WHERE sr.customer_id = ? 
    ORDER BY sr.request_time DESC
    LIMIT 1;
  `;

  try {
    const result = await db.query(sql, [customer_id]);

    if (result.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("No accepted records found for customer_id")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(result[0])
    );
  } catch (error) {
    logger.error('Error fetching order status', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะคำสั่ง")
    );
  }
});

/**
 * Check status order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkStatusOrder = asyncHandler(async (req, res) => {
  const { request_id } = req.params;

  if (isNaN(request_id)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("request_id must be a number")
    );
  }

  const query = `SELECT status FROM servicerequests WHERE request_id = ?`;

  try {
    const result = await db.query(query, [request_id]);

    if (result.length > 0) {
      return res.status(STATUS_CODES.OK).json(
        formatSuccessResponse({
          RequestId: parseInt(request_id),
          StatusOrder: result[0].status
        }, result[0].status ? "Request status retrieved successfully" : "No status found")
      );
    } else {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("Request not found")
      );
    }
  } catch (error) {
    logger.error('Error checking status order', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบสถานะคำสั่ง")
    );
  }
});

export default {
  editAddress,
  addBookmark,
  disableBookmark,
  getuserBookmarks,
  getServiceInfo,
  orderStatus,
  checkStatusOrder
};