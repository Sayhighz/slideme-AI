/**
 * Global error handling middleware
 */
import logger from '../config/logger.js';
import { 
  CustomError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  DatabaseError 
} from '../utils/errors/customErrors.js';

/**
 * Middleware for handling all application errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error handler caught error', { 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  // Handle different types of errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      Status: false,
      Error: err.message,
      details: err.errors
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      Status: false,
      Error: err.message
    });
  }
  
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      Status: false,
      Error: err.message
    });
  }
  
  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      Status: false,
      Error: err.message
    });
  }
  
  if (err instanceof DatabaseError) {
    // Don't expose detailed database errors in production
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'เกิดข้อผิดพลาดภายในฐานข้อมูล'
      : err.message;
      
    return res.status(500).json({
      Status: false,
      Error: errorMessage
    });
  }
  
  if (err instanceof CustomError) {
    return res.status(err.statusCode || 500).json({
      Status: false,
      Error: err.message
    });
  }
  
  // Default server error for unexpected errors
  return res.status(500).json({
    Status: false,
    Error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
};

/**
 * Async handler wrapper to avoid try/catch in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  asyncHandler
};