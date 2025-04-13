/**
 * Driver request controller
 * Handles driver service request management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError, NotFoundError, ValidationError, ForbiddenError, CustomError } from '../../utils/errors/customErrors.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { formatSuccessResponse, formatErrorResponse, formatServiceRequest } from '../../utils/formatters/responseFormatter.js';
import { REQUEST_STATUS, OFFER_STATUS } from '../../utils/constants/requestStatus.js';
import { validateCreateRequest } from '../../utils/validators/requestValidator.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import distanceService from '../../services/location/distanceService.js';
import mapService from '../../services/location/mapService.js';
import socketService from '../../services/communication/socketService.js';
import { maskString } from '../../utils/helpers/stringHelpers.js';
import { formatDisplayDate, formatTimeString } from '../../utils/formatters/dateFormatter.js';
import { formatThaiBaht } from '../../utils/formatters/currencyFormatter.js';

/**
 * Get available service requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAvailableRequests = asyncHandler(async (req, res) => {
  const { driver_id, vehicletype_id, latitude, longitude, radius } = req.query;

  // Basic validation
  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['driver_id']);
  }

  // Check if driver is approved
  const driverStatus = await db.query(
    "SELECT approval_status, vehicletype_id FROM drivers WHERE driver_id = ?",
    [driver_id]
  );

  if (driverStatus.length === 0) {
    throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
  }

  if (driverStatus[0].approval_status !== 'approved') {
    throw new ForbiddenError(ERROR_MESSAGES.AUTH.ACCOUNT_NOT_APPROVED);
  }

  // Build query conditions
  let conditions = [`s.status = '${REQUEST_STATUS.PENDING}'`];
  let params = [];

  // Filter by vehicle type if provided, otherwise use driver's vehicle type
  const filterVehicleType = vehicletype_id || driverStatus[0].vehicletype_id;
  if (filterVehicleType && filterVehicleType !== '99') { // 99 might be "any type" based on your data
    conditions.push("s.vehicletype_id = ?");
    params.push(filterVehicleType);
  }

  // Check if driver has already made an offer for these requests
  conditions.push("NOT EXISTS (SELECT 1 FROM driveroffers o WHERE o.request_id = s.request_id AND o.driver_id = ?)");
  params.push(driver_id);

  // Build the base query
  const sql = `
    SELECT 
      s.request_id,
      s.customer_id,
      s.location_from,
      s.location_to,
      s.pickup_lat,
      s.pickup_long,
      s.dropoff_lat,
      s.dropoff_long,
      s.status,
      s.booking_time,
      s.request_time,
      s.customer_message,
      v.vehicletype_name,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name
    FROM servicerequests s
    JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
    JOIN customers c ON s.customer_id = c.customer_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY s.request_time DESC
  `;

  // Get available requests
  const requests = await db.query(sql, params);

  // Calculate distances if coordinates are provided
  let availableRequests = requests;
  if (latitude && longitude) {
    const searchRadius = radius ? parseFloat(radius) : 20; // Default 20km radius
    
    // Calculate distance for each request
    availableRequests = requests.map(request => {
      const distance = distanceService.calculateDistance(
        latitude,
        longitude,
        request.pickup_lat,
        request.pickup_long
      );
      
      return {
        ...request,
        distance,
        distance_text: `${distance.toFixed(1)} กม.`
      };
    });
    
    // Filter by radius if coordinates are provided
    availableRequests = availableRequests.filter(request => request.distance <= searchRadius);
    
    // Sort by distance
    availableRequests.sort((a, b) => a.distance - b.distance);
  }

  // Format date and time for each request
  availableRequests = availableRequests.map(request => {
    return {
      ...request,
      request_time_formatted: {
        date: formatDisplayDate(request.request_time),
        time: formatTimeString(request.request_time)
      },
      booking_time_formatted: request.booking_time ? {
        date: formatDisplayDate(request.booking_time),
        time: formatTimeString(request.booking_time)
      } : null
    };
  });

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    Count: availableRequests.length,
    Result: availableRequests
  }));
});

/**
 * Get request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestDetails = asyncHandler(async (req, res) => {
  const { request_id, driver_id } = req.query;

  if (!request_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id']);
  }

  // Query request details
  const sql = `
    SELECT 
      s.request_id,
      s.customer_id,
      s.location_from,
      s.location_to,
      s.pickup_lat,
      s.pickup_long,
      s.dropoff_lat,
      s.dropoff_long,
      s.status,
      s.booking_time,
      s.request_time,
      s.customer_message,
      v.vehicletype_name,
      v.vehicletype_id,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name,
      c.phone_number AS customer_phone
    FROM servicerequests s
    JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
    JOIN customers c ON s.customer_id = c.customer_id
    WHERE s.request_id = ?
  `;

  const requests = await db.query(sql, [request_id]);

  if (requests.length === 0) {
    throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
  }

  const request = requests[0];

  // Format dates
  request.request_time_formatted = {
    date: formatDisplayDate(request.request_time),
    time: formatTimeString(request.request_time)
  };
  
  if (request.booking_time) {
    request.booking_time_formatted = {
      date: formatDisplayDate(request.booking_time),
      time: formatTimeString(request.booking_time)
    };
  }

  // If driver_id is provided, check if driver has made an offer for this request
  if (driver_id) {
    const offerSql = `
      SELECT offer_id, offered_price, offer_status, created_at
      FROM driveroffers
      WHERE request_id = ? AND driver_id = ?
    `;
    
    const offers = await db.query(offerSql, [request_id, driver_id]);
    if (offers.length > 0) {
      request.driver_offer = offers[0];
    }
  }

  // Calculate route information if driver_id and their location are provided
  if (driver_id) {
    const driverLocation = await db.query(
      "SELECT current_latitude, current_longitude FROM driverdetails WHERE driver_id = ?",
      [driver_id]
    );
    
    if (driverLocation.length > 0 && driverLocation[0].current_latitude && driverLocation[0].current_longitude) {
      const distance = distanceService.calculateDistance(
        driverLocation[0].current_latitude,
        driverLocation[0].current_longitude,
        request.pickup_lat,
        request.pickup_long
      );
      
      const eta = distanceService.calculateTravelTime(distance);
      
      request.distance_to_pickup = distance;
      request.distance_to_pickup_text = `${distance.toFixed(1)} กม.`;
      request.eta_to_pickup = eta;
      request.eta_to_pickup_text = `${eta} นาที`;
    }
  }

  // Calculate trip distance and estimated price
  const tripDistance = distanceService.calculateDistance(
    request.pickup_lat,
    request.pickup_long,
    request.dropoff_lat,
    request.dropoff_long
  );
  
  const estimatedPrice = distanceService.calculatePriceEstimate(
    tripDistance,
    request.vehicletype_id
  );
  
  request.trip_distance = tripDistance;
  request.trip_distance_text = `${tripDistance.toFixed(1)} กม.`;
  request.estimated_duration = distanceService.calculateTravelTime(tripDistance);
  request.estimated_duration_text = `${request.estimated_duration} นาที`;
  request.price_estimate = estimatedPrice;
  request.price_estimate_text = `฿${estimatedPrice}`;

  // Mask customer phone for privacy
  if (request.customer_phone) {
    request.customer_phone_masked = maskString(request.customer_phone, 3, 3);
  }

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(request));
});

/**
 * Get driver's active requests (accepted but not completed)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveRequests = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['driver_id']);
  }

  const sql = `
    SELECT 
      s.request_id,
      s.customer_id,
      s.location_from,
      s.location_to,
      s.pickup_lat,
      s.pickup_long,
      s.dropoff_lat,
      s.dropoff_long,
      s.status,
      s.booking_time,
      s.request_time,
      s.customer_message,
      o.offer_id,
      o.offered_price,
      v.vehicletype_name,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name,
      c.phone_number AS customer_phone
    FROM servicerequests s
    JOIN driveroffers o ON s.offer_id = o.offer_id
    JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
    JOIN customers c ON s.customer_id = c.customer_id
    WHERE o.driver_id = ? 
    AND s.status = '${REQUEST_STATUS.ACCEPTED}'
    AND o.offer_status = '${OFFER_STATUS.ACCEPTED}'
    ORDER BY s.request_time DESC
  `;

  const requests = await db.query(sql, [driver_id]);

  // Calculate trip distances for each request
  const activeRequests = requests.map(request => {
    const tripDistance = distanceService.calculateDistance(
      request.pickup_lat,
      request.pickup_long,
      request.dropoff_lat,
      request.dropoff_long
    );
    
    // Format dates
    const request_time_formatted = {
      date: formatDisplayDate(request.request_time),
      time: formatTimeString(request.request_time)
    };
    
    const booking_time_formatted = request.booking_time ? {
      date: formatDisplayDate(request.booking_time),
      time: formatTimeString(request.booking_time)
    } : null;
    
    // Mask customer phone
    const customer_phone_masked = request.customer_phone ? 
      maskString(request.customer_phone, 3, 3) : null;
    
    return {
      ...request,
      trip_distance: tripDistance,
      trip_distance_text: `${tripDistance.toFixed(1)} กม.`,
      estimated_duration: distanceService.calculateTravelTime(tripDistance),
      estimated_duration_text: `${distanceService.calculateTravelTime(tripDistance)} นาที`,
      request_time_formatted,
      booking_time_formatted,
      customer_phone_masked
    };
  });

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    Count: activeRequests.length,
    Result: activeRequests
  }));
});

/**
 * Update request status to completed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Complete a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeRequest = asyncHandler(async (req, res) => {
  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id']);
  }

  // Check if the request exists, belongs to the driver through an offer, and is in accepted status
  const checkSql = `
    SELECT r.request_id, r.status, r.customer_id, o.driver_id, o.offer_id, o.offered_price, r.payment_id, 
           r.location_from, r.location_to, v.vehicletype_name,
           r.pickup_lat, r.pickup_long, r.dropoff_lat, r.dropoff_long,
           pm.method_name
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    JOIN payments p ON r.payment_id = p.payment_id
    JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
    WHERE r.request_id = ? AND o.driver_id = ? AND r.status = ?
  `;

  const checkResult = await db.query(checkSql, [request_id, driver_id, REQUEST_STATUS.ACCEPTED]);

  if (checkResult.length === 0) {
    throw new NotFoundError("ไม่พบคำขอบริการที่ต้องการเสร็จสิ้นหรือคำขอไม่ได้มอบหมายให้คนขับนี้");
  }

  const { customer_id, offer_id, offered_price, payment_id, location_from, location_to, 
          vehicletype_name, pickup_lat, pickup_long, dropoff_lat, dropoff_long, 
          method_name } = checkResult[0];
  
  // คำนวณระยะทางและเวลาเดินทาง
  const tripDistance = distanceService.calculateDistance(
    pickup_lat, pickup_long, dropoff_lat, dropoff_long
  );
  const travelTime = distanceService.calculateTravelTime(tripDistance);

  // Start a database transaction
  const connection = await db.beginTransaction();

  try {
    // Update request status
    const updateSql = `
      UPDATE servicerequests 
      SET status = ? 
      WHERE request_id = ?
    `;

    await db.transactionQuery(
      connection,
      updateSql,
      [REQUEST_STATUS.COMPLETED, request_id]
    );

    // Update payment status
    const updatePaymentSql = `
      UPDATE payments
      SET payment_status = ?
      WHERE payment_id = ?
    `;

    await db.transactionQuery(
      connection,
      updatePaymentSql,
      ['Completed', payment_id]
    );

    // Check if receipt already exists to avoid duplicates
    const checkReceiptSql = `
      SELECT receipt_id FROM service_receipts 
      WHERE request_id = ?
    `;
    
    const existingReceipt = await db.transactionQuery(
      connection,
      checkReceiptSql,
      [request_id]
    );
    
    // Only create receipt if it doesn't exist
    if (existingReceipt.length === 0) {
      // เพิ่มการสร้าง service_receipt
      const createReceiptSql = `
        INSERT INTO service_receipts (
          request_id, customer_id, driver_id, payment_id, offer_id,
          pickup_location, dropoff_location, vehicle_type,
          service_price, payment_method, payment_status,
          distance_km, travel_time_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.transactionQuery(
        connection,
        createReceiptSql,
        [
          request_id, customer_id, driver_id, payment_id, offer_id,
          location_from, location_to, vehicletype_name,
          offered_price, method_name, 'Completed',
          tripDistance, travelTime
        ]
      );
    }

    // Commit the transaction
    await db.commitTransaction(connection);

    // Create notification for customer
    try {
      // Fetch customer's push token and send notification
      const notificationText = `บริการของคุณเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ Slideme`;
      
      // Create notification in database
      await notificationService.createNotification({
        user_id: customer_id,
        user_type: 'customer',
        title: 'บริการเสร็จสิ้น',
        message: notificationText,
        type: 'service',
        related_id: request_id
      });
      
      // Send push notification (in background, don't await)
      notificationService.sendPushToCustomer(customer_id, {
        title: 'บริการเสร็จสิ้น',
        body: notificationText,
        data: {
          type: 'service_completed',
          request_id
        }
      }).catch(err => {
        logger.error('Error sending push notification to customer', {
          error: err.message,
          customer_id,
          request_id
        });
      });
    } catch (notificationError) {
      // Log error but don't fail the transaction
      logger.error('Error sending notification to customer', {
        error: notificationError.message,
        customer_id,
        request_id
      });
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        request_id,
        driver_id,
        price: offered_price,
        price_formatted: formatThaiBaht(offered_price),
        status: REQUEST_STATUS.COMPLETED
      }, "เสร็จสิ้นคำขอบริการสำเร็จ")
    );
  } catch (error) {
    await db.rollbackTransaction(connection);
    throw error;
  }
});
  
/**
 * Notify customer of driver arrival
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notifyArrival = asyncHandler(async (req, res) => {
  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id']);
  }

  // Verify the driver is assigned to this request
  const verifyQuery = `
    SELECT s.request_id, s.status, s.customer_id, d.first_name, d.last_name, d.license_plate
    FROM servicerequests s
    JOIN driveroffers o ON s.offer_id = o.offer_id
    JOIN drivers d ON o.driver_id = d.driver_id
    WHERE s.request_id = ? AND o.driver_id = ? AND s.status = '${REQUEST_STATUS.ACCEPTED}'
  `;

  const verification = await db.query(verifyQuery, [request_id, driver_id]);

  if (verification.length === 0) {
    throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
  }

  const requestInfo = verification[0];
  const driverName = `${requestInfo.first_name || ''} ${requestInfo.last_name || ''}`.trim();
  const licensePlate = requestInfo.license_plate;

  // Notify customer via socket if available
  if (socketService) {
    socketService.notifyCustomer(requestInfo.customer_id, 'driverArrived', {
      request_id,
      driver_id,
      driver_name: driverName,
      license_plate: licensePlate
    });
  }

  logger.info('Driver notified arrival', { 
    driver_id, 
    request_id,
    customer_id: requestInfo.customer_id
  });

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, "แจ้งเตือนลูกค้าว่าคนขับมาถึงแล้วเรียบร้อย"));
});

/**
 * Get service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestHistory = asyncHandler(async (req, res) => {
    const { driver_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status; // 'completed', 'cancelled', or all if not specified
  
    if (!driver_id) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['driver_id']);
    }
  
    try {
      // Build query conditions
      let conditions = ["o.driver_id = ?"];
      const params = [driver_id];
  
      if (status) {
        if (status === REQUEST_STATUS.COMPLETED || status === REQUEST_STATUS.CANCELLED) {
          conditions.push("s.status = ?");
          params.push(status);
        } else {
          conditions.push(`s.status IN ('${REQUEST_STATUS.COMPLETED}', '${REQUEST_STATUS.CANCELLED}')`);
        }
      } else {
        conditions.push(`s.status IN ('${REQUEST_STATUS.COMPLETED}', '${REQUEST_STATUS.CANCELLED}')`);
      }
  
      // Build the main query
      let sql = `
        SELECT 
          s.request_id,
          s.location_from,
          s.location_to,
          s.status,
          s.request_time,
          o.offered_price,
          v.vehicletype_name,
          c.first_name AS customer_first_name,
          c.last_name AS customer_last_name,
          sr.receipt_id,
          sr.distance_km,
          sr.travel_time_minutes,
          (SELECT AVG(rating) FROM reviews WHERE request_id = s.request_id AND driver_id = o.driver_id) AS rating
        FROM servicerequests s
        JOIN driveroffers o ON s.offer_id = o.offer_id
        JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
        JOIN customers c ON s.customer_id = c.customer_id
        LEFT JOIN service_receipts sr ON s.request_id = sr.request_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY s.request_time DESC
      `;
        
      // Count total for pagination
      const countSql = `
        SELECT COUNT(*) AS total
        FROM servicerequests s
        JOIN driveroffers o ON s.offer_id = o.offer_id
        WHERE ${conditions.join(" AND ")}
      `;
  
      // Execute count query with parameters
      const countResult = await db.query(countSql, params);
      const total = countResult[0].total;
  
      // Add LIMIT and OFFSET directly to the SQL string instead of as parameters
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
  
      // Execute main query with parameters
      const requests = await db.query(sql, params);
  
      // Format response
      const history = requests.map(request => ({
        ...request,
        rating: request.rating ? parseFloat(request.rating).toFixed(1) : null,
        request_date: formatDisplayDate(request.request_time),
        request_time: formatTimeString(request.request_time)
      }));
  
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
        Result: history,
        Count: history.length,
        Total: total,
        Pagination: {
          limit,
          offset,
          totalPages: Math.ceil(total / limit)
        }
      }));
    } catch (error) {
      logger.error('Error fetching request history', { 
        driver_id,
        status,
        error: error.message 
      });
      
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR)
      );
    }
  });

/**
 * Get customer information for a specific request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCustomerInfo = asyncHandler(async (req, res) => {
  const { request_id, driver_id } = req.query;

  if (!request_id || !driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id']);
  }

  // Verify the driver is assigned to this request
  const sql = `
    SELECT 
      c.customer_id,
      c.first_name,
      c.last_name,
      c.phone_number,
      c.created_at AS member_since,
      (SELECT COUNT(*) FROM servicerequests sr 
       JOIN driveroffers dro ON sr.offer_id = dro.offer_id 
       WHERE sr.customer_id = c.customer_id AND sr.status = '${REQUEST_STATUS.COMPLETED}') AS total_trips,
      (SELECT AVG(rating) FROM reviews WHERE customer_id = c.customer_id) AS average_rating
    FROM servicerequests s
    JOIN customers c ON s.customer_id = c.customer_id
    JOIN driveroffers o ON s.offer_id = o.offer_id
    WHERE s.request_id = ? AND o.driver_id = ?
  `;

  const result = await db.query(sql, [request_id, driver_id]);

  if (result.length === 0) {
    throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
  }

  const customer = result[0];

  // Format data
  if (customer.average_rating) {
    customer.average_rating = parseFloat(customer.average_rating).toFixed(1);
  } else {
    customer.average_rating = "0.0";
  }

  if (customer.member_since) {
    customer.member_since_formatted = formatDisplayDate(customer.member_since);
  }

  // Mask phone number for privacy
  if (customer.phone_number) {
    customer.phone_number_masked = maskString(customer.phone_number, 3, 3);
  }

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(customer));
});


/**
 * Update service request status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateServiceStatus = asyncHandler(async (req, res) => {
  const { request_id, driver_id, status } = req.body;

  // Validate input
  if (!request_id || !driver_id || !status) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id', 'status']);
  }

  // Valid status values
  const validStatuses = ['accepted', 'pickup_in_progress' , 'delivery_in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('สถานะไม่ถูกต้อง', [`สถานะต้องเป็นหนึ่งใน: ${validStatuses.join(', ')}`]);
  }

  try {
    const db = (await import('../../config/db.js')).default;
    
    // Check if the request exists and belongs to this driver (via offer)
    const requestExists = await db.query(
      `SELECT sr.request_id, sr.status, do.driver_id
       FROM servicerequests sr
       LEFT JOIN driveroffers do ON sr.offer_id = do.offer_id
       WHERE sr.request_id = ? AND do.driver_id = ?`,
      [request_id, driver_id]
    );

    if (requestExists.length === 0) {
      throw new NotFoundError('ไม่พบข้อมูลการร้องขอบริการนี้ หรือไม่มีสิทธิ์ในการอัปเดตข้อมูล');
    }

    // Update the status
    await db.query(
      `UPDATE servicerequests 
       SET status = ?, 
           updated_at = NOW() 
       WHERE request_id = ?`,
      [status, request_id]
    );

    logger.info(`Service request status updated to ${status}`, { 
      request_id,
      driver_id,
      status
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      request_id,
      status
    }, 'อัปเดตสถานะการให้บริการสำเร็จ'));
  } catch (error) {
    logger.error('Error updating service request status', { 
      request_id,
      driver_id,
      status,
      error: error.message 
    });
    
    throw new CustomError('เกิดข้อผิดพลาดในการอัปเดตสถานะ', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

export default {
  getAvailableRequests,
  getRequestDetails,
  getActiveRequests,
  completeRequest,
  notifyArrival,
  getRequestHistory,
  getCustomerInfo,
  updateServiceStatus
};