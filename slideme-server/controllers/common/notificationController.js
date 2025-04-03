/**
 * Notification controller for managing app notifications
 */
import con from "../config/db.js";
import logger from "../config/logger.js";

/**
 * Get all notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllNotifications = (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      message,
      type,
      discount_code,
      created_at,
      read_status
    FROM
      app_notifications
    ORDER BY
      created_at DESC;
  `;

  con.query(sql, (err, result) => {
    if (err) {
      logger.error('Error getting all notifications', { error: err.message });
      return res.status(500).json({ Status: false, Error: err.message });
    }
    return res.status(200).json({ Status: true, Result: result });
  });
};

/**
 * Get notification by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNotificationById = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ ID ของการแจ้งเตือน" });
  }
  
  const sql = `
    SELECT
      id,
      title,
      message,
      type,
      discount_code,
      created_at,
      read_status
    FROM
      app_notifications
    WHERE
      id = ?;
  `;

  con.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error getting notification by ID', { error: err.message, id });
      return res.status(500).json({ Status: false, Error: err.message });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ Status: false, Error: "ไม่พบการแจ้งเตือน" });
    }
    
    return res.status(200).json({ Status: true, Result: result[0] });
  });
};

/**
 * Create a new notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createNotification = (req, res) => {
  const { title, message, type, discount_code } = req.body;
  
  if (!title || !message || !type) {
    return res.status(400).json({ Status: false, Error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }
  
  // Validate notification type
  if (type !== 'news' && type !== 'discount') {
    return res.status(400).json({ Status: false, Error: "ประเภทการแจ้งเตือนไม่ถูกต้อง (news หรือ discount เท่านั้น)" });
  }
  
  // If type is discount, discount_code must be provided
  if (type === 'discount' && !discount_code) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุรหัสส่วนลด" });
  }
  
  const sql = `
    INSERT INTO app_notifications (
      title,
      message,
      type,
      discount_code,
      created_at,
      read_status
    ) VALUES (?, ?, ?, ?, NOW(), 0);
  `;
  
  const values = [title, message, type, discount_code || null];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error creating notification', { error: err.message });
      return res.status(500).json({ Status: false, Error: err.message });
    }
    
    return res.status(201).json({
      Status: true,
      Message: "เพิ่มการแจ้งเตือนเรียบร้อย !",
      NotificationId: result.insertId
    });
  });
};

/**
 * Mark notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markNotificationAsRead = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ ID ของการแจ้งเตือน" });
  }
  
  const sql = `
    UPDATE app_notifications
    SET read_status = 1
    WHERE id = ?;
  `;

  con.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error marking notification as read', { error: err.message, id });
      return res.status(500).json({ Status: false, Error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "ไม่พบการแจ้งเตือน" });
    }
    
    return res.status(200).json({
      Status: true,
      Message: "อัปเดตสถานะการอ่านเรียบร้อย !",
      AffectedRows: result.affectedRows
    });
  });
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteNotification = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ ID ของการแจ้งเตือน" });
  }
  
  const sql = `
    DELETE FROM app_notifications
    WHERE id = ?;
  `;

  con.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error deleting notification', { error: err.message, id });
      return res.status(500).json({ Status: false, Error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "ไม่พบการแจ้งเตือน" });
    }
    
    return res.status(200).json({
      Status: true,
      Message: "ลบการแจ้งเตือนเรียบร้อย !",
      AffectedRows: result.affectedRows
    });
  });
};

export default {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  deleteNotification
};