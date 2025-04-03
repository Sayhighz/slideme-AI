import mysql from 'mysql2';
import dotenv from 'dotenv';
import { logError } from '../utils/errors/errorHandler.js';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'slideme',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  waitForConnections: true,
  queueLimit: 0
};
// console.log(dbConfig)

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 * @param {function} callback - Callback function to handle success or error
 */
const testConnection = (callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      logError(err, 'Database Connection');
      console.error('❌ Failed to connect to the database:', err.message);
      return callback(false);
    }
    console.log('✅ Connected to MySQL database successfully');
    connection.release();
    callback(true);
  });
};

/**
 * Execute SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {function} callback - Callback function to handle results or error
 */
const query = (sql, params = [], callback) => {
  pool.execute(sql, params, (err, results) => {
    if (err) {
      logError(err, 'Database Query');
      return callback(err, null);
    }
    callback(null, results);
  });
};

/**
 * Begin a transaction
 * @param {function} callback - Callback function to handle connection or error
 */
const beginTransaction = (callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      logError(err, 'Begin Transaction');
      return callback(err, null);
    }
    connection.beginTransaction((err) => {
      if (err) {
        logError(err, 'Begin Transaction');
        connection.release();
        return callback(err, null);
      }
      callback(null, connection);
    });
  });
};

/**
 * Commit a transaction
 * @param {Object} connection - Connection with active transaction
 * @param {function} callback - Callback function to handle commit or error
 */
const commitTransaction = (connection, callback) => {
  connection.commit((err) => {
    if (err) {
      logError(err, 'Commit Transaction');
      connection.release();
      return callback(err);
    }
    connection.release();
    callback(null);
  });
};

/**
 * Rollback a transaction
 * @param {Object} connection - Connection with active transaction
 * @param {function} callback - Callback function to handle rollback or error
 */
const rollbackTransaction = (connection, callback) => {
  connection.rollback((err) => {
    if (err) {
      logError(err, 'Rollback Transaction');
    }
    connection.release();
    callback(err);
  });
};

/**
 * Execute SQL query within a transaction
 * @param {Object} connection - Connection with active transaction
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {function} callback - Callback function to handle results or error
 */
const transactionQuery = (connection, sql, params = [], callback) => {
  connection.execute(sql, params, (err, results) => {
    if (err) {
      logError(err, 'Transaction Query');
      return callback(err, null);
    }
    callback(null, results);
  });
};

export default {
  pool,
  query,
  testConnection,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  transactionQuery
};
