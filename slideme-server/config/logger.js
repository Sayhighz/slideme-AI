/**
 * Application logging configuration
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file streams
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

/**
 * Get numeric log level from string
 * @param {string} levelString - Log level string
 * @returns {number} Numeric log level
 */
const getLogLevel = (levelString) => {
  const level = LOG_LEVELS[levelString?.toUpperCase()];
  return level !== undefined ? level : LOG_LEVELS.INFO;
};

// Current log level from environment
const currentLogLevel = getLogLevel(env.LOG_LEVEL);

/**
 * Check if a log level should be logged
 * @param {string} level - Log level to check
 * @returns {boolean} True if the level should be logged
 */
const shouldLog = (level) => {
  return getLogLevel(level) <= currentLogLevel;
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0
    ? ` ${JSON.stringify(meta)}`
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
};

/**
 * Log a message to console and file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const log = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;
  
  const formattedMessage = formatLogMessage(level, message, meta);
  
  // Log to console
  if (env.IS_DEVELOPMENT) {
    if (level.toUpperCase() === 'ERROR') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }
  
  // Log to file
  if (level.toUpperCase() === 'ERROR') {
    errorLogStream.write(formattedMessage);
  } else {
    accessLogStream.write(formattedMessage);
  }
};

// Logger methods
const logger = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  http: (message, meta) => log('http', message, meta),
  debug: (message, meta) => log('debug', message, meta),
  
  // Express middleware for HTTP request logging
  httpLogger: (req, res, next) => {
    const startTime = new Date();
    
    // Process the request
    next();
    
    // Log after response is sent
    res.on('finish', () => {
      const endTime = new Date();
      const duration = endTime - startTime;
      
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };
      
      logger.http(`${req.method} ${req.originalUrl}`, logData);
    });
  }
};

export default logger;