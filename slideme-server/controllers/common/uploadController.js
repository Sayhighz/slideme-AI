/**
 * Common upload controller
 * Handles file uploads across the application
 */
import path from 'path';
import logger from '../../config/logger.js';
import { ValidationError, NotFoundError, CustomError } from '../../utils/errors/customErrors.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import fileService from '../../services/storage/fileService.js';
import imageService from '../../services/storage/imageService.js';

/**
 * Fetch image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const fetchImage = asyncHandler(async (req, res) => {
  const { filename, subdir } = req.query;

  if (!filename) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['filename']);
  }

  try {
    const file = await fileService.getFile(filename, subdir || '');

    if (!file) {
      throw new NotFoundError('ไม่พบไฟล์ที่ต้องการ');
    }

    // Set proper content type
    res.set('Content-Type', file.mimetype);
    
    // Set cache control for images
    if (file.mimetype.startsWith('image/')) {
      res.set('Cache-Control', 'public, max-age=86400'); // 1 day
    } else {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    // Set content disposition
    res.set('Content-Disposition', 'inline');

    return res.status(STATUS_CODES.OK).send(file.content);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Error retrieving image', { 
      filename, 
      subdir, 
      error: error.message 
    });
    
    throw new CustomError('เกิดข้อผิดพลาดในการดึงรูปภาพ', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Upload before service photos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadBeforeService = asyncHandler(async (req, res) => {
  // ตรวจสอบว่ามีไฟล์ upload เข้ามาหรือไม่
  if (!req.files || req.files.length === 0) {
    logger.error('No files received in request');
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, ['กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป']);
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id']);
  }

  logger.info(`Processing ${req.files.length} photos for before service upload`, {
    request_id,
    driver_id
  });

  // ตรวจสอบไฟล์ทั้งหมด
  for (const file of req.files) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, 
        [`ไฟล์ ${file.originalname} มีประเภทไม่ถูกต้อง ต้องเป็น jpg, png หรือ webp เท่านั้น`]);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.TOO_LARGE, 
        [`ไฟล์ ${file.originalname} มีขนาดใหญ่เกินไป ต้องไม่เกิน 5MB`]);
    }
  }

  try {
    const db = (await import('../../config/db.js')).default;
    const subdir = `services/${request_id}`;
    const savedFiles = [];

    // อัปโหลดและประมวลผลรูปภาพทั้งหมด
    for (const file of req.files) {
      // Process and optimize the image
      const savedFile = await imageService.processAndSaveImage(file, {
        width: 1200,
        quality: 85,
        subdir
      });

      if (!savedFile) {
        throw new Error(`Failed to save file: ${file.originalname}`);
      }

      savedFiles.push(savedFile);
    }

    // สร้าง JSON สำหรับเก็บรายการรูปภาพ
    const photosJson = JSON.stringify(savedFiles.map(file => ({
      filename: file.filename,
      url: file.url,
      position: file.originalname.includes('front') ? 'front' : 
               file.originalname.includes('back') ? 'back' : 
               file.originalname.includes('left') ? 'left' : 
               file.originalname.includes('right') ? 'right' : 'other'
    })));

    // ตรวจสอบว่ามีข้อมูลในตารางแล้วหรือไม่
    const logExists = await db.query(
      'SELECT log_id FROM driverlogs WHERE request_id = ? AND driver_id = ?',
      [request_id, driver_id]
    );
    
    if (logExists.length === 0) {
      // สร้างข้อมูลใหม่
      await db.query(
        `INSERT INTO driverlogs (request_id, driver_id, photos_before_service, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [request_id, driver_id, photosJson]
      );
    } else {
      // อัปเดตข้อมูลที่มีอยู่
      await db.query(
        `UPDATE driverlogs SET photos_before_service = ? WHERE request_id = ? AND driver_id = ?`,
        [photosJson, request_id, driver_id]
      );
    }

    logger.info('Before service photos uploaded successfully', { 
      request_id,
      driver_id,
      photoCount: savedFiles.length
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      request_id,
      driver_id,
      photo_type: 'before',
      files: savedFiles.map(file => ({
        filename: file.filename,
        url: file.url
      }))
    }, 'อัปโหลดรูปภาพก่อนให้บริการสำเร็จ'));
  } catch (error) {
    logger.error('Error uploading before service photos', { 
      request_id,
      driver_id,
      error: error.message 
    });
    
    throw new CustomError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Upload after service photos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadAfterService = asyncHandler(async (req, res) => {
  // ตรวจสอบว่ามีไฟล์ upload เข้ามาหรือไม่
  if (!req.files || req.files.length === 0) {
    logger.error('No files received in request');
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, ['กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป']);
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['request_id', 'driver_id']);
  }

  logger.info(`Processing ${req.files.length} photos for after service upload`, {
    request_id,
    driver_id
  });

  // ตรวจสอบไฟล์ทั้งหมด
  for (const file of req.files) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, 
        [`ไฟล์ ${file.originalname} มีประเภทไม่ถูกต้อง ต้องเป็น jpg, png หรือ webp เท่านั้น`]);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.TOO_LARGE, 
        [`ไฟล์ ${file.originalname} มีขนาดใหญ่เกินไป ต้องไม่เกิน 5MB`]);
    }
  }

  try {
    const db = (await import('../../config/db.js')).default;
    const subdir = `services/${request_id}`;
    const savedFiles = [];

    // อัปโหลดและประมวลผลรูปภาพทั้งหมด
    for (const file of req.files) {
      // Process and optimize the image
      const savedFile = await imageService.processAndSaveImage(file, {
        width: 1200,
        quality: 85,
        subdir
      });

      if (!savedFile) {
        throw new Error(`Failed to save file: ${file.originalname}`);
      }

      savedFiles.push(savedFile);
    }

    // สร้าง JSON สำหรับเก็บรายการรูปภาพ
    const photosJson = JSON.stringify(savedFiles.map(file => ({
      filename: file.filename,
      url: file.url,
      position: file.originalname.includes('front') ? 'front' : 
               file.originalname.includes('back') ? 'back' : 
               file.originalname.includes('left') ? 'left' : 
               file.originalname.includes('right') ? 'right' : 'other'
    })));

    // ตรวจสอบว่ามีข้อมูลในตารางแล้วหรือไม่
    const logExists = await db.query(
      'SELECT log_id FROM driverlogs WHERE request_id = ? AND driver_id = ?',
      [request_id, driver_id]
    );
    
    if (logExists.length === 0) {
      // สร้างข้อมูลใหม่
      await db.query(
        `INSERT INTO driverlogs (request_id, driver_id, photos_after_service, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [request_id, driver_id, photosJson]
      );
    } else {
      // อัปเดตข้อมูลที่มีอยู่
      await db.query(
        `UPDATE driverlogs SET photos_after_service = ? WHERE request_id = ? AND driver_id = ?`,
        [photosJson, request_id, driver_id]
      );
    }

    logger.info('After service photos uploaded successfully', { 
      request_id,
      driver_id,
      photoCount: savedFiles.length
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      request_id,
      driver_id,
      photo_type: 'after',
      files: savedFiles.map(file => ({
        filename: file.filename,
        url: file.url
      }))
    }, 'อัปโหลดรูปภาพหลังให้บริการสำเร็จ'));
  } catch (error) {
    logger.error('Error uploading after service photos', { 
      request_id,
      driver_id,
      error: error.message 
    });
    
    throw new CustomError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Upload image file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, ['กรุณาเลือกไฟล์ที่ต้องการอัพโหลด']);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, 
      ['ประเภทไฟล์ไม่ถูกต้อง ต้องเป็น jpg, png, gif หรือ webp เท่านั้น']);
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.TOO_LARGE, 
      ['ไฟล์มีขนาดใหญ่เกินไป ต้องไม่เกิน 5MB']);
  }

  try {
    // Get upload directory from query params or use default
    const subdir = req.query.type || 'images';
    
    // Resize and optimize image if requested
    let processedFile;
    
    if (req.query.resize === 'true') {
      // Resize options
      const width = parseInt(req.query.width) || 800;
      const height = parseInt(req.query.height) || null;
      const quality = parseInt(req.query.quality) || 80;
      
      // Process image
      processedFile = await imageService.processAndSaveImage(req.file, {
        width,
        height,
        quality,
        format: req.query.format,  // can be jpeg, png, webp
        subdir
      });
    } else {
      // Save original file
      processedFile = await fileService.saveFile(req.file, subdir);
    }

    if (!processedFile) {
      throw new Error('Failed to save file');
    }

    logger.info('File uploaded successfully', { 
      originalName: req.file.originalname,
      savedAs: processedFile.filename,
      size: processedFile.size,
      type: processedFile.mimetype
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      file: {
        filename: processedFile.filename,
        originalname: processedFile.originalname,
        size: processedFile.size,
        mimetype: processedFile.mimetype,
        url: processedFile.url
      }
    }, 'อัปโหลดไฟล์สำเร็จ'));
  } catch (error) {
    logger.error('Error uploading image', { 
      originalName: req.file?.originalname, 
      error: error.message 
    });
    
    throw new CustomError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Upload document file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, ['กรุณาเลือกไฟล์ที่ต้องการอัพโหลด']);
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, 
      ['ประเภทไฟล์ไม่ถูกต้อง ต้องเป็น pdf, doc, docx, xls, xlsx หรือ txt เท่านั้น']);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.TOO_LARGE, 
      ['ไฟล์มีขนาดใหญ่เกินไป ต้องไม่เกิน 10MB']);
  }

  try {
    // Save file to documents directory
    const savedFile = await fileService.saveFile(req.file, 'documents');

    if (!savedFile) {
      throw new Error('Failed to save file');
    }

    logger.info('Document uploaded successfully', { 
      originalName: req.file.originalname,
      savedAs: savedFile.filename,
      size: savedFile.size
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      file: {
        filename: savedFile.filename,
        originalname: savedFile.originalname,
        size: savedFile.size,
        mimetype: savedFile.mimetype,
        url: savedFile.url
      }
    }, 'อัปโหลดเอกสารสำเร็จ'));
  } catch (error) {
    logger.error('Error uploading document', { 
      originalName: req.file?.originalname, 
      error: error.message 
    });
    
    throw new CustomError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Upload driver profile photo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadDriverProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, ['กรุณาเลือกไฟล์ที่ต้องการอัพโหลด']);
  }

  const { driver_id } = req.body;

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['driver_id']);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE, 
      ['ประเภทไฟล์ไม่ถูกต้อง ต้องเป็น jpg, png หรือ webp เท่านั้น']);
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    throw new ValidationError(ERROR_MESSAGES.FILE_UPLOAD.TOO_LARGE, 
      ['ไฟล์มีขนาดใหญ่เกินไป ต้องไม่เกิน 5MB']);
  }

  try {
    // Process and optimize the image
    const subdir = `drivers/${driver_id}/profile`;
    const savedFile = await imageService.processAndSaveImage(req.file, {
      width: 500, // profile photo can be smaller
      quality: 85,
      subdir
    });

    if (!savedFile) {
      throw new Error('Failed to save file');
    }

    // Here you could update the driver profile in the database with the profile photo path
    // const db = (await import('../../config/db.js')).default;
    // await db.query('UPDATE drivers SET profile_photo = ? WHERE driver_id = ?', [savedFile.filename, driver_id]);

    logger.info('Driver profile photo uploaded successfully', { 
      driver_id,
      savedAs: savedFile.filename
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      driver_id,
      file: {
        filename: savedFile.filename,
        url: savedFile.url
      }
    }, 'อัปโหลดรูปโปรไฟล์สำเร็จ'));
  } catch (error) {
    logger.error('Error uploading driver profile photo', { 
      driver_id,
      originalName: req.file?.originalname, 
      error: error.message 
    });
    
    throw new CustomError(ERROR_MESSAGES.FILE_UPLOAD.UPLOAD_FAILED, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Delete file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const { filename, subdir } = req.body;

  if (!filename) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, ['filename']);
  }

  try {
    const result = await fileService.deleteFile(filename, subdir || '');

    if (!result) {
      throw new NotFoundError('ไม่พบไฟล์ที่ต้องการลบ');
    }

    logger.info('File deleted successfully', { 
      filename, 
      subdir 
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(null, 'ลบไฟล์สำเร็จ'));
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Error deleting file', { 
      filename, 
      subdir, 
      error: error.message 
    });
    
    throw new CustomError('เกิดข้อผิดพลาดในการลบไฟล์', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

export default {
  fetchImage,
  uploadBeforeService,
  uploadAfterService,
  uploadImage,
  uploadDocument,
  uploadDriverProfilePhoto,
  deleteFile
};