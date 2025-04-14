/**
 * Driver-specific file upload middleware using Multer
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { ValidationError } from '../utils/errors/customErrors.js';
import { ERROR_MESSAGES } from '../utils/errors/errorMessages.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define base upload path
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
  logger.info('Created uploads directory', { path: UPLOAD_PATH });
}

// Configure storage for driver registration files
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = UPLOAD_PATH;
    
    // Define subdirectory based on file fieldname
    let subDir = 'drivers';
    
    if (file.fieldname === 'profile_picture') {
      subDir = 'drivers/profile';
    } else if (file.fieldname === 'thai_driver_license') {
      subDir = 'drivers/documents/thai_driver_license';
    } else if (file.fieldname === 'car_with_license_plate') {
      subDir = 'drivers/documents/car_with_license_plate';
    } else if (file.fieldname === 'vehicle_registration') {
      subDir = 'drivers/documents/vehicle_registration';
    }
    
    uploadDir = path.join(UPLOAD_PATH, subDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp, field name and original extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    
    cb(null, `${file.fieldname}-${timestamp}-${randomStr}${ext}`);
  }
});

// File filter for allowed image types
const imageFilter = (req, file, cb) => {
  // Define allowed image extensions
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedImageTypes.includes(ext)) {
    return cb(new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, [
      `ประเภทไฟล์ ${ext} ไม่ได้รับอนุญาต ต้องเป็น jpg, jpeg, png หรือ webp เท่านั้น`
    ]));
  }
  
  // Validate file mimetype
  if (!file.mimetype.startsWith('image/')) {
    return cb(new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, [
      'ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น'
    ]));
  }
  
  cb(null, true);
};

// Create multer upload instance for driver registration
const driverUpload = multer({
  storage: driverStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

/**
 * Configure fields for driver registration files
 */
const configureDriverUpload = driverUpload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'thai_driver_license', maxCount: 1 },
  { name: 'car_with_license_plate', maxCount: 1 },
  { name: 'vehicle_registration', maxCount: 1 }
]);

/**
 * Error handler for multer errors during upload
 */
const handleDriverUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer upload error', { error: err.message, code: err.code });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        Status: false,
        Error: 'ไฟล์มีขนาดใหญ่เกินไป ขนาดสูงสุดคือ 5MB'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        Status: false,
        Error: `ไฟล์ฟิลด์ "${err.field}" ไม่ถูกต้องหรือมีจำนวนเกินที่กำหนด`
      });
    }
    
    return res.status(400).json({
      Status: false,
      Error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message
    });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      Status: false,
      Error: err.message,
      details: err.errors
    });
  }
  
  next(err);
};

export {
  configureDriverUpload,
  handleDriverUploadErrors
};

export default configureDriverUpload;