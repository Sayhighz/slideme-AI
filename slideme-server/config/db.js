import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

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

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logger.info('✅ Connected to MySQL database successfully');
    return true;
  } catch (err) {
    logger.error('❌ Failed to connect to the database', { error: err.message });
    return false;
  }
};

/**
 * Execute SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
  try {
    // Ensure all parameters are converted to the right type
    const safeParams = params.map(param => 
      param === undefined ? null : 
      param === '' ? null : 
      param
    );

    const [rows] = await pool.execute(sql, safeParams);
    return rows;
  } catch (err) {
    logger.error('Database Query Error', { 
      sql, 
      params, 
      error: err.message,
      // Include additional context to help debugging
      errorCode: err.code,
      sqlState: err.sqlState,
      originalStack: err.stack 
    });
    throw err;
  }
};

/**
 * Begin a transaction
 * @returns {Promise<Connection>} Database connection with active transaction
 */
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Commit a transaction
 * @param {Connection} connection - Connection with active transaction
 */
const commitTransaction = async (connection) => {
  try {
    await connection.commit();
    connection.release();
  } catch (err) {
    logger.error('Commit Transaction Error', { error: err.message });
    throw err;
  }
};

/**
 * Rollback a transaction
 * @param {Connection} connection - Connection with active transaction
 */
const rollbackTransaction = async (connection) => {
  try {
    await connection.rollback();
    connection.release();
  } catch (err) {
    logger.error('Rollback Transaction Error', { error: err.message });
    throw err;
  }
};

/**
 * Execute SQL query within a transaction
 * @param {Connection} connection - Connection with active transaction
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const transactionQuery = async (connection, sql, params = []) => {
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (err) {
    logger.error('Transaction Query Error', { 
      sql, 
      params, 
      error: err.message 
    });
    throw err;
  }
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