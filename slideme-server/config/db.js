/**
 * Database connection configuration
 */
import mysql from 'mysql2/promise';
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

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully');
    connection.release();
    return true;
  } catch (error) {
    logError(error, 'Database Connection');
    console.error('❌ Failed to connect to the database:', error.message);
    return false;
  }
};

/**
 * Execute SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logError(error, 'Database Query');
    throw error;
  }
};

/**
 * Begin a transaction
 * @returns {Object} Transaction connection
 */
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Commit a transaction
 * @param {Object} connection - Connection with active transaction
 */
const commitTransaction = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};

/**
 * Rollback a transaction
 * @param {Object} connection - Connection with active transaction
 */
const rollbackTransaction = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

/**
 * Execute SQL query within a transaction
 * @param {Object} connection - Connection with active transaction
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const transactionQuery = async (connection, sql, params = []) => {
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    logError(error, 'Transaction Query');
    throw error;
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