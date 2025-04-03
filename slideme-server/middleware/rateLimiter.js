/**
 * Rate limiting middleware to prevent abuse
 */
import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

// Create a store for rate limiter (in memory by default)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.originalUrl 
    });
    
    return res.status(429).json({
      Status: false,
      Error: 'เกิดข้อผิดพลาด: มีคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
    });
  }
});

// API-specific rate limiter for more sensitive endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('API rate limit exceeded', { 
      ip: req.ip, 
      path: req.originalUrl 
    });
    
    return res.status(429).json({
      Status: false,
      Error: 'เกิดข้อผิดพลาด: จำนวนคำร้องขอถึงขีดจำกัด กรุณาลองใหม่ในภายหลัง'
    });
  }
});

// Auth-specific rate limiter to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login/register attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Authentication rate limit exceeded', { 
      ip: req.ip, 
      path: req.originalUrl 
    });
    
    return res.status(429).json({
      Status: false,
      Error: 'เกิดข้อผิดพลาด: พยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในภายหลัง'
    });
  }
});

export {
  limiter as defaultRateLimiter,
  apiLimiter,
  authLimiter
};