/**
 * Driver profile controller
 * Handles driver profile management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { DatabaseError, NotFoundError, ValidationError } from '../../utils/errors/customErrors.js';
import { validateDriverData } from '../../utils/validators/userValidator.js';
import { STATUS_CODES, getStatusCodeDescription } from '../../utils/constants/statusCodes.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { maskString } from '../../utils/helpers/stringHelpers.js';
import { formatDisplayDate } from '../../utils/formatters/dateFormatter.js';
import fileService from '../../services/storage/fileService.js';
import imageService from '../../services/storage/imageService.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';

/**
 * Get driver profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverProfile = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;

  if (!driver_id) {
    throw new ValidationError("กรุณาระบุ driver_id");
  }

  // Query driver profile data
  const sql = `
    SELECT 
      d.driver_id,
      d.phone_number,
      d.first_name,
      d.last_name,
      d.license_plate,
      d.id_expiry_date,
      d.province,
      d.approval_status,
      d.created_date,
      d.birth_date,
      v.vehicletype_name,
      v.vehicletype_id,
      (SELECT AVG(rating) FROM reviews WHERE driver_id = d.driver_id) AS average_rating,
      (SELECT COUNT(*) FROM reviews WHERE driver_id = d.driver_id) AS review_count
    FROM drivers d
    LEFT JOIN vehicle_types v ON d.vehicletype_id = v.vehicletype_id
    WHERE d.driver_id = ?
  `;

  const result = await db.query(sql, [driver_id]);

  if (result.length === 0) {
    throw new NotFoundError("ไม่พบข้อมูลคนขับ");
  }

  // Format the response data
  const driver = result[0];

  if (driver.phone_number) {
    driver.phone_number_masked = maskString(driver.phone_number, 3, 3);
  }

  // Format date fields
  if (driver.birth_date) {
    driver.birth_date_formatted = formatDisplayDate(driver.birth_date);
  }

  if (driver.id_expiry_date) {
    driver.id_expiry_date_formatted = formatDisplayDate(driver.id_expiry_date);
  }

  // Format rating
  if (driver.average_rating) {
    driver.average_rating = parseFloat(driver.average_rating).toFixed(1);
  } else {
    driver.average_rating = "0.0";
  }

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(driver));
});

/**
 * Update driver profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDriverProfile = asyncHandler(async (req, res) => {
  const { 
    driver_id, 
    first_name, 
    last_name, 
    license_plate, 
    id_expiry_date, 
    province, 
    vehicletype_id 
  } = req.body;

  if (!driver_id) {
    throw new ValidationError("กรุณาระบุ driver_id");
  }

  // Prepare update fields and values
  const updateFields = [];
  const updateValues = [];


  if (first_name !== undefined) {
    updateFields.push("first_name = ?");
    updateValues.push(first_name);
  }

  if (last_name !== undefined) {
    updateFields.push("last_name = ?");
    updateValues.push(last_name);
  }

  if (license_plate !== undefined) {
    updateFields.push("license_plate = ?");
    updateValues.push(license_plate);
  }

  if (id_expiry_date !== undefined) {
    updateFields.push("id_expiry_date = ?");
    updateValues.push(id_expiry_date);
  }

  if (province !== undefined) {
    updateFields.push("province = ?");
    updateValues.push(province);
  }

  if (vehicletype_id !== undefined) {
    updateFields.push("vehicletype_id = ?");
    updateValues.push(vehicletype_id);
  }

  // If no fields to update
  if (updateFields.length === 0) {
    throw new ValidationError("ไม่มีข้อมูลที่ต้องการอัปเดต");
  }

  // Add driver_id to values array
  updateValues.push(driver_id);

  // Build and execute SQL query
  const sql = `
    UPDATE drivers
    SET ${updateFields.join(', ')}
    WHERE driver_id = ?
  `;

  const result = await db.query(sql, updateValues);

  if (result.affectedRows === 0) {
    throw new NotFoundError("ไม่พบข้อมูลคนขับหรือไม่มีการเปลี่ยนแปลงข้อมูล");
  }

  logger.info('Driver profile updated', { driver_id });

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    Message: "อัปเดตข้อมูลคนขับสำเร็จ",
    UpdatedFields: updateFields.map(field => field.split(' = ')[0])
  }));
});

/**
 * Update driver document/id expiry date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateIdExpiryDate = asyncHandler(async (req, res) => {
  const { driver_id, id_expiry_date } = req.body;

  if (!driver_id || !id_expiry_date) {
    throw new ValidationError("กรุณาระบุ driver_id และ id_expiry_date");
  }

  // Validate date format
  const expiryDate = new Date(id_expiry_date);
  if (isNaN(expiryDate.getTime())) {
    throw new ValidationError("รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");
  }

  // Check if expiry date is in the future
  const today = new Date();
  if (expiryDate <= today) {
    throw new ValidationError("วันหมดอายุต้องเป็นวันที่ในอนาคต");
  }

  const sql = `
    UPDATE drivers
    SET id_expiry_date = ?
    WHERE driver_id = ?
  `;

  const result = await db.query(sql, [id_expiry_date, driver_id]);

  if (result.affectedRows === 0) {
    throw new NotFoundError("ไม่พบข้อมูลคนขับ");
  }

  logger.info('Driver ID expiry date updated', { 
    driver_id, 
    id_expiry_date 
  });

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, "อัปเดตวันหมดอายุเอกสารสำเร็จ"));
});

/**
 * Get driver vehicle types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getVehicleTypes = asyncHandler(async (req, res) => {
  const sql = `
    SELECT 
      vehicletype_id,
      vehicletype_name
    FROM vehicle_types
    ORDER BY vehicletype_id
  `;

  const vehicleTypes = await db.query(sql);

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(vehicleTypes));
});

/**
 * Get driver performance stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverStats = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;

  if (!driver_id) {
    throw new ValidationError("กรุณาระบุ driver_id");
  }

  // Get total completed trips
  const tripsSql = `
    SELECT 
      COUNT(*) AS completed_trips
    FROM servicerequests s
    JOIN driveroffers o ON s.offer_id = o.offer_id
    WHERE o.driver_id = ? AND s.status = 'completed'
  `;

  // Get average rating
  const ratingSql = `
    SELECT 
      COALESCE(AVG(rating), 0) AS average_rating,
      COUNT(*) AS review_count
    FROM reviews
    WHERE driver_id = ?
  `;

  // Get recent reviews
  const reviewsSql = `
    SELECT 
      r.review_id,
      r.rating,
      r.review_text,
      r.created_at,
      c.first_name,
      c.last_name
    FROM reviews r
    JOIN customers c ON r.customer_id = c.customer_id
    WHERE r.driver_id = ?
    ORDER BY r.created_at DESC
    LIMIT 5
  `;

  // Execute all queries
  const [tripsResult, ratingResult, reviewsResult] = await Promise.all([
    db.query(tripsSql, [driver_id]),
    db.query(ratingSql, [driver_id]),
    db.query(reviewsSql, [driver_id])
  ]);

  // Format response
  const stats = {
    completed_trips: tripsResult[0].completed_trips,
    average_rating: parseFloat(ratingResult[0].average_rating).toFixed(1),
    review_count: ratingResult[0].review_count,
    recent_reviews: reviewsResult
  };

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse(stats));
});

/**
 * Get driver reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverReviews = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  if (!driver_id) {
    throw new ValidationError("กรุณาระบุ driver_id");
  }

  // Query reviews
  const reviewsSql = `
    SELECT 
      r.review_id,
      r.rating,
      r.review_text,
      r.created_at,
      c.first_name,
      c.last_name,
      s.location_from,
      s.location_to
    FROM reviews r
    JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN servicerequests s ON r.request_id = s.request_id
    WHERE r.driver_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Count total reviews
  const countSql = `
    SELECT COUNT(*) AS total
    FROM reviews
    WHERE driver_id = ?
  `;

  // Execute queries
  const [reviews, countResult] = await Promise.all([
    db.query(reviewsSql, [driver_id, limit, offset]),
    db.query(countSql, [driver_id])
  ]);

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    reviews,
    pagination: {
      limit,
      offset,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    }
  }));
});

/**
 * Check if driver account is approved
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkApprovalStatus = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;

  if (!driver_id) {
    throw new ValidationError("กรุณาระบุ driver_id");
  }

  const sql = `
    SELECT 
      approval_status,
      created_date
    FROM drivers
    WHERE driver_id = ?
  `;

  const result = await db.query(sql, [driver_id]);

  if (result.length === 0) {
    throw new NotFoundError("ไม่พบข้อมูลคนขับ");
  }

  return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    driver_id: parseInt(driver_id),
    approval_status: result[0].approval_status,
    registration_date: result[0].created_date
  }));
});

export default {
  getDriverProfile,
  updateDriverProfile,
  updateIdExpiryDate,
  getVehicleTypes,
  getDriverStats,
  getDriverReviews,
  checkApprovalStatus
};