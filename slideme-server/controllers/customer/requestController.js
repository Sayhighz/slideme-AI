/**
 * Customer request controller
 * Handles service request management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { REQUEST_STATUS, OFFER_STATUS, PAYMENT_STATUS } from '../../utils/constants/requestStatus.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { validateCreateRequest } from '../../utils/validators/requestValidator.js';
import { formatDisplayDate, formatTimeString } from '../../utils/formatters/dateFormatter.js';
import { formatThaiBaht } from '../../utils/formatters/currencyFormatter.js';
import { ValidationError, NotFoundError } from '../../utils/errors/customErrors.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import distanceService from '../../services/location/distanceService.js';
import mapService from '../../services/location/mapService.js';
import emailService from '../../services/communication/emailService.js';
import smsService from '../../services/communication/smsService.js';
import pushNotificationService from '../../services/communication/pushNotificationService.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Create a new service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRequest = asyncHandler(async (req, res) => {
  // Extract request data
  const {
    customer_id,
    pickup_lat,
    pickup_long,
    location_from,
    dropoff_lat,
    dropoff_long,
    location_to,
    vehicletype_id,
    booking_time,
    customer_message
  } = req.body;

  // Validate request data
  const validation = validateCreateRequest(req.body);
  if (!validation.isValid) {
    throw new ValidationError(
      ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
      validation.errors
    );
  }

  // Calculate trip distance and estimated price
  const tripDistance = distanceService.calculateDistance(
    pickup_lat,
    pickup_long,
    dropoff_lat,
    dropoff_long
  );
  
  const estimatedDuration = distanceService.calculateTravelTime(tripDistance);

  // Start a database transaction
  const connection = await db.beginTransaction();

  try {
    // Insert request into database
    const sql = `
      INSERT INTO servicerequests (
        customer_id,
        pickup_lat,
        pickup_long,
        location_from,
        dropoff_lat,
        dropoff_long,
        location_to,
        vehicletype_id,
        booking_time,
        customer_message,
        status,
        request_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      customer_id,
      pickup_lat,
      pickup_long,
      location_from,
      dropoff_lat,
      dropoff_long,
      location_to,
      vehicletype_id,
      booking_time || null,
      customer_message || null,
      REQUEST_STATUS.PENDING
    ];

    const result = await db.transactionQuery(connection, sql, values);
    const request_id = result.insertId;

    // Get customer information for notifications
    const customerQuery = `
      SELECT email, phone_number, first_name, last_name
      FROM customers
      WHERE customer_id = ?
    `;
    
    const customers = await db.transactionQuery(connection, customerQuery, [customer_id]);
    const customer = customers[0];

    // Get vehicle type name
    const vehicleQuery = `
      SELECT vehicletype_name
      FROM vehicle_types
      WHERE vehicletype_id = ?
    `;
    
    const vehicleTypes = await db.transactionQuery(connection, vehicleQuery, [vehicletype_id]);
    const vehicleType = vehicleTypes[0];

    // Commit the transaction
    await db.commitTransaction(connection);

    // Get the newly created request details
    const getRequestSql = `
      SELECT 
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
        v.vehicletype_name
      FROM servicerequests r
      LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      WHERE r.request_id = ?
    `;

    const requests = await db.query(getRequestSql, [request_id]);
    
    if (requests.length === 0) {
      throw new NotFoundError("ไม่พบข้อมูลคำขอบริการหลังจากสร้าง");
    }

    const request = requests[0];
    
    // Format response data
    const formattedRequest = {
      ...request,
      trip_distance: tripDistance,
      trip_distance_text: `${tripDistance.toFixed(1)} กม.`,
      estimated_duration: estimatedDuration,
      estimated_duration_text: `${estimatedDuration} นาที`,
      request_time_formatted: formatDisplayDate(request.request_time),
      request_time_display: formatTimeString(request.request_time)
    };

    // Send confirmation notifications (these would be async in a real application)
    try {
      // Find nearby drivers and notify them about the new request
      const nearbyDrivers = await mapService.findNearbyDrivers(
        pickup_lat, 
        pickup_long, 
        10, // 10km radius
        vehicletype_id
      );
      
      if (nearbyDrivers.length > 0) {
        const driverIds = nearbyDrivers.map(driver => driver.driver_id);
        // Notify drivers
        if (pushNotificationService) {
          pushNotificationService.notifyDriversOfNewRequest(driverIds, request_id);
        }
        
        // Notify via socket if available
        if (socketService) {
          socketService.notifyAllDrivers('newRequest', {
            request_id,
            location_from,
            location_to,
            vehicletype_name: vehicleType.vehicletype_name
          });
        }
      }
      
      // Send confirmation SMS and email to customer
      if (customer.phone_number) {
        smsService.sendRequestConfirmationSMS(customer.phone_number, request_id);
      }
      
      if (customer.email) {
        emailService.sendRequestConfirmationEmail(request, customer);
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the request creation
      logger.error('Error sending request notifications', { 
        request_id, 
        error: notificationError.message 
      });
    }

    return res.status(STATUS_CODES.CREATED).json(
      formatSuccessResponse(formattedRequest, "สร้างคำขอบริการสำเร็จ")
    );
  } catch (error) {
    await db.rollbackTransaction(connection);
    throw error;
  }
});

/**
 * Get service request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestDetails = asyncHandler(async (req, res) => {
  const { request_id } = req.query;

  if (!request_id) {
    throw new ValidationError("กรุณาระบุ request_id");
  }

  const sql = `
    SELECT 
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
      o.offer_id,
      o.driver_id,
      o.offered_price,
      d.first_name AS driver_first_name,
      d.last_name AS driver_last_name,
      d.phone_number AS driver_phone,
      d.license_plate,
      dd.current_latitude AS driver_current_lat,
      dd.current_longitude AS driver_current_lng
    FROM servicerequests r
    LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
    LEFT JOIN drivers d ON o.driver_id = d.driver_id
    LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
    WHERE r.request_id = ?
  `;

  const result = await db.query(sql, [request_id]);

  if (result.length === 0) {
    throw new NotFoundError("ไม่พบข้อมูลคำขอบริการ");
  }

  const request = result[0];
  
  // Calculate distance and duration
  const tripDistance = distanceService.calculateDistance(
    request.pickup_lat,
    request.pickup_long,
    request.dropoff_lat,
    request.dropoff_long
  );
  
  const estimatedDuration = distanceService.calculateTravelTime(tripDistance);
  
  // Format response data
  const formattedRequest = {
    ...request,
    trip_distance: tripDistance,
    trip_distance_text: `${tripDistance.toFixed(1)} กม.`,
    estimated_duration: estimatedDuration,
    estimated_duration_text: `${estimatedDuration} นาที`,
    request_time_formatted: formatDisplayDate(request.request_time),
    request_time_display: formatTimeString(request.request_time)
  };
  
  // Add driver ETA if driver location is available
  if (request.driver_current_lat && request.driver_current_lng) {
    const distanceToPickup = distanceService.calculateDistance(
      request.driver_current_lat,
      request.driver_current_lng,
      request.pickup_lat,
      request.pickup_long
    );
    
    const etaToPickup = distanceService.calculateTravelTime(distanceToPickup);
    
    formattedRequest.distance_to_pickup = distanceToPickup;
    formattedRequest.distance_to_pickup_text = `${distanceToPickup.toFixed(1)} กม.`;
    formattedRequest.eta_to_pickup = etaToPickup;
    formattedRequest.eta_to_pickup_text = `${etaToPickup} นาที`;
  }

  // If offered price exists, format it
  if (formattedRequest.offered_price) {
    formattedRequest.offered_price_formatted = formatThaiBaht(formattedRequest.offered_price);
  }

  return res.status(STATUS_CODES.OK).json(
    formatSuccessResponse(formattedRequest, "ดึงข้อมูลคำขอบริการสำเร็จ")
  );
});

/**
 * Get customer's service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get customer's service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get customer's service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestHistory = asyncHandler(async (req, res) => {
    const { customer_id, status } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
  
    if (!customer_id) {
      throw new ValidationError("กรุณาระบุ customer_id");
    }
  
    try {
      // Build SQL query with status filter if provided
      let sqlQuery = `
        SELECT 
          r.request_id,
          r.status,
          r.location_from,
          r.location_to,
          r.request_time,
          r.booking_time,
          v.vehicletype_name,
          o.offered_price,
          d.first_name AS driver_first_name,
          d.last_name AS driver_last_name,
          d.license_plate,
          (SELECT rating FROM reviews WHERE request_id = r.request_id) AS rating,
          sr.receipt_id,
          sr.distance_km,
          sr.travel_time_minutes
        FROM servicerequests r
        LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
        LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
        LEFT JOIN drivers d ON o.driver_id = d.driver_id
        LEFT JOIN service_receipts sr ON r.request_id = sr.request_id
        WHERE r.customer_id = ?
      `;
  
      const queryParams = [customer_id];
  
      // Add status filter if provided
      if (status) {
        if (!Object.values(REQUEST_STATUS).includes(status)) {
          throw new ValidationError("สถานะไม่ถูกต้อง");
        }
        
        sqlQuery += " AND r.status = ?";
        queryParams.push(status);
      }
  
      // Order by most recent
      sqlQuery += " ORDER BY r.request_time DESC";
  
      // Get total count for pagination
      let countSql = `
        SELECT COUNT(*) AS total 
        FROM servicerequests 
        WHERE customer_id = ?
      `;
      
      const countParams = [customer_id];
      
      if (status) {
        countSql += " AND status = ?";
        countParams.push(status);
      }
      
      const countResult = await db.query(countSql, countParams);
      const total = countResult[0].total;
  
      // Add pagination to the main query manually to avoid parameter issues
      sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;
  
      const result = await db.query(sqlQuery, queryParams);
  
      // Format the result
      const formattedRequests = result.map(request => ({
        ...request,
        request_date: formatDisplayDate(request.request_time),
        request_time: formatTimeString(request.request_time),
        offered_price_formatted: request.offered_price ? formatThaiBaht(request.offered_price) : null,
        driver_name: request.driver_first_name ? 
          `${request.driver_first_name} ${request.driver_last_name || ''}`.trim() : null,
        rating: request.rating ? parseFloat(request.rating).toFixed(1) : null
      }));
  
      return res.status(STATUS_CODES.OK).json(
        formatSuccessResponse({
          total,
          count: formattedRequests.length,
          requests: formattedRequests,
          pagination: {
            limit,
            offset,
            total_pages: limit ? Math.ceil(total / limit) : 1
          }
        }, "ดึงประวัติคำขอบริการสำเร็จ")
      );
    } catch (error) {
      logger.error('Error fetching request history', { 
        customer_id, 
        status,
        error: error.message 
      });
      
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR)
      );
    }
  });

  
/**
 * Get customer's active request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveRequest = asyncHandler(async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    throw new ValidationError("กรุณาระบุ customer_id");
  }

  const sql = `
    SELECT 
      r.request_id,
      r.status,
      r.location_from,
      r.location_to,
      r.pickup_lat,
      r.pickup_long,
      r.dropoff_lat,
      r.dropoff_long,
      r.request_time,
      r.booking_time,
      r.customer_message,
      v.vehicletype_name,
      o.offer_id,
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
    LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
    LEFT JOIN drivers d ON o.driver_id = d.driver_id
    LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
    WHERE r.customer_id = ? AND r.status IN ('pending', 'accepted')
    ORDER BY FIELD(r.status, 'accepted', 'pending'), r.request_time DESC
    LIMIT 1
  `;

  const result = await db.query(sql, [customer_id]);

  if (result.length === 0) {
    return res.status(STATUS_CODES.NOT_FOUND).json(
      formatErrorResponse("ไม่พบคำขอบริการที่กำลังดำเนินการ")
    );
  }

  const request = result[0];
  
  // Calculate distance, duration, and ETA
  const tripDistance = distanceService.calculateDistance(
    request.pickup_lat,
    request.pickup_long,
    request.dropoff_lat,
    request.dropoff_long
  );
  
  const estimatedDuration = distanceService.calculateTravelTime(tripDistance);
  
  // Format response data
  const formattedRequest = {
    ...request,
    trip_distance: tripDistance,
    trip_distance_text: `${tripDistance.toFixed(1)} กม.`,
    estimated_duration: estimatedDuration,
    estimated_duration_text: `${estimatedDuration} นาที`,
    request_time_formatted: formatDisplayDate(request.request_time),
    request_time_display: formatTimeString(request.request_time),
    offered_price_formatted: request.offered_price ? formatThaiBaht(request.offered_price) : null,
    driver_name: request.driver_first_name ? 
      `${request.driver_first_name} ${request.driver_last_name || ''}`.trim() : null
  };
  
  // Add driver ETA if driver location is available
  if (request.driver_current_lat && request.driver_current_lng) {
    const distanceToPickup = distanceService.calculateDistance(
      request.driver_current_lat,
      request.driver_current_lng,
      request.pickup_lat,
      request.pickup_long
    );
    
    const etaToPickup = distanceService.calculateTravelTime(distanceToPickup);
    
    formattedRequest.distance_to_pickup = distanceToPickup;
    formattedRequest.distance_to_pickup_text = `${distanceToPickup.toFixed(1)} กม.`;
    formattedRequest.eta_to_pickup = etaToPickup;
    formattedRequest.eta_to_pickup_text = `${etaToPickup} นาที`;
  }

  return res.status(STATUS_CODES.OK).json(
    formatSuccessResponse(formattedRequest, "ดึงข้อมูลคำขอบริการที่กำลังดำเนินการสำเร็จ")
  );
});

/**
 * Cancel a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const cancelRequest = asyncHandler(async (req, res) => {
  const { request_id, customer_id } = req.body;

  if (!request_id || !customer_id) {
    throw new ValidationError("กรุณาระบุ request_id และ customer_id");
  }

  // Start a database transaction
  const connection = await db.beginTransaction();

  try {
    // First, check if the request exists and belongs to the customer
    const checkSql = `
      SELECT status, driver_id 
      FROM servicerequests s
      LEFT JOIN driveroffers o ON s.offer_id = o.offer_id
      WHERE s.request_id = ? AND s.customer_id = ?
    `;

    const checkResult = await db.transactionQuery(connection, checkSql, [request_id, customer_id]);

    if (checkResult.length === 0) {
      throw new NotFoundError("ไม่พบคำขอบริการที่ต้องการยกเลิก");
    }

    const currentStatus = checkResult[0].status;
    const driver_id = checkResult[0].driver_id;

    // Check if the request can be canceled (only pending or accepted)
    if (currentStatus !== REQUEST_STATUS.PENDING && currentStatus !== REQUEST_STATUS.ACCEPTED) {
      throw new ValidationError(`ไม่สามารถยกเลิกคำขอบริการที่มีสถานะ ${currentStatus}`);
    }

    // Cancel the request
    const updateRequestSql = `
      UPDATE servicerequests 
      SET status = ? 
      WHERE request_id = ? AND customer_id = ?
    `;

    await db.transactionQuery(
      connection, 
      updateRequestSql, 
      [REQUEST_STATUS.CANCELLED, request_id, customer_id]
    );

    // Update offer statuses to rejected
    const updateOffersSql = `
      UPDATE driveroffers 
      SET offer_status = ? 
      WHERE request_id = ? AND offer_status = ?
    `;

    await db.transactionQuery(
      connection, 
      updateOffersSql, 
      [OFFER_STATUS.REJECTED, request_id, OFFER_STATUS.PENDING]
    );

    // Commit the transaction
    await db.commitTransaction(connection);

    // Notify driver via socket or push notification if assigned
    if (driver_id && currentStatus === REQUEST_STATUS.ACCEPTED) {
      try {
        // Notify driver via socket if available
        if (socketService) {
          socketService.notifyDriver(driver_id, 'requestCancelled', {
            request_id,
            status: REQUEST_STATUS.CANCELLED
          });
        }
        
        // Send push notification
        pushNotificationService.sendUserNotification(
          'driver',
          driver_id,
          {
            title: "คำขอบริการถูกยกเลิก",
            body: "ลูกค้าได้ยกเลิกคำขอบริการ"
          },
          {
            request_id: request_id.toString(),
            type: 'request_cancelled'
          }
        );
      } catch (notificationError) {
        // Log but don't fail if notification fails
        logger.error('Error sending cancellation notification', { 
          error: notificationError.message 
        });
      }
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        request_id,
        previous_status: currentStatus,
        status: REQUEST_STATUS.CANCELLED
      }, "ยกเลิกคำขอบริการสำเร็จ")
    );
  } catch (error) {
    await db.rollbackTransaction(connection);
    throw error;
  }
});

/**
 * Get driver offers for a request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverOffers = asyncHandler(async (req, res) => {
  const { request_id, customer_id } = req.query;

  if (!request_id || !customer_id) {
    throw new ValidationError("กรุณาระบุ request_id และ customer_id");
  }

  // First verify that the request belongs to the customer
  const checkSql = `
    SELECT request_id 
    FROM servicerequests 
    WHERE request_id = ? AND customer_id = ?
  `;

  const checkResult = await db.query(checkSql, [request_id, customer_id]);

  if (checkResult.length === 0) {
    throw new NotFoundError("ไม่พบคำขอบริการหรือคำขอบริการไม่ได้เป็นของลูกค้า");
  }

  // Get driver offers
  const offersSql = `
    SELECT 
      o.offer_id,
      o.driver_id,
      o.offered_price,
      o.offer_status,
      o.created_at,
      d.first_name,
      d.last_name,
      d.license_plate,
      dd.current_latitude,
      dd.current_longitude,
      (SELECT AVG(rating) FROM reviews WHERE driver_id = d.driver_id) AS average_rating,
      (SELECT COUNT(*) FROM reviews WHERE driver_id = d.driver_id) AS total_reviews
    FROM driveroffers o
    JOIN drivers d ON o.driver_id = d.driver_id
    LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
    WHERE o.request_id = ? AND o.offer_status = ?
    ORDER BY o.offered_price ASC
  `;

  const offers = await db.query(offersSql, [request_id, OFFER_STATUS.PENDING]);

  // Format the response data
  const formattedOffers = offers.map(offer => ({
    ...offer,
    driver_name: `${offer.first_name || ''} ${offer.last_name || ''}`.trim(),
    price_formatted: formatThaiBaht(offer.offered_price),
    average_rating: offer.average_rating ? parseFloat(offer.average_rating).toFixed(1) : null,
    created_at_formatted: formatDisplayDate(offer.created_at),
    created_time: formatTimeString(offer.created_at)
  }));

  // Calculate distance from each driver to pickup
  const requestDetailsSql = `
    SELECT pickup_lat, pickup_long
    FROM servicerequests
    WHERE request_id = ?
  `;
  
  const requestDetails = await db.query(requestDetailsSql, [request_id]);
  
  if (requestDetails.length > 0 && requestDetails[0].pickup_lat && requestDetails[0].pickup_long) {
    const { pickup_lat, pickup_long } = requestDetails[0];
    
    formattedOffers.forEach(offer => {
      if (offer.current_latitude && offer.current_longitude) {
        const distance = distanceService.calculateDistance(
          offer.current_latitude,
          offer.current_longitude,
          pickup_lat,
          pickup_long
        );
        
        const eta = distanceService.calculateTravelTime(distance);
        
        offer.distance_to_pickup = distance;
        offer.distance_to_pickup_text = `${distance.toFixed(1)} กม.`;
        offer.eta_to_pickup = eta;
        offer.eta_to_pickup_text = `${eta} นาที`;
      }
    });
  }

  return res.status(STATUS_CODES.OK).json(
    formatSuccessResponse({
      request_id,
      offers_count: formattedOffers.length,
      offers: formattedOffers
    }, "ดึงข้อมูลข้อเสนอจากคนขับสำเร็จ")
  );
});

/**
 * Accept a driver's offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const acceptOffer = asyncHandler(async (req, res) => {
  const { request_id, customer_id, offer_id, payment_method_id } = req.body;

  if (!request_id || !customer_id || !offer_id || !payment_method_id) {
    throw new ValidationError("กรุณาระบุข้อมูลให้ครบถ้วน");
  }

  // Start a database transaction
  const connection = await db.beginTransaction();

  try {
    // First, check if the request belongs to the customer and is in pending status
    const checkRequestSql = `
      SELECT status 
      FROM servicerequests 
      WHERE request_id = ? AND customer_id = ? AND status = ?
    `;

    const checkResult = await db.transactionQuery(
      connection, 
      checkRequestSql, 
      [request_id, customer_id, REQUEST_STATUS.PENDING]
    );

    if (checkResult.length === 0) {
      throw new NotFoundError("ไม่พบคำขอบริการหรือคำขอบริการไม่อยู่ในสถานะรอตอบรับ");
    }

    // Check if the offer exists and is in pending status
    const checkOfferSql = `
      SELECT do.driver_id, do.offered_price 
      FROM driveroffers do
      WHERE do.offer_id = ? AND do.request_id = ? AND do.offer_status = ?
    `;

    const offerResult = await db.transactionQuery(
      connection, 
      checkOfferSql, 
      [offer_id, request_id, OFFER_STATUS.PENDING]
    );

    if (offerResult.length === 0) {
      throw new NotFoundError("ไม่พบข้อเสนอหรือข้อเสนอไม่อยู่ในสถานะรอตอบรับ");
    }

    const { driver_id, offered_price } = offerResult[0];

    // Create payment record
    const createPaymentSql = `
      INSERT INTO payments (
        customer_id, 
        amount, 
        payment_status, 
        payment_method_id, 
        created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const paymentResult = await db.transactionQuery(
      connection, 
      createPaymentSql, 
      [customer_id, offered_price, PAYMENT_STATUS.PENDING, payment_method_id]
    );

    const payment_id = paymentResult.insertId;

    // Update request status and set offer_id and payment_id
    const updateRequestSql = `
      UPDATE servicerequests 
      SET 
        status = ?, 
        offer_id = ?,
        payment_id = ?
      WHERE request_id = ? AND customer_id = ?
    `;

    await db.transactionQuery(
      connection, 
      updateRequestSql, 
      [REQUEST_STATUS.ACCEPTED, offer_id, payment_id, request_id, customer_id]
    );

    // Accept the selected offer
    const acceptOfferSql = `
      UPDATE driveroffers 
      SET offer_status = ? 
      WHERE offer_id = ?
    `;

    await db.transactionQuery(
      connection, 
      acceptOfferSql, 
      [OFFER_STATUS.ACCEPTED, offer_id]
    );

    // Reject all other offers
    const rejectOthersSql = `
      UPDATE driveroffers 
      SET offer_status = ? 
      WHERE request_id = ? AND offer_id != ?
    `;

    await db.transactionQuery(
      connection, 
      rejectOthersSql, 
      [OFFER_STATUS.REJECTED, request_id, offer_id]
    );

    // Commit the transaction
    await db.commitTransaction(connection);

    // Notify driver about accepted offer
    try {
      // Via socket if available
      if (socketService) {
        socketService.notifyDriver(driver_id, 'offerAccepted', {
          request_id,
          offer_id,
          customer_id
        });
      }
      
      // Send push notification
      pushNotificationService.notifyCustomerOfAcceptedOffer(
        customer_id,
        request_id,
        driver_id
      );
      
      // Get driver details for SMS notification
      const driverQuery = `
        SELECT first_name, last_name, phone_number 
        FROM drivers 
        WHERE driver_id = ?
      `;
      
      const drivers = await db.query(driverQuery, [driver_id]);
      
      if (drivers.length > 0) {
        const driver = drivers[0];
        
        // Get customer phone number
        const customerQuery = `
          SELECT phone_number 
          FROM customers 
          WHERE customer_id = ?
        `;
        
        const customers = await db.query(customerQuery, [customer_id]);
        
        if (customers.length > 0 && customers[0].phone_number) {
          // Send SMS notification
          smsService.sendDriverArrivalSMS(
            customers[0].phone_number,
            `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
            driver.license_plate || 'N/A'
          );
        }
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the operation
      logger.error('Error sending offer acceptance notification', { 
        error: notificationError.message 
      });
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        request_id,
        offer_id,
        driver_id,
        payment_id,
        price: offered_price,
        price_formatted: formatThaiBaht(offered_price),
        status: REQUEST_STATUS.ACCEPTED
      }, "ตอบรับข้อเสนอสำเร็จ")
    );
  } catch (error) {
    await db.rollbackTransaction(connection);
    throw error;
  }
});

/**
 * Complete a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeRequest = asyncHandler(async (req, res) => {
    const { request_id, customer_id } = req.body;
  
    if (!request_id || !customer_id) {
      throw new ValidationError("กรุณาระบุ request_id และ customer_id");
    }
  
    // Check if the request exists, belongs to the customer, and is in accepted status
    const checkSql = `
      SELECT r.request_id, r.status, o.driver_id, o.offered_price, r.payment_id, 
             r.location_from, r.location_to, v.vehicletype_name,
             r.pickup_lat, r.pickup_long, r.dropoff_lat, r.dropoff_long,
             pm.method_name
      FROM servicerequests r
      JOIN driveroffers o ON r.offer_id = o.offer_id
      JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      JOIN payments p ON r.payment_id = p.payment_id
      JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
      WHERE r.request_id = ? AND r.customer_id = ? AND r.status = ?
    `;
  
    const checkResult = await db.query(checkSql, [request_id, customer_id, REQUEST_STATUS.ACCEPTED]);
  
    if (checkResult.length === 0) {
      throw new NotFoundError("ไม่พบคำขอบริการที่ต้องการเสร็จสิ้น");
    }
  
    const { driver_id, offered_price, payment_id, location_from, location_to, 
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
        WHERE request_id = ? AND customer_id = ?
      `;
  
      await db.transactionQuery(
        connection,
        updateSql,
        [REQUEST_STATUS.COMPLETED, request_id, customer_id]
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
        [PAYMENT_STATUS.COMPLETED, payment_id]
      );
  
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
          request_id, customer_id, driver_id, payment_id, checkResult[0].offer_id,
          location_from, location_to, vehicletype_name,
          offered_price, method_name, PAYMENT_STATUS.COMPLETED,
          tripDistance, travelTime
        ]
      );
  
      // Commit the transaction
      await db.commitTransaction(connection);
  
      // Notify driver about completed service
      // ...existing notification code...
  
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

export default {
  createRequest,
  getRequestDetails,
  getRequestHistory,
  getActiveRequest,
  cancelRequest,
  getDriverOffers,
  acceptOffer,
  completeRequest
};