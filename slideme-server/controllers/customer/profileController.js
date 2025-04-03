import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { validateUserData } from "../../utils/validators/userValidator.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";

/**
 * Get customer profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = (req, res) => {
  const { customer_id } = req.query;

  // Validate customer_id
  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
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
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์"));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบข้อมูลลูกค้า"));
    }

    // Mask sensitive information if needed
    const profile = result[0];

    return res.status(200).json(formatSuccessResponse(profile, "ดึงข้อมูลโปรไฟล์สำเร็จ"));
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
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
  }

  // Optional validation for email format
  if (email) {
    const validation = validateUserData({ phone_number: "0000000000", email });
    if (!validation.isValid) {
      return res.status(400).json(formatErrorResponse("รูปแบบอีเมลไม่ถูกต้อง"));
    }
  }

  // Build SQL query dynamically based on provided fields
  let updateFields = [];
  let values = [];

  if (email !== undefined) {
    updateFields.push("email = ?");
    values.push(email);
  }

  if (username !== undefined) {
    updateFields.push("username = ?");
    values.push(username);
  }

  if (first_name !== undefined) {
    updateFields.push("first_name = ?");
    values.push(first_name);
  }

  if (last_name !== undefined) {
    updateFields.push("last_name = ?");
    values.push(last_name);
  }

  if (birth_date !== undefined) {
    updateFields.push("birth_date = ?");
    values.push(birth_date);
  }

  // If no fields to update
  if (updateFields.length === 0) {
    return res.status(400).json(formatErrorResponse("ไม่มีข้อมูลที่ต้องการอัปเดต"));
  }

  values.push(customer_id);

  const sql = `
    UPDATE customers 
    SET ${updateFields.join(", ")} 
    WHERE customer_id = ?
  `;

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error("Error updating customer profile", { 
        customer_id, 
        error: err.message,
        updatedFields: Object.keys(req.body).filter(key => key !== "customer_id")
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์"));
    }

    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบข้อมูลลูกค้า"));
    }

    return res.status(200).json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
      UpdatedFields: updateFields.map(field => field.split(" = ")[0])
    }, "อัปเดตโปรไฟล์สำเร็จ"));
  });
};

/**
 * Update customer profile picture
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfilePicture = (req, res) => {
  // This would normally use the file upload middleware
  // For now, we'll assume the image is uploaded and the URL is in the request body
  const { customer_id, profile_picture_url } = req.body;

  if (!customer_id || !profile_picture_url) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id และ URL รูปโปรไฟล์"));
  }

  const sql = `
    UPDATE customers 
    SET profile_picture = ? 
    WHERE customer_id = ?
  `;

  con.query(sql, [profile_picture_url, customer_id], (err, result) => {
    if (err) {
      logger.error("Error updating profile picture", { customer_id, error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์"));
    }

    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบข้อมูลลูกค้า"));
    }

    return res.status(200).json(formatSuccessResponse(null, "อัปเดตรูปโปรไฟล์สำเร็จ"));
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
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
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
      logger.error("Error fetching service stats", { customer_id, error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ"));
    }

    // Even if no trips, this will return zeros
    return res.status(200).json(formatSuccessResponse(result[0], "ดึงข้อมูลสถิติสำเร็จ"));
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
    return res.status(400).json(formatErrorResponse("กรุณาระบุชื่อผู้ใช้ที่ต้องการตรวจสอบ"));
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
      logger.error("Error checking username availability", { username, error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้"));
    }

    const isAvailable = result.length === 0;
    
    return res.status(200).json(formatSuccessResponse({
      username,
      isAvailable
    }, isAvailable ? "ชื่อผู้ใช้นี้สามารถใช้ได้" : "ชื่อผู้ใช้นี้ถูกใช้แล้ว"));
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
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
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
      logger.error("Error checking active requests", { customer_id, error: checkErr.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอที่ยังดำเนินการอยู่"));
    }

    if (checkResult.length > 0) {
      return res.status(400).json(formatErrorResponse("ไม่สามารถลบบัญชีได้เนื่องจากมีคำขอที่ยังดำเนินการอยู่"));
    }

    // Soft delete implementation
    // In a real system, you might add an is_deleted column or move to an archive table
    const sql = `
      UPDATE customers 
      SET is_active = 0,
          deleted_at = NOW() 
      WHERE customer_id = ?
    `;

    con.query(sql, [customer_id], (err, result) => {
      if (err) {
        logger.error("Error deleting customer account", { customer_id, error: err.message });
        return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการลบบัญชี"));
      }

      if (result.affectedRows === 0) {
        return res.status(404).json(formatErrorResponse("ไม่พบข้อมูลลูกค้า"));
      }

      return res.status(200).json(formatSuccessResponse(null, "ลบบัญชีสำเร็จ"));
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