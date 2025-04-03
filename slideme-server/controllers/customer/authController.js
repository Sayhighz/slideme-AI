import jwt from "jsonwebtoken";
import con from "../config/db.js";
import logger from "../../config/logger.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { ERROR_MESSAGES } from "../../utils/errors/errorMessages.js";

/**
 * Login customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginCustomer = (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json(formatErrorResponse("Please provide phone number"));
  }

  const sql = `SELECT customer_id, phone_number, first_name, last_name FROM customers WHERE phone_number = ?`;

  con.query(sql, [phone_number], (err, results) => {
    if (err) {
      logger.error('Database error during login', { error: err.message });
      return res.status(500).json(formatErrorResponse("Database error"));
    }

    if (results.length === 0) {
      return res.status(401).json(formatErrorResponse("Phone number not found"));
    }

    const customer = results[0];
    const token = jwt.sign(
      { customer_id: customer.customer_id, role: "customer" },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "24h" }
    );

    res.json(formatSuccessResponse({
      status: "success",
      token,
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name
    }));
  });
};

/**
 * Register customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerCustomer = (req, res) => {
  const { phone_number, first_name, last_name, email } = req.body;

  if (!phone_number) {
    return res.status(400).json(formatErrorResponse("Phone number is required"));
  }

  // Check if phone number already exists
  const checkSql = `SELECT customer_id FROM customers WHERE phone_number = ?`;
  
  con.query(checkSql, [phone_number], (err, results) => {
    if (err) {
      logger.error('Database error during registration check', { error: err.message });
      return res.status(500).json(formatErrorResponse("Database error"));
    }
    
    if (results.length > 0) {
      return res.status(409).json(formatErrorResponse("Phone number already registered"));
    }
    
    // Insert new customer
    const insertSql = `
      INSERT INTO customers 
      (phone_number, first_name, last_name, email, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    con.query(
      insertSql,
      [phone_number, first_name || null, last_name || null, email || null],
      (err, result) => {
        if (err) {
          logger.error('Database error during registration insert', { error: err.message });
          return res.status(500).json(formatErrorResponse("Database error"));
        }
        
        const token = jwt.sign(
          { customer_id: result.insertId, role: "customer" },
          process.env.JWT_SECRET || "jwt_secret_key",
          { expiresIn: "24h" }
        );
        
        res.status(201).json(formatSuccessResponse({
          status: "success",
          customer_id: result.insertId,
          token
        }, "Registration successful"));
      }
    );
  });
};

/**
 * Validate customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const validateCustomer = (req, res) => {
  const customerId = req.query.customer_id; 
  
  if (!customerId) {
    return res.status(400).json(formatErrorResponse("Please provide customer_id"));
  }
  
  const sql = `SELECT * FROM customers WHERE customer_id = ?`;

  con.query(sql, [customerId], (err, result) => {
    if (err) {
      logger.error('Error validating customer', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("No customer found with this ID"));
    }

    return res.status(200).json(formatSuccessResponse(result));
  });
};