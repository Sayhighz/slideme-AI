/**
 * Driver location controller
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError, ValidationError, NotFoundError } from '../../utils/errors/customErrors.js';
import { STATUS_CODES, getStatusCodeDescription } from '../../utils/constants/statusCodes.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import driverModel from '../../models/driverModel.js';
import mapService from '../../services/location/mapService.js';
import distanceService from '../../services/location/distanceService.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Update driver location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDriverLocation = async (req, res) => {
  try {
    const { driver_id, current_latitude, current_longitude } = req.body;

    // Validate required parameters
    if (!driver_id || !current_latitude || !current_longitude) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
    }

    // Validate coordinates format
    if (isNaN(parseFloat(current_latitude)) || isNaN(parseFloat(current_longitude))) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_COORDINATES);
    }

    // Update driver location in database
    const result = await driverModel.updateDriverLocation(
      driver_id,
      current_latitude,
      current_longitude
    );

    if (!result) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
    }

    // Notify any active requests about driver location update
    if (socketService) {
      socketService.notifyDriverLocationUpdate(driver_id, {
        latitude: parseFloat(current_latitude),
        longitude: parseFloat(current_longitude),
        timestamp: new Date().toISOString()
      });
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      Location: {
        driver_id,
        latitude: parseFloat(current_latitude),
        longitude: parseFloat(current_longitude),
        updated_at: new Date().toISOString()
      }
    }, "อัปเดตตำแหน่งสำเร็จ"));
  } catch (error) {
    logger.error('Error updating driver location', { error: error.message });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    if (error instanceof NotFoundError) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatErrorResponse("ไม่พบคนขับหรือการอัปเดตล้มเหลว"));
    }
    
    if (error instanceof DatabaseError) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
  }
};

/**
 * Get driver current location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverLocation = async (req, res) => {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD);
    }

    // Query driver location from database
    const result = await db.query(
      `SELECT 
        driver_id,
        current_latitude,
        current_longitude,
        updated_at
      FROM driverdetails
      WHERE driver_id = ?`,
      [driver_id]
    );

    if (result.length === 0) {
      throw new NotFoundError("ไม่พบข้อมูลตำแหน่งของคนขับ");
    }

    const location = result[0];

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      driver_id: location.driver_id,
      latitude: parseFloat(location.current_latitude),
      longitude: parseFloat(location.current_longitude),
      updated_at: location.updated_at
    }));
  } catch (error) {
    logger.error('Error getting driver location', { 
      driver_id: req.params.driver_id,
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
 * Find nearby drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, radius, vehicletype_id } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      throw new ValidationError("กรุณาระบุ latitude และ longitude");
    }

    // Validate coordinates format
    if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_COORDINATES);
    }

    // Set default radius if not provided
    const searchRadius = radius ? parseFloat(radius) : 10; // Default 10km

    // Find nearby drivers using the map service
    const drivers = await mapService.findNearbyDrivers(
      latitude,
      longitude,
      searchRadius,
      vehicletype_id || null
    );

    // Format response
    const formattedDrivers = drivers.map(driver => ({
      driver_id: driver.driver_id,
      name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
      license_plate: driver.license_plate,
      vehicle_type: driver.vehicletype_name,
      location: {
        latitude: parseFloat(driver.current_latitude),
        longitude: parseFloat(driver.current_longitude)
      },
      distance: parseFloat(driver.distance.toFixed(2)), // Distance in km
      distance_text: `${driver.distance.toFixed(2)} กม.`
    }));

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      Count: formattedDrivers.length,
      Result: formattedDrivers
    }));
  } catch (error) {
    logger.error('Error finding nearby drivers', { 
      location: `${req.query.latitude},${req.query.longitude}`,
      error: error.message 
    });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
  }
};

/**
 * Calculate distance between two points
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const calculateDistance = async (req, res) => {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = req.query;

    // Validate required parameters
    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      throw new ValidationError("กรุณาระบุพิกัดต้นทางและปลายทางให้ครบถ้วน");
    }

    // Validate coordinates format
    if (
      isNaN(parseFloat(origin_lat)) || 
      isNaN(parseFloat(origin_lng)) || 
      isNaN(parseFloat(destination_lat)) || 
      isNaN(parseFloat(destination_lng))
    ) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_COORDINATES);
    }

    // Calculate distance using the distance service
    const distance = distanceService.calculateDistance(
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng
    );

    // Calculate estimated travel time
    const travelTime = distanceService.calculateTravelTime(distance);

    // Calculate price estimation if vehicle type provided
    let priceEstimate = null;
    if (req.query.vehicletype_id) {
      priceEstimate = distanceService.calculatePriceEstimate(
        distance,
        req.query.vehicletype_id
      );
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      distance: distance,
      distance_text: `${distance} กม.`,
      duration: travelTime,
      duration_text: `${travelTime} นาที`,
      price_estimate: priceEstimate ? `฿${priceEstimate}` : null
    }));
  } catch (error) {
    logger.error('Error calculating distance', { error: error.message });
    
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR));
  }
};

/**
 * Get driver tracking information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverTracking = async (req, res) => {
  try {
    const { request_id, customer_id } = req.params;

    if (!request_id || !customer_id) {
      throw new ValidationError("กรุณาระบุ request_id และ customer_id");
    }

    // Get request and driver information
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
        o.driver_id,
        d.first_name AS driver_first_name,
        d.last_name AS driver_last_name,
        d.phone_number AS driver_phone,
        d.license_plate,
        dd.current_latitude,
        dd.current_longitude,
        dd.updated_at AS location_updated_at
      FROM servicerequests r
      JOIN driveroffers o ON r.offer_id = o.offer_id
      JOIN drivers d ON o.driver_id = d.driver_id
      JOIN driverdetails dd ON d.driver_id = dd.driver_id
      WHERE r.request_id = ? AND r.customer_id = ? AND r.status = 'accepted'
    `;

    const result = await db.query(sql, [request_id, customer_id]);

    if (result.length === 0) {
      throw new NotFoundError("ไม่พบข้อมูลการเดินทาง หรือสถานะไม่ถูกต้อง");
    }

    const trackingInfo = result[0];

    // Calculate distance and ETA from driver to pickup using distance service
    let distanceToPickup = null;
    let etaToPickup = null;

    if (trackingInfo.current_latitude && trackingInfo.current_longitude) {
      distanceToPickup = distanceService.calculateDistance(
        trackingInfo.current_latitude,
        trackingInfo.current_longitude,
        trackingInfo.pickup_lat,
        trackingInfo.pickup_long
      );
      
      etaToPickup = distanceService.calculateTravelTime(distanceToPickup);
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      request_id: trackingInfo.request_id,
      driver: {
        driver_id: trackingInfo.driver_id,
        name: `${trackingInfo.driver_first_name || ''} ${trackingInfo.driver_last_name || ''}`.trim(),
        phone: trackingInfo.driver_phone,
        license_plate: trackingInfo.license_plate,
        location: {
          latitude: parseFloat(trackingInfo.current_latitude),
          longitude: parseFloat(trackingInfo.current_longitude),
          updated_at: trackingInfo.location_updated_at
        }
      },
      pickup: {
        latitude: parseFloat(trackingInfo.pickup_lat),
        longitude: parseFloat(trackingInfo.pickup_long),
        address: trackingInfo.location_from
      },
      dropoff: {
        latitude: parseFloat(trackingInfo.dropoff_lat),
        longitude: parseFloat(trackingInfo.dropoff_long),
        address: trackingInfo.location_to
      },
      status: trackingInfo.status,
      distance_to_pickup: distanceToPickup,
      eta_to_pickup: etaToPickup ? `${etaToPickup} นาที` : null
    }));
  } catch (error) {
    logger.error('Error getting driver tracking', { 
      request_id: req.params.request_id,
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

export default {
  updateDriverLocation,
  getDriverLocation,
  findNearbyDrivers,
  calculateDistance,
  getDriverTracking
};