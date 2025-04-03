/**
 * Common notification controller
 * Handles system-wide notification management
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { NotFoundError, ValidationError, DatabaseError } from '../../utils/errors/customErrors.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import { formatDisplayDate, formatTimeString } from '../../utils/formatters/dateFormatter.js';
import pushNotificationService from '../../services/communication/pushNotificationService.js';
import emailService from '../../services/communication/emailService.js';
import smsService from '../../services/communication/smsService.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Get user notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const { user_id, user_type, limit, offset } = req.query;

  if (!user_id || !user_type) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['user_id', 'user_type']);
  }

  const limitValue = parseInt(limit) || 20;
  const offsetValue = parseInt(offset) || 0;

  const sql = `
    SELECT 
      id,
      title, 
      message, 
      type, 
      discount_code,
      created_at,
      read_status
    FROM app_notifications 
    WHERE user_id = ? AND user_type = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) as total 
    FROM app_notifications 
    WHERE user_id = ? AND user_type = ?
  `;

  try {
    const [notifications, countResult] = await Promise.all([
      db.query(sql, [user_id, user_type, limitValue, offsetValue]),
      db.query(countSql, [user_id, user_type])
    ]);

    // Format notification dates
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      created_at_formatted: {
        date: formatDisplayDate(notification.created_at),
        time: formatTimeString(notification.created_at)
      }
    }));

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      Result: formattedNotifications,
      Pagination: {
        total: countResult[0].total,
        limit: limitValue,
        offset: offsetValue,
        totalPages: Math.ceil(countResult[0].total / limitValue),
        currentPage: Math.floor(offsetValue / limitValue) + 1,
        hasMore: offsetValue + limitValue < countResult[0].total
      },
      unreadCount: formattedNotifications.filter(n => !n.read_status).length
    }));
  } catch (error) {
    logger.error('Error fetching user notifications', { 
      user_id, 
      user_type, 
      error: error.message 
    });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Mark notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notification_id, user_id, user_type } = req.body;

  if (!notification_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['notification_id']);
  }

  let sql = 'UPDATE app_notifications SET read_status = 1 WHERE id = ?';
  const params = [notification_id];

  // Add user checks if provided
  if (user_id && user_type) {
    sql += ' AND user_id = ? AND user_type = ?';
    params.push(user_id, user_type);
  }

  try {
    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, 'อ่านการแจ้งเตือนเรียบร้อยแล้ว'));
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Error marking notification as read', { 
      notification_id, 
      user_id, 
      user_type, 
      error: error.message 
    });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Mark all notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { user_id, user_type } = req.body;

  if (!user_id || !user_type) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['user_id', 'user_type']);
  }

  try {
    const result = await db.query(
      'UPDATE app_notifications SET read_status = 1 WHERE user_id = ? AND user_type = ? AND read_status = 0',
      [user_id, user_type]
    );

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      count: result.affectedRows
    }, 'อ่านการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว'));
  } catch (error) {
    logger.error('Error marking all notifications as read', { 
      user_id, 
      user_type, 
      error: error.message 
    });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Create a new notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { 
    title, 
    message, 
    type, 
    discount_code, 
    user_id, 
    user_type, 
    send_push,
    send_email,
    send_sms 
  } = req.body;

  if (!title || !message || !type) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['title', 'message', 'type']);
  }

  // Validate notification type
  if (!['news', 'discount', 'update', 'alert', 'service'].includes(type)) {
    throw new ValidationError('ประเภทการแจ้งเตือนไม่ถูกต้อง');
  }

  // If targeting a specific user, user_id and user_type are required
  if ((user_id && !user_type) || (!user_id && user_type)) {
    throw new ValidationError('ต้องระบุทั้ง user_id และ user_type หากต้องการส่งการแจ้งเตือนถึงผู้ใช้เฉพาะราย');
  }

  try {
    // Start a database transaction
    const connection = await db.beginTransaction();

    try {
      // Insert notification into database
      const insertSql = `
        INSERT INTO app_notifications (
          title, 
          message, 
          type, 
          discount_code, 
          user_id, 
          user_type, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.transactionQuery(
        connection,
        insertSql,
        [title, message, type, discount_code || null, user_id || null, user_type || null]
      );

      const notification_id = result.insertId;

      // Send push notification if requested
      if (send_push && user_id && user_type) {
        try {
          await pushNotificationService.sendUserNotification(
            user_type,
            user_id,
            { title, body: message },
            { 
              type, 
              notification_id: notification_id.toString(),
              discount_code: discount_code || null
            }
          );
        } catch (pushError) {
          logger.error('Error sending push notification', { 
            user_id, 
            user_type, 
            error: pushError.message 
          });
          // Continue with other notifications even if push fails
        }
      }

      // Send email if requested and we have email address
      if (send_email && user_id && user_type) {
        try {
          // Get user email
          const userSql = user_type === 'customer' ?
            'SELECT email, first_name, last_name FROM customers WHERE customer_id = ?' :
            'SELECT email, first_name, last_name FROM drivers WHERE driver_id = ?';
            
          const users = await db.transactionQuery(connection, userSql, [user_id]);
          
          if (users.length > 0 && users[0].email) {
            const user = users[0];
            
            await emailService.sendEmail({
              to: user.email,
              subject: title,
              text: message,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #60B876;">${title}</h2>
                  <p>${message}</p>
                  ${discount_code ? `<p><strong>รหัสส่วนลด:</strong> ${discount_code}</p>` : ''}
                  <p style="margin-top: 20px;">ด้วยความเคารพ,<br>ทีมงาน SlideMe</p>
                </div>
              `
            });
          }
        } catch (emailError) {
          logger.error('Error sending email notification', { 
            user_id, 
            user_type, 
            error: emailError.message 
          });
          // Continue with other notifications even if email fails
        }
      }

      // Send SMS if requested and we have phone number
      if (send_sms && user_id && user_type) {
        try {
          // Get user phone
          const userSql = user_type === 'customer' ?
            'SELECT phone_number, first_name FROM customers WHERE customer_id = ?' :
            'SELECT phone_number, first_name FROM drivers WHERE driver_id = ?';
            
          const users = await db.transactionQuery(connection, userSql, [user_id]);
          
          if (users.length > 0 && users[0].phone_number) {
            const user = users[0];
            
            await smsService.sendSMS(
              user.phone_number,
              `SlideMe: ${title}\n${message}${discount_code ? `\nรหัสส่วนลด: ${discount_code}` : ''}`
            );
          }
        } catch (smsError) {
          logger.error('Error sending SMS notification', { 
            user_id, 
            user_type, 
            error: smsError.message 
          });
          // Continue even if SMS fails
        }
      }

      // Commit database transaction
      await db.commitTransaction(connection);

      return res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
        notification_id,
        created_at: new Date().toISOString()
      }, 'สร้างการแจ้งเตือนเรียบร้อยแล้ว'));
    } catch (error) {
      // Rollback transaction on error
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error creating notification', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notification_id } = req.params;

  if (!notification_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['notification_id']);
  }

  try {
    const result = await db.query(
      'DELETE FROM app_notifications WHERE id = ?',
      [notification_id]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND);
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, 'ลบการแจ้งเตือนเรียบร้อยแล้ว'));
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Error deleting notification', { 
      notification_id, 
      error: error.message 
    });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Broadcast notification to all users of a specific type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const broadcastNotification = asyncHandler(async (req, res) => {
  const { 
    title, 
    message, 
    type, 
    discount_code, 
    user_type, 
    send_push,
    send_email,
    send_sms 
  } = req.body;

  if (!title || !message || !type || !user_type) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['title', 'message', 'type', 'user_type']);
  }

  // Validate user type
  if (!['customer', 'driver'].includes(user_type)) {
    throw new ValidationError('ประเภทผู้ใช้ไม่ถูกต้อง (ต้องเป็น "customer" หรือ "driver")');
  }

  // Validate notification type
  if (!['news', 'discount', 'update', 'alert', 'service'].includes(type)) {
    throw new ValidationError('ประเภทการแจ้งเตือนไม่ถูกต้อง');
  }

  try {
    // Get list of all users of the specified type
    const userSql = user_type === 'customer' ?
      'SELECT customer_id AS user_id, email, phone_number FROM customers' :
      'SELECT driver_id AS user_id, email, phone_number FROM drivers';
      
    const users = await db.query(userSql);
    
    if (users.length === 0) {
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, 'ไม่พบผู้ใช้ที่จะส่งการแจ้งเตือน'));
    }

    // Start a database transaction
    const connection = await db.beginTransaction();

    try {
      // Create database entries for all users
      const notificationIds = [];
      
      for (const user of users) {
        const insertSql = `
          INSERT INTO app_notifications (
            title, 
            message, 
            type, 
            discount_code, 
            user_id, 
            user_type, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        const result = await db.transactionQuery(
          connection,
          insertSql,
          [title, message, type, discount_code || null, user.user_id, user_type]
        );
        
        notificationIds.push(result.insertId);
      }

      // Send push notifications if requested
      let pushResults = { success: 0, failure: 0 };
      if (send_push) {
        try {
          // Extract just the user IDs
          const userIds = users.map(user => user.user_id);
          
          // Use the broadcast function from push notification service
          pushResults = await pushNotificationService.sendMulticastNotification(
            userIds,
            user_type,
            { title, body: message },
            { 
              type, 
              discount_code: discount_code || null
            }
          );
        } catch (pushError) {
          logger.error('Error sending broadcast push notifications', { 
            user_type, 
            error: pushError.message 
          });
        }
      }

      // Send emails if requested
      let emailCount = 0;
      if (send_email) {
        const emailPromises = users
          .filter(user => user.email)
          .map(user => {
            return emailService.sendEmail({
              to: user.email,
              subject: title,
              text: message,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #60B876;">${title}</h2>
                  <p>${message}</p>
                  ${discount_code ? `<p><strong>รหัสส่วนลด:</strong> ${discount_code}</p>` : ''}
                  <p style="margin-top: 20px;">ด้วยความเคารพ,<br>ทีมงาน SlideMe</p>
                </div>
              `
            }).then(() => emailCount++).catch(e => logger.error('Email send error', { error: e.message }));
          });
          
        await Promise.allSettled(emailPromises);
      }

      // Send SMS if requested
      let smsCount = 0;
      if (send_sms) {
        const smsPromises = users
          .filter(user => user.phone_number)
          .map(user => {
            return smsService.sendSMS(
              user.phone_number,
              `SlideMe: ${title}\n${message}${discount_code ? `\nรหัสส่วนลด: ${discount_code}` : ''}`
            ).then(() => smsCount++).catch(e => logger.error('SMS send error', { error: e.message }));
          });
          
        await Promise.allSettled(smsPromises);
      }

      // Commit database transaction
      await db.commitTransaction(connection);

      return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
        totalUsers: users.length,
        notificationsCreated: notificationIds.length,
        pushNotifications: pushResults,
        emailsSent: emailCount,
        smsSent: smsCount
      }, 'ส่งการแจ้งเตือนไปยังผู้ใช้ทุกคนเรียบร้อยแล้ว'));
    } catch (error) {
      // Rollback transaction on error
      await db.rollbackTransaction(connection);
      throw error;
    }
  } catch (error) {
    logger.error('Error broadcasting notification', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

// เพิ่มฟังก์ชันนี้ใน notificationController.js
export const getAllNotifications = asyncHandler(async (req, res) => {
    // โค้ดสำหรับดึงการแจ้งเตือนทั้งหมด
    // อาจคล้ายกับ getUserNotifications แต่อาจไม่ต้องการ user_id หรือ user_type
    
    const { limit, offset } = req.query;
    const limitValue = parseInt(limit) || 20;
    const offsetValue = parseInt(offset) || 0;
  
    const sql = `
      SELECT 
        id,
        title, 
        message, 
        type, 
        discount_code,
        created_at,
        read_status,
        user_id,
        user_type
      FROM app_notifications 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
  
    try {
      const notifications = await db.query(sql, [limitValue, offsetValue]);
      
      // Format notification dates
      const formattedNotifications = notifications.map(notification => ({
        ...notification,
        created_at_formatted: {
          date: formatDisplayDate(notification.created_at),
          time: formatTimeString(notification.created_at)
        }
      }));
  
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
        Result: formattedNotifications
      }));
    } catch (error) {
      logger.error('Error fetching all notifications', { error: error.message });
      throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
    }
  });
  

export default {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  deleteNotification,
  broadcastNotification,
  getAllNotifications
};