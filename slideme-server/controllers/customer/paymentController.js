import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { validatePaymentMethod } from "../../utils/validators/paymentValidator.js";

/**
 * Add payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addPaymentMethod = (req, res) => {
  const {
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    customer_id,
  } = req.body;

  // Validate payment data
  const validation = validatePaymentMethod(req.body);
  if (!validation.isValid) {
    return res.status(400).json(formatErrorResponse(validation.errors.join(', ')));
  }

  const sqlPaymentMethod = `
    INSERT INTO paymentmethod (method_name, card_number, card_expiry, card_cvv, cardholder_name, customer_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const valuesPaymentMethod = [
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    customer_id,
  ];

  con.query(sqlPaymentMethod, valuesPaymentMethod, (err, result) => {
    if (err) {
      logger.error('Error adding payment method', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    return res.status(201).json(formatSuccessResponse({
      PaymentId: result.insertId,
    }, "Payment method added successfully"));
  });
};

/**
 * Update payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePaymentMethod = (req, res) => {
  const {
    payment_method_id,
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
  } = req.body;

  if (!payment_method_id) {
    return res.status(400).json(formatErrorResponse("payment_method_id is required"));
  }

  // Validate required fields
  if (!method_name || !card_number || !card_expiry || !card_cvv || !cardholder_name) {
    return res.status(400).json(formatErrorResponse("All fields are required"));
  }

  const sql = `
    UPDATE paymentmethod
    SET method_name = ?, card_number = ?, card_expiry = ?, card_cvv = ?, cardholder_name = ?
    WHERE payment_method_id = ?
  `;

  const values = [
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    payment_method_id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error updating payment method', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("Payment method not found"));
    }

    return res.status(200).json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
    }, "Payment method updated successfully"));
  });
};

/**
 * Disable payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disablePaymentMethod = (req, res) => {
  const { payment_method_id } = req.body;

  if (!payment_method_id) {
    return res.status(400).json(formatErrorResponse("payment_method_id is required"));
  }

  const sql = `
    UPDATE paymentmethod
    SET is_active = 0
    WHERE payment_method_id = ?
  `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) {
      logger.error('Error disabling payment method', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("Payment method not found"));
    }

    return res.status(200).json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
    }, "Payment method disabled successfully"));
  });
};

/**
 * Get all user payment methods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllUserPaymentMethods = (req, res) => {
  const customer_id = req.query.customer_id || null;

  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("customer_id is required"));
  }

  const sql = `
    SELECT
      p.payment_id,
      pm.payment_method_id,
      pm.method_name,
      pm.card_number,
      pm.card_expiry,
      pm.cardholder_name,
      p.payment_status
    FROM payments p
    JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
    WHERE p.customer_id = ?;
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error getting payment methods', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("No payment methods found for this user"));
    }

    return res.status(200).json(formatSuccessResponse(result));
  });
};

/**
 * Get payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPaymentMethod = (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("customer_id is required"));
  }

  const sql = `
    SELECT 
      method_name, 
      card_number, 
      card_expiry, 
      cardholder_name
    FROM paymentmethod 
    WHERE customer_id = ? AND is_active = 1;
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error getting payment method', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("No payment methods found for this user"));
    }

    return res.status(200).json(formatSuccessResponse(result));
  });
};

/**
 * Delete payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteMethod = (req, res) => {
  const { payment_method_id } = req.params;

  if (!payment_method_id) {
    return res.status(400).json(formatErrorResponse("payment_method_id is required"));
  }

  const sql = `
    DELETE FROM paymentmethod
    WHERE payment_method_id = ?
  `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) {
      logger.error('Error deleting payment method', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("Payment method not found"));
    }
    
    return res.status(200).json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
    }, "Payment method deleted successfully"));
  });
};