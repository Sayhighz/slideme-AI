/**
 * File service for handling uploads and downloads
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import logger from '../../config/logger.js';
import env from '../../config/env.js';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify file system operations
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// Base upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
(async () => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    logger.info('Upload directory created or verified', { path: UPLOAD_DIR });
  } catch (error) {
    logger.error('Error creating upload directory', { error: error.message });
  }
})();

/**
 * Generate a unique filename
 * @param {string} originalFilename - Original filename
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalFilename);
  
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * Save uploaded file to disk
 * @param {Object} file - File object from multer
 * @param {string} subdir - Subdirectory under uploads (optional)
 * @returns {Promise<Object>} Saved file info
 */
export const saveFile = async (file, subdir = '') => {
  try {
    if (!file) {
      logger.warn('No file provided for saving');
      return null;
    }
    
    // Create subdirectory if specified
    const targetDir = subdir 
      ? path.join(UPLOAD_DIR, subdir)
      : UPLOAD_DIR;
      
    await mkdir(targetDir, { recursive: true });
    
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const filePath = path.join(targetDir, uniqueFilename);
    
    // Save file
    if (file.buffer) {
      // If file is provided as buffer (from memory)
      await writeFile(filePath, file.buffer);
    } else if (file.path) {
      // If file is provided as temporary path (from disk)
      const content = await readFile(file.path);
      await writeFile(filePath, content);
      
      // Remove temporary file
      try {
        await unlink(file.path);
      } catch (error) {
        logger.warn('Error deleting temporary file', { 
          path: file.path, 
          error: error.message 
        });
      }
    } else {
      logger.warn('Invalid file object, missing buffer or path', { file });
      return null;
    }
    
    logger.info('File saved successfully', { 
      originalName: file.originalname,
      savedAs: uniqueFilename,
      size: file.size,
      path: filePath
    });
    
    return {
      filename: uniqueFilename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url: `/upload/fetch_image?filename=${uniqueFilename}${subdir ? `&subdir=${subdir}` : ''}`
    };
  } catch (error) {
    logger.error('Error saving file', { 
      originalName: file?.originalname, 
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Get file from disk
 * @param {string} filename - Filename
 * @param {string} subdir - Subdirectory under uploads (optional)
 * @returns {Promise<Object>} File info and content
 */
export const getFile = async (filename, subdir = '') => {
  try {
    if (!filename) {
      logger.warn('No filename provided for retrieval');
      return null;
    }
    
    // Build file path
    const filePath = subdir
      ? path.join(UPLOAD_DIR, subdir, filename)
      : path.join(UPLOAD_DIR, filename);
    
    // Check if file exists
    try {
      await stat(filePath);
    } catch (error) {
      logger.warn('File does not exist', { filename, path: filePath });
      return null;
    }
    
    // Read file
    const content = await readFile(filePath);
    
    // Determine MIME type based on extension
    const extension = path.extname(filename).toLowerCase();
    let mimetype = 'application/octet-stream'; // Default MIME type
    
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        mimetype = 'image/jpeg';
        break;
      case '.png':
        mimetype = 'image/png';
        break;
      case '.gif':
        mimetype = 'image/gif';
        break;
      case '.pdf':
        mimetype = 'application/pdf';
        break;
      case '.txt':
        mimetype = 'text/plain';
        break;
      // Add more MIME types as needed
    }
    
    logger.info('File retrieved successfully', { filename, size: content.length });
    
    return {
      filename,
      mimetype,
      size: content.length,
      content
    };
  } catch (error) {
    logger.error('Error retrieving file', { filename, error: error.message });
    return null;
  }
};

/**
 * Delete file from disk
 * @param {string} filename - Filename
 * @param {string} subdir - Subdirectory under uploads (optional)
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (filename, subdir = '') => {
  try {
    if (!filename) {
      logger.warn('No filename provided for deletion');
      return false;
    }
    
    // Build file path
    const filePath = subdir
      ? path.join(UPLOAD_DIR, subdir, filename)
      : path.join(UPLOAD_DIR, filename);
    
    // Check if file exists before deleting
    try {
      await stat(filePath);
    } catch (error) {
      logger.warn('File does not exist for deletion', { filename, path: filePath });
      return false;
    }
    
    // Delete file
    await unlink(filePath);
    
    logger.info('File deleted successfully', { filename, path: filePath });
    
    return true;
  } catch (error) {
    logger.error('Error deleting file', { filename, error: error.message });
    return false;
  }
};

export default {
  saveFile,
  getFile,
  deleteFile,
  generateUniqueFilename
};