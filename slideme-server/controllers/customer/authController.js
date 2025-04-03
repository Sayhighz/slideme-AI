import jwt from "jsonwebtoken";
import db from "../../config/db.js";
import logger from "../../config/logger.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { STATUS_CODES } from "../../utils/constants/statusCodes.js";
import { ERROR_MESSAGES } from "../../utils/errors/errorMessages.js";
import { validatePhoneNumber } from "../../utils/validators/userValidator.js";
import emailService from "../../services/communication/emailService.js";
import smsService from "../../services/communication/smsService.js";

/**
 * Login customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const loginCustomer = async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate phone number
    if (!phone_number) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD)
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone_number)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.INVALID_PHONE)
      );
    }

    // Query customer
    const [customer] = await db.query(
      `SELECT customer_id, phone_number, first_name, last_name, email 
       FROM customers 
       WHERE phone_number = ?`,
      [phone_number]
    );

    // Check if customer exists
    if (!customer) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(
        formatErrorResponse(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS)
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customer_id: customer.customer_id, 
        role: "customer" 
      },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "24h" }
    );

    // Optional: Send welcome SMS
    try {
      await smsService.sendWelcomeSMS(phone_number, customer.first_name);
    } catch (smsError) {
      logger.warn('Failed to send welcome SMS', { error: smsError.message });
    }

    // Optional: Send welcome email if email exists
    if (customer.email) {
      try {
        await emailService.sendWelcomeEmail(customer);
      } catch (emailError) {
        logger.warn('Failed to send welcome email', { error: emailError.message });
      }
    }

    // Log successful login
    logger.info('Customer login successful', { customer_id: customer.customer_id });

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        customer_id: customer.customer_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        token
      }, "Login successful")
    );

  } catch (error) {
    logger.error('Login error', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR)
    );
  }
};

/**
 * Register customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerCustomer = async (req, res) => {
  try {
    const { 
      phone_number, 
      first_name, 
      last_name, 
      email,
      birth_date 
    } = req.body;

    // Validate required fields
    if (!phone_number) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD)
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone_number)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.INVALID_PHONE)
      );
    }

    // Optional email validation
    if (email && !validateEmail(email)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL)
      );
    }

    // Check if phone number already exists
    const [existingCustomer] = await db.query(
      `SELECT customer_id FROM customers WHERE phone_number = ?`,
      [phone_number]
    );

    if (existingCustomer) {
      return res.status(STATUS_CODES.CONFLICT).json(
        formatErrorResponse(ERROR_MESSAGES.RESOURCE.ALREADY_EXISTS)
      );
    }

    // Insert new customer
    const result = await db.query(
      `INSERT INTO customers 
       (phone_number, first_name, last_name, email, birth_date, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        phone_number, 
        first_name || null, 
        last_name || null, 
        email || null,
        birth_date || null
      ]
    );

    const customer_id = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { 
        customer_id, 
        role: "customer" 
      },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "24h" }
    );

    // Send welcome SMS
    try {
      await smsService.sendWelcomeSMS(phone_number, first_name);
    } catch (smsError) {
      logger.warn('Failed to send welcome SMS', { error: smsError.message });
    }

    // Send welcome email if email exists
    if (email) {
      try {
        await emailService.sendWelcomeEmail({ 
          customer_id, 
          phone_number, 
          first_name, 
          last_name, 
          email 
        });
      } catch (emailError) {
        logger.warn('Failed to send welcome email', { error: emailError.message });
      }
    }

    // Log successful registration
    logger.info('Customer registration successful', { customer_id });

    return res.status(STATUS_CODES.CREATED).json(
      formatSuccessResponse({
        customer_id,
        token
      }, "Registration successful")
    );

  } catch (error) {
    logger.error('Registration error', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR)
    );
  }
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const validateCustomer = async (req, res) => {
  try {
    const { customer_id } = req.query;

    // Validate input
    if (!customer_id) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(
        formatErrorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD)
      );
    }

    // Query customer details
    const [customer] = await db.query(
      `SELECT 
        customer_id, 
        phone_number, 
        first_name, 
        last_name, 
        email, 
        created_at 
      FROM customers 
      WHERE customer_id = ?`,
      [customer_id]
    );

    // Check if customer exists
    if (!customer) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse(ERROR_MESSAGES.RESOURCE.NOT_FOUND)
      );
    }

    // Log validation attempt
    logger.info('Customer validation successful', { customer_id });

    // Return customer details
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(customer, "Customer validation successful")
    );

  } catch (error) {
    logger.error('Customer validation error', { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(ERROR_MESSAGES.GENERAL.SERVER_ERROR)
    );
  }
};

export default {
  loginCustomer,
  registerCustomer,
  validateCustomer
};