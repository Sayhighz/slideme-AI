/**
 * Driver request controller
 * Handles driver service request management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError } from '../../utils/errors/customErrors.js';
import distanceService from '../../services/location/distanceService.js';
import mapService from '../../services/location/mapService.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Get available service requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAvailableRequests = async (req, res) => {
  try {
    const { driver_id, vehicletype_id, latitude, longitude, radius } = req.query;

    // Basic validation
    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
    }

    // Check if driver is approved
    const driverStatus = await db.query(
      "SELECT approval_status, vehicletype_id FROM drivers WHERE driver_id = ?",
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

    // Build query conditions
    let conditions = ["s.status = 'pending'"];
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

    return res.status(200).json({
      Status: true,
      Count: availableRequests.length,
      Result: availableRequests
    });
  } catch (error) {
    logger.error('Error fetching available requests', { 
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
 * Get request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestDetails = async (req, res) => {
  try {
    const { request_id, driver_id } = req.query;

    if (!request_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ request_id"
      });
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
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบคำขอบริการ"
      });
    }

    const request = requests[0];

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

    return res.status(200).json({
      Status: true,
      Result: request
    });
  } catch (error) {
    logger.error('Error fetching request details', { 
      request_id: req.query.request_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Get driver's active requests (accepted but not completed)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveRequests = async (req, res) => {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
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
      AND s.status = 'accepted'
      AND o.offer_status = 'accepted'
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
      
      return {
        ...request,
        trip_distance: tripDistance,
        trip_distance_text: `${tripDistance.toFixed(1)} กม.`,
        estimated_duration: distanceService.calculateTravelTime(tripDistance),
      };
    });

    return res.status(200).json({
      Status: true,
      Count: activeRequests.length,
      Result: activeRequests
    });
  } catch (error) {
    logger.error('Error fetching active requests', { 
      driver_id: req.params.driver_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Update request status to completed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeRequest = async (req, res) => {
  try {
    const { request_id, driver_id } = req.body;

    if (!request_id || !driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ request_id และ driver_id"
      });
    }

    // Verify the driver is assigned to this request
    const verifyQuery = `
      SELECT s.request_id, s.status, s.customer_id
      FROM servicerequests s
      JOIN driveroffers o ON s.offer_id = o.offer_id
      WHERE s.request_id = ? AND o.driver_id = ? AND s.status = 'accepted'
    `;

    const verification = await db.query(verifyQuery, [request_id, driver_id]);

    if (verification.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบคำขอบริการที่กำลังดำเนินการ หรือคนขับไม่ได้รับมอบหมายให้ดำเนินการคำขอนี้"
      });
    }

    const customer_id = verification[0].customer_id;

    // Start transaction
    const connection = await db.beginTransaction();
    
    try {
      // Update request status
      const updateSql = `
        UPDATE servicerequests
        SET status = 'completed'
        WHERE request_id = ?
      `;

      await db.transactionQuery(connection, updateSql, [request_id]);

      // Add to driver logs if not exists
      const logCheckSql = `
        SELECT log_id FROM driverlogs
        WHERE request_id = ? AND driver_id = ?
      `;

      const logCheck = await db.transactionQuery(connection, logCheckSql, [request_id, driver_id]);

      if (logCheck.length === 0) {
        const createLogSql = `
          INSERT INTO driverlogs (request_id, driver_id, created_at)
          VALUES (?, ?, NOW())
        `;

        await db.transactionQuery(connection, createLogSql, [request_id, driver_id]);
      }

      // Commit transaction
      await db.commitTransaction(connection);

      // Notify customer via socket if available
      if (socketService) {
        socketService.notifyCustomer(customer_id, 'requestCompleted', {
          request_id,
          driver_id,
          status: 'completed'
        });
      }

      logger.info('Driver completed request', { driver_id, request_id });

      return res.status(200).json({
        Status: true,
        Message: "เสร็จสิ้นการให้บริการเรียบร้อย",
        request_id
      });
    } catch (error) {
      // Rollback transaction on error
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error completing request', { 
      request_id: req.body.request_id,
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
 * Notify customer of driver arrival
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notifyArrival = async (req, res) => {
  try {
    const { request_id, driver_id } = req.body;

    if (!request_id || !driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ request_id และ driver_id"
      });
    }

    // Verify the driver is assigned to this request
    const verifyQuery = `
      SELECT s.request_id, s.status, s.customer_id, d.first_name, d.last_name, d.license_plate
      FROM servicerequests s
      JOIN driveroffers o ON s.offer_id = o.offer_id
      JOIN drivers d ON o.driver_id = d.driver_id
      WHERE s.request_id = ? AND o.driver_id = ? AND s.status = 'accepted'
    `;

    const verification = await db.query(verifyQuery, [request_id, driver_id]);

    if (verification.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบคำขอบริการที่กำลังดำเนินการ หรือคนขับไม่ได้รับมอบหมายให้ดำเนินการคำขอนี้"
      });
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

    return res.status(200).json({
      Status: true,
      Message: "แจ้งเตือนลูกค้าว่าคนขับมาถึงแล้วเรียบร้อย"
    });
  } catch (error) {
    logger.error('Error notifying arrival', { 
      request_id: req.body.request_id,
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
 * Get service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestHistory = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status; // 'completed', 'cancelled', or all if not specified

    if (!driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ driver_id"
      });
    }

    // Build query conditions
    let conditions = ["o.driver_id = ?"];
    const params = [driver_id];

    if (status) {
      if (status === 'completed' || status === 'cancelled') {
        conditions.push("s.status = ?");
        params.push(status);
      } else {
        conditions.push("s.status IN ('completed', 'cancelled')");
      }
    } else {
      conditions.push("s.status IN ('completed', 'cancelled')");
    }

    // Add pagination parameters
    params.push(limit, offset);

    const sql = `
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
        (SELECT AVG(rating) FROM reviews WHERE request_id = s.request_id AND driver_id = o.driver_id) AS rating
      FROM servicerequests s
      JOIN driveroffers o ON s.offer_id = o.offer_id
      JOIN vehicle_types v ON s.vehicletype_id = v.vehicletype_id
      JOIN customers c ON s.customer_id = c.customer_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.request_time DESC
      LIMIT ? OFFSET ?
    `;

    // Count total for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM servicerequests s
      JOIN driveroffers o ON s.offer_id = o.offer_id
      WHERE ${conditions.join(" AND ")}
    `;

    // Remove pagination parameters for count
    const countParams = params.slice(0, -2);

    const [requests, countResult] = await Promise.all([
      db.query(sql, params),
      db.query(countSql, countParams)
    ]);

    // Format response
    const history = requests.map(request => ({
      ...request,
      rating: request.rating ? parseFloat(request.rating).toFixed(1) : null,
      request_date: new Date(request.request_time).toLocaleDateString('th-TH'),
      request_time: new Date(request.request_time).toLocaleTimeString('th-TH')
    }));

    return res.status(200).json({
      Status: true,
      Count: history.length,
      Total: countResult[0].total,
      Result: history,
      Pagination: {
        limit,
        offset,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching request history', { 
      driver_id: req.params.driver_id,
      error: error.message 
    });
    
    return res.status(500).json({
      Status: false,
      Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/**
 * Get customer information for a specific request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCustomerInfo = async (req, res) => {
  try {
    const { request_id, driver_id } = req.query;

    if (!request_id || !driver_id) {
      return res.status(400).json({
        Status: false,
        Error: "กรุณาระบุ request_id และ driver_id"
      });
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
         WHERE sr.customer_id = c.customer_id AND sr.status = 'completed') AS total_trips,
        (SELECT AVG(rating) FROM reviews WHERE customer_id = c.customer_id) AS average_rating
      FROM servicerequests s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN driveroffers o ON s.offer_id = o.offer_id
      WHERE s.request_id = ? AND o.driver_id = ?
    `;

    const result = await db.query(sql, [request_id, driver_id]);

    if (result.length === 0) {
      return res.status(404).json({
        Status: false,
        Error: "ไม่พบข้อมูลลูกค้า หรือคนขับไม่ได้รับมอบหมายให้ดำเนินการคำขอนี้"
      });
    }

    const customer = result[0];

    // Format data
    if (customer.average_rating) {
      customer.average_rating = parseFloat(customer.average_rating).toFixed(1);
    } else {
      customer.average_rating = "0.0";
    }

    if (customer.member_since) {
      customer.member_since_formatted = new Date(customer.member_since)
        .toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
    }

    // Mask phone number for privacy
    if (customer.phone_number) {
      customer.phone_number_masked = maskPhone(customer.phone_number);
    }

    return res.status(200).json({
      Status: true,
      Result: customer
    });
  } catch (error) {
    logger.error('Error fetching customer info', { 
      request_id: req.query.request_id,
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
 * Helper function to mask phone number
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone number
 */
function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length <= 6) return phone;
  
  const firstPart = phone.substring(0, 3);
  const lastPart = phone.substring(phone.length - 3);
  const maskedPart = '*'.repeat(phone.length - 6);
  
  return `${firstPart}${maskedPart}${lastPart}`;
}

export default {
  getAvailableRequests,
  getRequestDetails,
  getActiveRequests,
  completeRequest,
  notifyArrival,
  getRequestHistory,
  getCustomerInfo
};