import jwt from "jsonwebtoken";
import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { validatePhoneNumber } from "../../utils/validators/userValidator.js";

/**
 * Driver login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginDriver = (req, res) => {
  const { phone_number, password } = req.body;

  // Validate required fields
  if (!phone_number || !password) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาใส่เบอร์โทรศัพท์และรหัสผ่าน" });
  }

  // Validate phone number format
  if (!validatePhoneNumber(phone_number)) {
    return res
      .status(400)
      .json({ Status: false, Error: "เบอร์โทรศัพท์ไม่ถูกต้อง" });
  }

  const sql = `SELECT driver_id, password, approval_status, first_name, last_name FROM drivers WHERE phone_number = ?`;

  con.query(sql, [phone_number], (err, results) => {
    if (err) {
      logger.error("Database error during driver login", { error: err.message });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    // Check if driver exists and password matches
    if (results.length === 0) {
      return res.status(401).json({ Status: false, Error: "เบอร์โทรไม่ถูกต้อง" });
    }

    const driver = results[0];
    
    // Compare passwords - note: in a production app, passwords should be hashed
    if (driver.password !== password) {
      return res.status(401).json({ Status: false, Error: "รหัสผ่านไม่ถูกต้อง" });
    }

    // Check approval status
    if (driver.approval_status !== "approved") {
      return res.status(403).json({ 
        Status: false, 
        Error: "บัญชีนี้ยังไม่ได้รับการอนุมัติ",
        ApprovalStatus: driver.approval_status
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { driver_id: driver.driver_id, role: "driver" },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "24h" }
    );

    // Return driver data and token
    res.status(200).json({
      Status: true,
      driver_id: driver.driver_id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      token
    });
  });
};

/**
 * Register new driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerDriver = (req, res) => {
  const { 
    phone_number, 
    password, 
    first_name, 
    last_name, 
    license_plate, 
    license_number,
    id_expiry_date,
    province,
    vehicletype_id,
    email
  } = req.body;

  // Validate required fields
  if (!phone_number || !password) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาใส่เบอร์โทรศัพท์และรหัสผ่าน" });
  }

  // Validate phone number format
  if (!validatePhoneNumber(phone_number)) {
    return res
      .status(400)
      .json({ Status: false, Error: "เบอร์โทรศัพท์ไม่ถูกต้อง" });
  }

  // Check if phone number already exists
  const checkSql = `SELECT driver_id FROM drivers WHERE phone_number = ?`;
  con.query(checkSql, [phone_number], (checkErr, checkResults) => {
    if (checkErr) {
      logger.error("Database error during driver registration check", { error: checkErr.message });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ Status: false, Error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" });
    }

    // Insert new driver
    const insertSql = `
      INSERT INTO drivers (
        phone_number, 
        password, 
        first_name, 
        last_name,
        license_plate,
        license_number,
        id_expiry_date,
        province,
        vehicletype_id,
        email,
        created_date,
        approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
    `;

    const values = [
      phone_number,
      password, // In production, this should be hashed with bcrypt
      first_name || null,
      last_name || null,
      license_plate || null,
      license_number || null,
      id_expiry_date || null,
      province || "Unknown",
      vehicletype_id || 99, // Default vehicle type
      email || null
    ];

    con.query(insertSql, values, (insertErr, result) => {
      if (insertErr) {
        logger.error("Database error during driver registration", { error: insertErr.message });
        return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดในการลงทะเบียน" });
      }

      // Create driverdetails record
      const detailsSql = `INSERT INTO driverdetails (driver_id) VALUES (?)`;
      con.query(detailsSql, [result.insertId], (detailsErr) => {
        if (detailsErr) {
          logger.error("Error creating driver details", { error: detailsErr.message });
          // Continue anyway since the main record was created
        }

        return res.status(201).json({
          Status: true,
          Message: "ลงทะเบียนสำเร็จ กรุณารอการตรวจสอบและอนุมัติจากทีมงาน",
          driver_id: result.insertId,
          approval_status: "pending"
        });
      });
    });
  });
};

/**
 * Check driver registration status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkRegistrationStatus = (req, res) => {
  const { phone_number } = req.query;

  if (!phone_number) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุเบอร์โทรศัพท์" });
  }

  const sql = `
    SELECT driver_id, approval_status, created_date 
    FROM drivers 
    WHERE phone_number = ?
  `;

  con.query(sql, [phone_number], (err, results) => {
    if (err) {
      logger.error("Database error checking registration status", { error: err.message });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    if (results.length === 0) {
      return res.status(404).json({ Status: false, Error: "ไม่พบข้อมูลการลงทะเบียน" });
    }

    return res.status(200).json({
      Status: true,
      driver_id: results[0].driver_id,
      approval_status: results[0].approval_status,
      registration_date: results[0].created_date
    });
  });
};

/**
 * Reset driver password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetPassword = (req, res) => {
  const { phone_number, new_password } = req.body;

  if (!phone_number || !new_password) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุเบอร์โทรศัพท์และรหัสผ่านใหม่" });
  }

  // In a real app, this should verify a reset token or OTP first
  
  const sql = `UPDATE drivers SET password = ? WHERE phone_number = ?`;

  con.query(sql, [new_password, phone_number], (err, result) => {
    if (err) {
      logger.error("Database error during password reset", { error: err.message });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "ไม่พบบัญชีผู้ใช้" });
    }

    return res.status(200).json({
      Status: true,
      Message: "รีเซ็ตรหัสผ่านสำเร็จ"
    });
  });
};

export default {
  loginDriver,
  registerDriver,
  checkRegistrationStatus,
  resetPassword
};