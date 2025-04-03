import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { STATUS_CODES } from "../../utils/constants/statusCodes.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { validatePaymentMethod } from "../../utils/validators/paymentValidator.js";
import { maskString } from "../../utils/helpers/stringHelpers.js";
import { formatCardNumber } from "../../utils/helpers/stringHelpers.js";

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
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse(validation.errors.join(', '))
    );
  }

  const sqlPaymentMethod = `
    INSERT INTO paymentmethod (
      method_name, 
      card_number, 
      card_expiry, 
      card_cvv, 
      cardholder_name, 
      customer_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const maskedCardNumber = maskString(card_number);
  const formattedCardNumber = formatCardNumber(card_number);

  const valuesPaymentMethod = [
    method_name,
    formattedCardNumber,
    card_expiry,
    card_cvv,
    cardholder_name,
    customer_id,
  ];

  con.query(sqlPaymentMethod, valuesPaymentMethod, (err, result) => {
    if (err) {
      logger.error('Error adding payment method', { 
        error: err.message,
        method: method_name,
        maskedCardNumber 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('เกิดข้อผิดพลาดในการเพิ่มวิธีการชำระเงิน')
      );
    }

    return res.status(STATUS_CODES.CREATED).json(
      formatSuccessResponse({
        PaymentId: result.insertId,
        MaskedCardNumber: maskedCardNumber
      }, "เพิ่มวิธีการชำระเงินสำเร็จ")
    );
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

  // Validate required fields
  if (!payment_method_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("payment_method_id is required")
    );
  }

  // Validate payment data
  const validation = validatePaymentMethod(req.body);
  if (!validation.isValid) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse(validation.errors.join(', '))
    );
  }

  const sql = `
    UPDATE paymentmethod
    SET 
      method_name = ?, 
      card_number = ?, 
      card_expiry = ?, 
      card_cvv = ?, 
      cardholder_name = ?
    WHERE payment_method_id = ?
  `;

  const maskedCardNumber = maskString(card_number);
  const formattedCardNumber = formatCardNumber(card_number);

  const values = [
    method_name,
    formattedCardNumber,
    card_expiry,
    card_cvv,
    cardholder_name,
    payment_method_id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error updating payment method', { 
        error: err.message,
        method: method_name,
        maskedCardNumber 
      });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse('เกิดข้อผิดพลาดในการอัปเดตวิธีการชำระเงิน')
      );
    }

    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบวิธีการชำระเงิน")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
        MaskedCardNumber: maskedCardNumber
      }, "อัปเดตวิธีการชำระเงินสำเร็จ")
    );
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
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("payment_method_id is required")
    );
  }

  const sql = `
    UPDATE paymentmethod
    SET is_active = 0
    WHERE payment_method_id = ?
  `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) {
      logger.error('Error disabling payment method', { error: err.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(err.message)
      );
    }

    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบวิธีการชำระเงิน")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
      }, "ปิดใช้งานวิธีการชำระเงินสำเร็จ")
    );
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
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("customer_id is required")
    );
  }

  const sql = `
    SELECT
      payment_method_id,
      method_name,
      card_number,
      card_expiry,
      cardholder_name,
      is_active
    FROM paymentmethod 
    WHERE customer_id = ?
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error getting payment methods', { error: err.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(err.message)
      );
    }

    // Mask card numbers
    const maskedResult = result.map(method => ({
      ...method,
      card_number: maskString(method.card_number)
    }));

    if (maskedResult.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบวิธีการชำระเงินสำหรับผู้ใช้รายนี้")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(maskedResult)
    );
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
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("payment_method_id is required")
    );
  }

  const sql = `
    DELETE FROM paymentmethod
    WHERE payment_method_id = ?
  `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) {
      logger.error('Error deleting payment method', { error: err.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(err.message)
      );
    }

    if (result.affectedRows === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบวิธีการชำระเงิน")
      );
    }
    
    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse({
        AffectedRows: result.affectedRows,
      }, "ลบวิธีการชำระเงินสำเร็จ")
    );
  });
};

/**
 * Get payment method for a specific customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPaymentMethod = (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse("customer_id is required")
    );
  }

  const sql = `
    SELECT 
      payment_method_id,
      method_name, 
      card_number, 
      card_expiry, 
      cardholder_name
    FROM paymentmethod 
    WHERE customer_id = ? AND is_active = 1
    LIMIT 1;
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error getting payment method', { error: err.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(err.message)
      );
    }

    // Mask card number
    const maskedResult = result.map(method => ({
      ...method,
      card_number: maskString(method.card_number)
    }));

    if (maskedResult.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json(
        formatErrorResponse("ไม่พบวิธีการชำระเงินสำหรับผู้ใช้รายนี้")
      );
    }

    return res.status(STATUS_CODES.OK).json(
      formatSuccessResponse(maskedResult[0])
    );
  });
};

export default {
  addPaymentMethod,
  updatePaymentMethod,
  disablePaymentMethod,
  getAllUserPaymentMethods,
  getPaymentMethod,
  deleteMethod
};