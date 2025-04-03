/**
 * Image processing service
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import logger from '../../config/logger.js';
import fileService from './fileService.js';

// Promisify file system operations
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

/**
 * Resize an image
 * @param {Buffer|string} input - Image buffer or file path
 * @param {Object} options - Resize options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height (optional)
 * @param {boolean} options.fit - Fit method (cover, contain, fill, etc.)
 * @returns {Promise<Buffer>} Resized image buffer
 */
export const resizeImage = async (input, options = { width: 800, fit: 'cover' }) => {
  try {
    if (!input) {
      logger.warn('No input provided for image resizing');
      return null;
    }
    
    // Process with sharp
    let sharpInstance;
    
    if (Buffer.isBuffer(input)) {
      sharpInstance = sharp(input);
    } else if (typeof input === 'string') {
      sharpInstance = sharp(input);
    } else {
      logger.warn('Invalid input type for image resizing', { type: typeof input });
      return null;
    }
    
    // Apply resize
    const resizeOptions = {
      width: options.width,
      fit: options.fit || 'cover'
    };
    
    if (options.height) {
      resizeOptions.height = options.height;
    }
    
    const resizedBuffer = await sharpInstance
      .resize(resizeOptions)
      .toBuffer();
    
    logger.info('Image resized successfully', { 
      originalSize: Buffer.isBuffer(input) ? input.length : 'unknown',
      newSize: resizedBuffer.length,
      dimensions: `${options.width}x${options.height || 'auto'}`
    });
    
    return resizedBuffer;
  } catch (error) {
    logger.error('Error resizing image', { error: error.message });
    return null;
  }
};

/**
 * Convert image format
 * @param {Buffer|string} input - Image buffer or file path
 * @param {string} format - Target format (jpeg, png, webp, etc.)
 * @param {Object} options - Format-specific options
 * @returns {Promise<Buffer>} Converted image buffer
 */
export const convertFormat = async (input, format = 'jpeg', options = {}) => {
  try {
    if (!input) {
      logger.warn('No input provided for image conversion');
      return null;
    }
    
    // Process with sharp
    let sharpInstance;
    
    if (Buffer.isBuffer(input)) {
      sharpInstance = sharp(input);
    } else if (typeof input === 'string') {
      sharpInstance = sharp(input);
    } else {
      logger.warn('Invalid input type for image conversion', { type: typeof input });
      return null;
    }
    
    // Apply conversion
    let outputBuffer;
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        outputBuffer = await sharpInstance
          .jpeg({ quality: options.quality || 80 })
          .toBuffer();
        break;
      case 'png':
        outputBuffer = await sharpInstance
          .png({ compressionLevel: options.compressionLevel || 6 })
          .toBuffer();
        break;
      case 'webp':
        outputBuffer = await sharpInstance
          .webp({ quality: options.quality || 80 })
          .toBuffer();
        break;
      default:
        logger.warn('Unsupported output format', { format });
        return null;
    }
    
    logger.info('Image converted successfully', { 
      format,
      originalSize: Buffer.isBuffer(input) ? input.length : 'unknown',
      newSize: outputBuffer.length
    });
    
    return outputBuffer;
  } catch (error) {
    logger.error('Error converting image format', { 
      format, 
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Process and save an image
 * @param {Object} file - File object from multer
 * @param {Object} options - Processing options
 * @param {number} options.width - Resize width (optional)
 * @param {number} options.height - Resize height (optional)
 * @param {string} options.format - Output format (optional)
 * @param {string} options.subdir - Subdirectory for storing (optional)
 * @returns {Promise<Object>} Processed file info
 */
export const processAndSaveImage = async (file, options = {}) => {
  try {
    if (!file) {
      logger.warn('No file provided for image processing');
      return null;
    }
    
    // Get image buffer
    let imageBuffer;
    
    if (file.buffer) {
      imageBuffer = file.buffer;
    } else if (file.path) {
      // Read from temporary path
      imageBuffer = await promisify(fs.readFile)(file.path);
    } else {
      logger.warn('Invalid file object, missing buffer or path', { file });
      return null;
    }
    
    // Apply processing if needed
    let processedBuffer = imageBuffer;
    
    // Resize if dimensions specified
    if (options.width || options.height) {
      processedBuffer = await resizeImage(processedBuffer, {
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover'
      });
      
      if (!processedBuffer) {
        logger.warn('Image resize failed');
        return null;
      }
    }
    
    // Convert format if specified
    if (options.format) {
      processedBuffer = await convertFormat(processedBuffer, options.format, {
        quality: options.quality
      });
      
      if (!processedBuffer) {
        logger.warn('Image format conversion failed');
        return null;
      }
    }
    
    // Create a new file object with processed buffer
    const processedFile = {
      ...file,
      buffer: processedBuffer,
      size: processedBuffer.length
    };
    
    // If format was changed, update filename extension
    if (options.format) {
      const parsedPath = path.parse(file.originalname);
      processedFile.originalname = `${parsedPath.name}.${options.format}`;
    }
    
    // Save the processed file
    const savedFile = await fileService.saveFile(processedFile, options.subdir);
    
    // Clean up temporary file if it exists
    if (file.path) {
      try {
        await unlink(file.path);
      } catch (error) {
        logger.warn('Error deleting temporary file', { 
          path: file.path, 
          error: error.message 
        });
      }
    }
    
    logger.info('Image processed and saved successfully', { 
      originalName: file.originalname,
      savedAs: savedFile.filename,
      processing: options
    });
    
    return savedFile;
  } catch (error) {
    logger.error('Error processing and saving image', { 
      originalName: file?.originalname, 
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Get image metadata
 * @param {Buffer|string} input - Image buffer or file path
 * @returns {Promise<Object>} Image metadata
 */
export const getImageMetadata = async (input) => {
  try {
    if (!input) {
      logger.warn('No input provided for metadata extraction');
      return null;
    }
    
    // Process with sharp
    let sharpInstance;
    
    if (Buffer.isBuffer(input)) {
      sharpInstance = sharp(input);
    } else if (typeof input === 'string') {
      sharpInstance = sharp(input);
    } else {
      logger.warn('Invalid input type for metadata extraction', { type: typeof input });
      return null;
    }
    
    // Get metadata
    const metadata = await sharpInstance.metadata();
    
    logger.info('Image metadata extracted successfully');
    
    return metadata;
  } catch (error) {
    logger.error('Error extracting image metadata', { error: error.message });
    return null;
  }
};

export default {
  resizeImage,
  convertFormat,
  processAndSaveImage,
  getImageMetadata
};