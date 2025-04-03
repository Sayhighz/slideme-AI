import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { STATUS_CODES } from "../../utils/constants/statusCodes.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { validateUserData } from "../../utils/validators/userValidator.js";
import { pick } from "../../utils/helpers/objectHelpers.js";
import { maskString } from "../../utils/helpers/stringHelpers.js";
import { formatThaiDate } from "../../utils/formatters/dateFormatter.js";
import emailService from "../../services/communication/emailService.js";

/**
 * Get customer profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = (req, res) => {
  const { customer_id } = req.query;

  // Validate customer_id
  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุ customer_id")
    );
  }

  const sql = `
    SELECT 
      customer_id, 
      phone_number, 
      email, 
      username, 
      first_name, 
      last_name, 
      created_at, 
      birth_date
    FROM customers 
    WHERE customer_id = ?
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error("Error fetching customer profile", { customer_id, error: err.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์")
      );
    }

    if (result.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบข้อมูลลูกค้า")
      );
    }

    // Mask sensitive information
    const profile = {
      ...result[0],
      phone_number: maskString(result[0].phone_number, 3, 3),
      email: result[0].email ? maskString(result[0].email, 3, 3, '@') : null,
      created_at: formatThaiDate(result[0].created_at),
      birth_date: result[0].birth_date 
        ? formatThaiDate(result[0].birth_date) 
        : null
    };

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(profile, "ดึงข้อมูลโปรไฟล์สำเร็จ")
    );
  });
};

/**
 * Update customer profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = (req, res) => {
  const { customer_id, email, username, first_name, last_name, birth_date } = req.body;

  // Validate customer_id
  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุ customer_id")
    );
  }

  // Validate email if provided
  if (email) {
    const validation = validateUserData({ phone_number: "0000000000", email });
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse("รูปแบบอีเมลไม่ถูกต้อง")
      );
    }
  }

  // Select only the fields to update
  const updateFields = pick(req.body, [
    'email', 
    'username', 
    'first_name', 
    'last_name', 
    'birth_date'
  ]);

  // If no fields to update
  if (Object.keys(updateFields).length === 0) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("ไม่มีข้อมูลที่ต้องการอัปเดต")
    );
  }

  // Construct dynamic SQL update
  const sql = `
    UPDATE customers
    SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')}
    WHERE customer_id = ?
  `;

  const values = [...Object.values(updateFields), customer_id];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error("Error updating customer profile", { 
        customer_id, 
        error: err.message,
        updatedFields: Object.keys(updateFields)
      });
      
      // Check for duplicate entry errors
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(STATUS_CODES.CONFLICT).json(
          formatErrorResponse("ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว")
        );
      }

      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์")
      );
    }

    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบข้อมูลลูกค้า")
      );
    }

    // Send welcome email if email is updated
    if (updateFields.email) {
      emailService.sendWelcomeEmail({
        email: updateFields.email,
        first_name: updateFields.first_name || first_name
      }).catch(emailErr => {
        logger.warn('Failed to send welcome email', { 
          email: updateFields.email, 
          error: emailErr.message 
        });
      });
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
        UpdatedFields: Object.keys(updateFields)
      }, "อัปเดตโปรไฟล์สำเร็จ")
    );
  });
};

/**
 * Update customer profile picture
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfilePicture = (req, res) => {
  const { customer_id, profile_picture_url } = req.body;

  if (!customer_id || !profile_picture_url) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุ customer_id และ URL รูปโปรไฟล์")
    );
  }

  const sql = `
    UPDATE customers 
    SET profile_picture = ? 
    WHERE customer_id = ?
  `;

  con.query(sql, [profile_picture_url, customer_id], (err, result) => {
    if (err) {
      logger.error("Error updating profile picture", { 
        customer_id, 
        error: err.message 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์")
      );
    }

    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบข้อมูลลูกค้า")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(null, "อัปเดตรูปโปรไฟล์สำเร็จ")
    );
  });
};

/**
 * Get customer service statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getServiceStats = (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุ customer_id")
    );
  }

  const sql = `
    SELECT 
      COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_trips,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_trips,
      COUNT(*) AS total_trips
    FROM servicerequests
    WHERE customer_id = ?
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error("Error fetching service stats", { 
        customer_id, 
        error: err.message 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ")
      );
    }

    // Even if no trips, this will return zeros
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(result[0], "ดึงข้อมูลสถิติสำเร็จ")
    );
  });
};

/**
 * Check if username is available
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkUsernameAvailability = (req, res) => {
  const { username, current_customer_id } = req.query;

  if (!username) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุชื่อผู้ใช้ที่ต้องการตรวจสอบ")
    );
  }

  let sql = "SELECT customer_id FROM customers WHERE username = ?";
  let params = [username];

  // If checking for a current user (to allow keeping the same username)
  if (current_customer_id) {
    sql += " AND customer_id != ?";
    params.push(current_customer_id);
  }

  con.query(sql, params, (err, result) => {
    if (err) {
      logger.error("Error checking username availability", { 
        username, 
        error: err.message 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้")
      );
    }

    const isAvailable = result.length === 0;
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        username,
        isAvailable
      }, isAvailable ? "ชื่อผู้ใช้นี้สามารถใช้ได้" : "ชื่อผู้ใช้นี้ถูกใช้แล้ว")
    );
  });
};

/**
 * Delete customer account (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteAccount = (req, res) => {
  const { customer_id } = req.body;

  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("กรุณาระบุ customer_id")
    );
  }

  // Check if customer has active requests
  const checkSql = `
    SELECT request_id 
    FROM servicerequests 
    WHERE customer_id = ? AND status IN ('pending', 'accepted')
    LIMIT 1
  `;

  con.query(checkSql, [customer_id], (checkErr, checkResult) => {
    if (checkErr) {
      logger.error("Error checking active requests", { 
        customer_id, 
        error: checkErr.message 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอที่ยังดำเนินการอยู่")
      );
    }

    if (checkResult.length > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse("ไม่สามารถลบบัญชีได้เนื่องจากมีคำขอที่ยังดำเนินการอยู่")
      );
    }

    // Soft delete implementation
    const sql = `
      UPDATE customers 
      SET is_active = 0,
          deleted_at = NOW() 
      WHERE customer_id = ?
    `;

    con.query(sql, [customer_id], (err, result) => {
      if (err) {
        logger.error("Error deleting customer account", { 
          customer_id, 
          error: err.message 
        });
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
          formatErrorResponse("เกิดข้อผิดพลาดในการลบบัญชี")
        );
      }

      if (result.affectedRows === 0) {
        return res.status(STATUS_CODES.NOT_FOUND).json(
          formatErrorResponse("ไม่พบข้อมูลลูกค้า")
        );
      }

      return res.status(STATUS_CODES.OK).json(
        formatSuccessResponse(null, "ลบบัญชีสำเร็จ")
      );
    });
  });
};

export default {
  getProfile,
  updateProfile,
  updateProfilePicture,
  getServiceStats,
  checkUsernameAvailability,
  deleteAccount
};