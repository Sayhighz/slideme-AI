/**
 * Request logging middleware
 */
import logger from '../config/logger.js';

/**
 * Log details of incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  // Get current timestamp
  const startTime = Date.now();
  
  // Log request details
  logger.http(`Incoming request`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response details after request is completed
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(`Server error response`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`Client error response`, logData);
    } else {
      logger.http(`Request completed`, logData);
    }
  });
  
  next();
};

export default requestLogger;