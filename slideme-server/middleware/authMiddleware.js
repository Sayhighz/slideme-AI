/**
 * Authentication middleware for validating JWT tokens
 */
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { UnauthorizedError } from '../utils/errors/customErrors.js';

/**
 * Verify JWT token from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from request headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        Status: false,
        Error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_key', (err, decoded) => {
      if (err) {
        logger.warn('Invalid token', { error: err.message });
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            Status: false,
            Error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
          });
        }
        
        return res.status(401).json({
          Status: false,
          Error: 'Token ไม่ถูกต้อง'
        });
      }
      
      // Add user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Error in authentication middleware', { error: error.message });
    next(new UnauthorizedError('การตรวจสอบสิทธิ์ล้มเหลว'));
  }
};

/**
 * Check if user has required role
 * @param {Array|string} roles - Allowed roles
 */
export const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          Status: false,
          Error: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ'
        });
      }
      
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Insufficient permissions', { 
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles
        });
        
        return res.status(403).json({
          Status: false,
          Error: 'ไม่มีสิทธิ์เข้าถึงทรัพยากรนี้'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error in role verification middleware', { error: error.message });
      next(new UnauthorizedError('การตรวจสอบสิทธิ์ล้มเหลว'));
    }
  };
};

export default {
  verifyToken,
  hasRole
};