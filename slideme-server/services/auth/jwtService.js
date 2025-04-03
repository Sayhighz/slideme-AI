/**
 * JWT service for token management
 */
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { UnauthorizedError } from '../../utils/errors/customErrors.js';

/**
 * Generate JWT token for a user
 * @param {Object} payload - Token payload (user data)
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
export const generateToken = (payload, options = {}) => {
  try {
    const defaultOptions = {
      expiresIn: env.JWT_EXPIRY
    };
    
    return jwt.sign(
      payload,
      env.JWT_SECRET,
      { ...defaultOptions, ...options }
    );
  } catch (error) {
    logger.error('Error generating JWT token', { error: error.message });
    throw error;
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new UnauthorizedError('Token is required');
    }
    
    // Remove Bearer prefix if present
    const tokenValue = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;
    
    return jwt.verify(tokenValue, env.JWT_SECRET);
  } catch (error) {
    logger.error('JWT verification error', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    }
    
    throw error;
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    // Remove Bearer prefix if present
    const tokenValue = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;
    
    return jwt.decode(tokenValue);
  } catch (error) {
    logger.error('JWT decode error', { error: error.message });
    return null;
  }
};

/**
 * Extract user information from token in request
 * @param {Object} req - Express request object
 * @returns {Object|null} User information or null if no token
 */
export const extractUserFromRequest = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    
    return verifyToken(token);
  } catch (error) {
    logger.error('Error extracting user from request', { error: error.message });
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
  extractUserFromRequest
};