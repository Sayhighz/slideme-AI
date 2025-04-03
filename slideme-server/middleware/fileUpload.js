/**
 * File upload middleware using Multer
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload path
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
  logger.info('Created uploads directory', { path: UPLOAD_PATH });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = UPLOAD_PATH;
    
    // Optionally create subdirectories based on file type or route
    if (req.uploadSubDir) {
      uploadDir = path.join(UPLOAD_PATH, req.uploadSubDir);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Define allowed extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    logger.warn('File type not allowed', { 
      filename: file.originalname,
      mimetype: file.mimetype
    });
    
    return cb(new Error('ประเภทไฟล์ไม่ได้รับอนุญาต'));
  }
  
  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024 // 5MB default
  }
});

/**
 * Handle multer errors
 */
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error', { error: err.message });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        Status: false,
        Error: 'ไฟล์มีขนาดใหญ่เกินไป ขนาดสูงสุดคือ 5MB'
      });
    }
    
    return res.status(400).json({
      Status: false,
      Error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message
    });
  }
  
  next(err);
};

/**
 * Set upload subdirectory
 * @param {string} subDir - Subdirectory name
 */
export const setUploadSubDir = (subDir) => {
  return (req, res, next) => {
    req.uploadSubDir = subDir;
    next();
  };
};

export {
  upload,
  setUploadSubDir,
  handleUploadErrors
};

export default upload;