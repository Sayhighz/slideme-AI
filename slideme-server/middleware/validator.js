/**
 * Request validation middleware
 */
import { ValidationError } from '../utils/errors/customErrors.js';
import logger from '../config/logger.js';

/**
 * Validate request data against a schema
 * @param {Function} schemaValidator - Validation function that returns {isValid, errors}
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schemaValidator, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schemaValidator(data);
      
      if (!result.isValid) {
        logger.warn('Validation failed', { 
          errors: result.errors,
          source,
          path: req.originalUrl
        });
        
        throw new ValidationError('ข้อมูลไม่ถูกต้อง', result.errors);
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.error('Error in validation middleware', { error: error.message });
        next(new ValidationError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'));
      }
    }
  };
};

/**
 * Validate required fields
 * @param {Array} fields - Array of required field names
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
export const validateRequired = (fields, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const missingFields = fields.filter(field => {
        return data[field] === undefined || data[field] === null || data[field] === '';
      });
      
      if (missingFields.length > 0) {
        logger.warn('Missing required fields', { 
          missingFields,
          source,
          path: req.originalUrl
        });
        
        throw new ValidationError('กรุณากรอกข้อมูลให้ครบถ้วน', {
          fields: missingFields,
          message: 'ข้อมูลต่อไปนี้จำเป็นต้องระบุ: ' + missingFields.join(', ')
        });
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.error('Error in required fields validation', { error: error.message });
        next(new ValidationError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลที่จำเป็น'));
      }
    }
  };
};

/**
 * Sanitize request data
 * @param {Array} fields - Array of field names to sanitize
 * @param {string} source - Request property to sanitize ('body', 'query', 'params')
 */
export const sanitize = (fields, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      
      fields.forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
          // Basic sanitization: trim whitespace and remove HTML tags
          data[field] = data[field].trim().replace(/<[^>]*>/g, '');
        }
      });
      
      next();
    } catch (error) {
      logger.error('Error in sanitization middleware', { error: error.message });
      next(error);
    }
  };
};

export default {
  validate,
  validateRequired,
  sanitize
};