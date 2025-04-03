/**
 * Environment variables configuration and validation
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Check required environment variables
 * @param {Array} requiredVars - List of required environment variables
 * @returns {boolean} True if all required variables are present
 */
const checkRequiredEnvVars = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  return true;
};

// Define required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'JWT_EXPIRY'
];

// Check required environment variables
const envVarsValid = checkRequiredEnvVars(requiredEnvVars);

// Environment configuration
const env = {
  // General
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
  
  // Cors
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  
  // File uploads
  UPLOAD_PATH: process.env.UPLOAD_PATH || path.resolve(__dirname, '../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  
  // Validation
  ENV_VALID: envVarsValid,
  
  // API version
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default env;