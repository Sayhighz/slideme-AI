/**
 * Driver Registration Controller
 * Handles new driver registration with documents
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
import { maskString } from '../../utils/helpers/stringHelpers.js';
import { APPROVAL_STATUS } from '../../utils/constants/requestStatus.js';
import passwordService from '../../services/auth/passwordService.js';
import emailService from '../../services/communication/emailService.js';
import smsService from '../../services/communication/smsService.js';
import fileService from '../../services/storage/fileService.js';
import imageService from '../../services/storage/imageService.js';

/**
 * Register new driver with documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerDriver = asyncHandler(async (req, res) => {
  // Extract driver basic information from request body
  const { 
    phone_number, 
    password, 
    first_name, 
    last_name, 
    license_plate, 
    province,
    birth_date,
    id_expiry_date,
    vehicletype_id
  } = req.body;

  // Validate required fields
  if (!phone_number || !password || !first_name || !last_name || !license_plate) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      'กรุณากรอกข้อมูลให้ครบถ้วน (เบอร์โทร, รหัสผ่าน, ชื่อ, นามสกุล, ทะเบียนรถ)'
    ]);
  }

  // Validate phone number format
  if (!validatePhoneNumber(phone_number)) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.INVALID_PHONE, [
      'เบอร์โทรศัพท์ไม่ถูกต้อง'
    ]);
  }

  // Check uploaded files
  const requiredDocuments = ['thai_driver_license', 'car_with_license_plate', 'vehicle_registration'];
  const missingDocuments = [];

  for (const docType of requiredDocuments) {
    if (!req.files || !req.files[docType]) {
      missingDocuments.push(docType.replace(/_/g, ' '));
    }
  }

  if (missingDocuments.length > 0) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      `กรุณาอัปโหลดเอกสาร: ${missingDocuments.join(', ')}`
    ]);
  }

  try {
    // Check if phone number already exists
    const existingDrivers = await db.query(
      `SELECT driver_id FROM drivers WHERE phone_number = ?`,
      [phone_number]
    );

    if (existingDrivers.length > 0) {
      throw new ValidationError(ERROR_MESSAGES.RESOURCE.ALREADY_EXISTS, [
        'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว'
      ]);
    }

    // Check if license plate already exists
    const existingPlates = await db.query(
      `SELECT driver_id FROM drivers WHERE license_plate = ?`,
      [license_plate]
    );

    if (existingPlates.length > 0) {
      throw new ValidationError(ERROR_MESSAGES.RESOURCE.ALREADY_EXISTS, [
        'ทะเบียนรถนี้ถูกใช้งานแล้ว'
      ]);
    }

    // Begin transaction
    const connection = await db.beginTransaction();

    try {
      // Process and save profile picture if provided
      let profilePicturePath = null;
      if (req.files && req.files.profile_picture) {
        const profilePicture = req.files.profile_picture[0];
        const processedImage = await imageService.processAndSaveImage(profilePicture, {
          width: 500,
          quality: 85,
          subdir: 'drivers/profile'
        });
        
        if (processedImage) {
          profilePicturePath = processedImage.filename;
        }
      }

      // Process and store document files
      const documents = {};
      
      for (const docType of requiredDocuments) {
        if (req.files && req.files[docType]) {
          const file = req.files[docType][0];
          const subdir = `drivers/documents/${docType}`;
          
          const savedFile = await fileService.saveFile(file, subdir);
          
          if (savedFile) {
            documents[docType] = {
              filename: savedFile.filename,
              originalname: savedFile.originalname,
              url: savedFile.url,
              uploaded_at: new Date().toISOString()
            };
          }
        }
      }

      
      // Insert new driver
      const insertSql = `
        INSERT INTO drivers (
          phone_number, 
          password, 
          first_name, 
          last_name,
          license_plate,
          province,
          birth_date,
          id_expiry_date,
          vehicletype_id,
          profile_picture,
          documents,
          created_date,
          approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `;

      const values = [
        phone_number,
        password, 
        first_name,
        last_name,
        license_plate,
        province || "Unknown",
        birth_date || null,
        id_expiry_date || null,
        vehicletype_id || 1, // Default vehicle type
        profilePicturePath,
        JSON.stringify(documents),
        APPROVAL_STATUS.PENDING
      ];

      const result = await db.transactionQuery(connection, insertSql, values);
      const driverId = result.insertId;

      // Create driverdetails record
      const detailsSql = `INSERT INTO driverdetails (driver_id) VALUES (?)`;
      await db.transactionQuery(connection, detailsSql, [driverId]);

      // Commit transaction
      await db.commitTransaction(connection);

      // Send registration confirmation SMS
      try {
        const driverName = `${first_name} ${last_name}`.trim();
        smsService.sendDriverRegistrationSMS(phone_number, driverName);
      } catch (notificationError) {
        logger.error('Error sending registration SMS', { 
          error: notificationError.message 
        });
        // Don't fail registration if notification fails
      }

      logger.info('Driver registered successfully', { driverId, phone_number });

      return res.status(STATUS_CODES.CREATED).json(formatSuccessResponse({
        driver_id: driverId,
        first_name,
        last_name,
        phone_number: maskString(phone_number, 3, 3),
        approval_status: APPROVAL_STATUS.PENDING,
        documents_submitted: Object.keys(documents)
      }, "ลงทะเบียนสำเร็จ กรุณารอการตรวจสอบและอนุมัติจากทีมงาน"));
    } catch (transactionError) {
      // Rollback transaction in case of error
      await db.rollbackTransaction(connection);
      throw transactionError;
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatErrorResponse(error.message, error.errors));
    }
    
    logger.error('Error during driver registration', { error: error.message, stack: error.stack });
    
    if (error instanceof DatabaseError) {
      throw error;
    }
    
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

// checking phone number in table?
export const checkPhoneNumber = asyncHandler (async (req, res) => {
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

  const drivers = await db.query(
    `SELECT driver_id, approval_status, created_date 
     FROM drivers 
     WHERE phone_number = ?`,
    [phone_number]
  );

  if (drivers.length === 0) {
    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    }, "ไม่พบข้อมูลการลงทะเบียน"));
  }

  if (drivers.length > 0) {
    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
    }, "พบข้อมูลการลงทะเบียน"));
  }
});

export default {
  registerDriver,
  checkRegistrationStatus,
  checkPhoneNumber
};