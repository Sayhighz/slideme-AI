/**
 * Driver authentication controller
 * Handles authentication functionality for drivers
 */
import logger from '../../config/logger.js';
import db from '../../config/db.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { USER_ROLES } from '../../utils/constants/userRoles.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { ValidationError, UnauthorizedError, NotFoundError, DatabaseError } from '../../utils/errors/customErrors.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import { validatePhoneNumber, validateEmail, validateDriverData } from '../../utils/validators/userValidator.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { generateRandomString, maskString } from '../../utils/helpers/stringHelpers.js';
import { APPROVAL_STATUS } from '../../utils/constants/requestStatus.js';
import jwtService from '../../services/auth/jwtService.js';
import passwordService from '../../services/auth/passwordService.js';
import sessionService from '../../services/auth/sessionService.js';
import emailService from '../../services/communication/emailService.js';
import smsService from '../../services/communication/smsService.js';

/**
 * Driver login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginDriver = asyncHandler(async (req, res) => {
  const { phone_number, password } = req.body;

  // Validate required fields
  if (!phone_number || !password) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      'กรุณาใส่เบอร์โทรศัพท์และรหัสผ่าน'
    ]);
  }

  // Validate phone number format
  if (!validatePhoneNumber(phone_number)) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_PHONE, [
      'เบอร์โทรศัพท์ไม่ถูกต้อง'
    ]);
  }

  try {
    // Query driver information
    const drivers = await db.query(
      `SELECT 
        driver_id, 
        password, 
        approval_status, 
        first_name, 
        last_name,
        phone_number,
        license_plate 
      FROM drivers 
      WHERE phone_number = ?`,
      [phone_number]
    );

    // Check if driver exists
    if (drivers.length === 0) {
      throw new UnauthorizedError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const driver = drivers[0];
    
    // Compare passwords - in production, use passwordService.comparePassword
    // For now, direct comparison as shown in the original code
    const passwordMatch = driver.password === password;
    if (!passwordMatch) {
      logger.warn('Login attempt with invalid password', { phone_number });
      throw new UnauthorizedError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Check approval status
    if (driver.approval_status !== APPROVAL_STATUS.APPROVED) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ 
        Status: false, 
        Error: ERROR_MESSAGES.AUTH.ACCOUNT_NOT_APPROVED,
        ApprovalStatus: driver.approval_status
      });
    }

    // Generate JWT token
    const tokenPayload = { 
      driver_id: driver.driver_id, 
      role: USER_ROLES.DRIVER 
    };
    
    const token = jwtService.generateToken(tokenPayload);

    // Create a session
    await sessionService.createSession({
      id: driver.driver_id,
      userType: USER_ROLES.DRIVER,
      phone: driver.phone_number,
      firstName: driver.first_name,
      lastName: driver.last_name
    });

    // Return driver data and token
    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      driver_id: driver.driver_id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      phone_number: driver.phone_number,
      license_plate: driver.license_plate,
      token
    }, "เข้าสู่ระบบสำเร็จ"));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(formatErrorResponse(error.message));
    }
    
    logger.error('Error during driver login', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});


/**
 * Check driver registration status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkRegistrationStatus = asyncHandler(async (req, res) => {
  const { phone_number } = req.query;

  if (!phone_number) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุเบอร์โทรศัพท์"
    ]);
  }

  if (!validatePhoneNumber(phone_number)) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_PHONE, [
      'เบอร์โทรศัพท์ไม่ถูกต้อง'
    ]);
  }

  try {
    const drivers = await db.query(
      `SELECT driver_id, approval_status, created_date 
       FROM drivers 
       WHERE phone_number = ?`,
      [phone_number]
    );

    if (drivers.length === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND, [
        "ไม่พบข้อมูลการลงทะเบียน"
      ]);
    }

    const driver = drivers[0];

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      driver_id: driver.driver_id,
      approval_status: driver.approval_status,
      registration_date: driver.created_date
    }, "ตรวจสอบสถานะสำเร็จ"));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatErrorResponse(error.message));
    }
    logger.error('Error checking registration status', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุเบอร์โทรศัพท์"
    ]);
  }

  if (!validatePhoneNumber(phone_number)) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_PHONE, [
      'เบอร์โทรศัพท์ไม่ถูกต้อง'
    ]);
  }

  try {
    // Check if user exists
    const drivers = await db.query(
      `SELECT driver_id, first_name, last_name FROM drivers WHERE phone_number = ?`,
      [phone_number]
    );

    if (drivers.length === 0) {
      // For security reasons, don't reveal if phone number exists or not
      // Just return success as if reset was initiated
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
        null, 
        "หากเบอร์โทรศัพท์นี้มีในระบบ รหัสรีเซ็ตจะถูกส่งไปยังเบอร์โทรหรืออีเมลที่ลงทะเบียนไว้"
      ));
    }

    const driver = drivers[0];
    
    // Generate reset token
    const resetToken = passwordService.generateResetToken();
    
    // Generate a 6-digit reset code
    const resetCode = generateRandomString(6, '0123456789');
    
    // Store reset token and code in database with expiry
    await db.query(
      `INSERT INTO password_resets (user_id, user_type, token, code, expires_at, created_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())
       ON DUPLICATE KEY UPDATE 
       token = VALUES(token), 
       code = VALUES(code),
       expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
       created_at = NOW()`,
      [driver.driver_id, USER_ROLES.DRIVER, resetToken, resetCode]
    );

    // Send reset code via SMS
    try {
      await smsService.sendPasswordResetCode(phone_number, resetCode);
      
      // Send email if available
      if (driver.email) {
        await emailService.sendPasswordResetEmail(
          driver,
          resetToken,
          USER_ROLES.DRIVER
        );
      }
    } catch (notificationError) {
      logger.error('Error sending password reset notifications', { 
        error: notificationError.message 
      });
      // Continue even if notification sending fails
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
      { 
        phone_number: maskString(phone_number, 3, 3)
      }, 
      "รหัสรีเซ็ตถูกส่งไปยังเบอร์โทรศัพท์ของคุณ"
    ));
  } catch (error) {
    logger.error('Error requesting password reset', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Verify reset code and allow password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyResetCode = asyncHandler(async (req, res) => {
  const { phone_number, reset_code } = req.body;

  if (!phone_number || !reset_code) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุเบอร์โทรศัพท์และรหัสยืนยัน"
    ]);
  }

  try {
    // Check if user exists
    const drivers = await db.query(
      `SELECT driver_id FROM drivers WHERE phone_number = ?`,
      [phone_number]
    );

    if (drivers.length === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND, [
        "ไม่พบข้อมูลผู้ใช้"
      ]);
    }

    const driver = drivers[0];
    
    // Verify code
    const resets = await db.query(
      `SELECT token FROM password_resets 
       WHERE user_id = ? AND user_type = ? AND code = ? AND expires_at > NOW()`,
      [driver.driver_id, USER_ROLES.DRIVER, reset_code]
    );

    if (resets.length === 0) {
      throw new ValidationError("รหัสยืนยันไม่ถูกต้องหรือหมดอายุ");
    }

    // Return reset token for next step
    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      reset_token: resets[0].token
    }, "รหัสยืนยันถูกต้อง คุณสามารถตั้งรหัสผ่านใหม่ได้"));
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    logger.error('Error verifying reset code', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Reset driver password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ reset_token และรหัสผ่านใหม่"
    ]);
  }

  // Validate password strength
  const passwordStrength = passwordService.checkPasswordStrength(new_password);
  if (!passwordStrength.isStrong) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.WEAK_PASSWORD, [
      passwordStrength.feedback
    ]);
  }

  try {
    // Verify reset token
    const resets = await db.query(
      `SELECT user_id FROM password_resets 
       WHERE token = ? AND user_type = ? AND expires_at > NOW()`,
      [reset_token, USER_ROLES.DRIVER]
    );

    if (resets.length === 0) {
      throw new ValidationError("โทเค็นไม่ถูกต้องหรือหมดอายุ");
    }

    const driverId = resets[0].user_id;
    
    // In production, hash the password
    // const hashedPassword = await passwordService.hashPassword(new_password);
    
    // Update password
    const updateResult = await db.query(
      `UPDATE drivers SET password = ? WHERE driver_id = ?`,
      [new_password, driverId] // Should use hashedPassword in production
    );

    if (updateResult.affectedRows === 0) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND, [
        "ไม่พบบัญชีผู้ใช้"
      ]);
    }

    // Delete used reset token
    await db.query(
      `DELETE FROM password_resets WHERE token = ?`,
      [reset_token]
    );

    // Get driver info for notifications
    const drivers = await db.query(
      `SELECT phone_number, email FROM drivers WHERE driver_id = ?`,
      [driverId]
    );

    if (drivers.length > 0) {
      const driver = drivers[0];
      
      // Notify user about password change
      try {
        if (driver.email) {
          // Send email notification
          await emailService.sendEmail({
            to: driver.email,
            subject: "รหัสผ่านของคุณถูกเปลี่ยนแล้ว",
            text: "รหัสผ่านของคุณถูกเปลี่ยนแล้ว หากคุณไม่ได้ดำเนินการนี้ กรุณาติดต่อเจ้าหน้าที่โดยด่วน",
            html: `<p>รหัสผ่านของคุณถูกเปลี่ยนแล้ว</p><p>หากคุณไม่ได้ดำเนินการนี้ กรุณาติดต่อเจ้าหน้าที่โดยด่วน</p>`
          });
        }
      } catch (notificationError) {
        logger.error('Error sending password change notification', { 
          error: notificationError.message 
        });
        // Continue even if notification fails
      }
    }

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
      null, 
      "รีเซ็ตรหัสผ่านสำเร็จ"
    ));
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message));
    }
    logger.error('Error resetting password', { error: error.message });
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

export default {
  loginDriver,
  requestPasswordReset,
  verifyResetCode,
  resetPassword
};