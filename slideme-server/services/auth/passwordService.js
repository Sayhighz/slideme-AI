/**
 * Password service for hashing and verification
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import logger from '../../config/logger.js';

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} Random password
 */
export const generateRandomPassword = (length = 10) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one character from each category
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // Lowercase
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // Number
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // Special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Error hashing password', { error: error.message });
    throw error;
  }
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password', { error: error.message });
    throw error;
  }
};

/**
 * Generate a password reset token
 * @returns {string} Password reset token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} Strength assessment
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      isStrong: false,
      feedback: 'Password is required'
    };
  }
  
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  } else {
    score += Math.min(2, Math.floor(password.length / 4));
  }
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Calculate final strength
  const isStrong = score >= 4 && password.length >= 8;
  
  return {
    score,
    isStrong,
    feedback: feedback.length > 0 ? feedback.join(', ') : 'Password is strong'
  };
};

export default {
  generateRandomPassword,
  hashPassword,
  comparePassword,
  generateResetToken,
  checkPasswordStrength
};