/**
 * Error handling utilities
 */
import { CustomError, DatabaseError } from './customErrors.js';
import { formatErrorResponse } from '../formatters/responseFormatter.js';

/**
 * Global error handler for Express middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Get appropriate status code
  let statusCode = 500;
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
  }
  
  // Get error message and details
  let errorMessage = err.message || 'An unexpected error occurred';
  let errorDetails = null;
  
  // Handle validation errors
  if (err.name === 'ValidationError' && Array.isArray(err.errors)) {
    errorDetails = { validationErrors: err.errors };
  }
  
  // Handle database errors
  if (err instanceof DatabaseError && err.originalError) {
    errorDetails = { 
      sqlError: process.env.NODE_ENV === 'development' ? {
        code: err.originalError.code,
        sqlMessage: err.originalError.sqlMessage,
        sqlState: err.originalError.sqlState
      } : undefined
    };
  }
  
  // Return error response
  return res.status(statusCode).json(formatErrorResponse(
    errorMessage, 
    errorDetails
  ));
};

/**
 * Async handler wrapper to avoid try/catch in route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log error to console and optionally to external service
 * @param {Error} error - Error object
 * @param {string} source - Error source (e.g., module name)
 */
export const logError = (error, source = 'unknown') => {
  console.error(`[${source}] ${new Date().toISOString()} - Error:`, error);
  
  // Here you could add integration with external logging services
  // like Sentry, LogRocket, etc.
};