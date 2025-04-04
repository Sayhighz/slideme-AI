import db from "../../config/db.js";
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
export const addPaymentMethod = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sqlPaymentMethod, valuesPaymentMethod);

    return res.status(STATUS_CODES.CREATED).json(
      formatSuccessResponse({
        PaymentId: result.insertId,
        MaskedCardNumber: maskedCardNumber
      }, "เพิ่มวิธีการชำระเงินสำเร็จ")
    );
  } catch (err) {
    logger.error('Error adding payment method', { 
      error: err.message,
      method: req.body.method_name,
      maskedCardNumber: maskString(req.body.card_number)
    });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('เกิดข้อผิดพลาดในการเพิ่มวิธีการชำระเงิน')
    );
  }
};

/**
 * Update payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePaymentMethod = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sql, values);

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
  } catch (err) {
    logger.error('Error updating payment method', { 
      error: err.message,
      method: req.body.method_name,
      maskedCardNumber: maskString(req.body.card_number)
    });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse('เกิดข้อผิดพลาดในการอัปเดตวิธีการชำระเงิน')
    );
  }
};

/**
 * Disable payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disablePaymentMethod = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sql, [payment_method_id]);

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
  } catch (err) {
    logger.error('Error disabling payment method', { error: err.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(err.message)
    );
  }
};

/**
 * Get all user payment methods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllUserPaymentMethods = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sql, [customer_id]);

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
  } catch (err) {
    logger.error('Error getting payment methods', { error: err.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(err.message)
    );
  }
};

/**
 * Delete payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteMethod = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sql, [payment_method_id]);

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
  } catch (err) {
    logger.error('Error deleting payment method', { error: err.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(err.message)
    );
  }
};

/**
 * Get payment method for a specific customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPaymentMethod = async (req, res) => {
  try {
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

    // Use async/await with db.query
    const result = await db.query(sql, [customer_id]);

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
  } catch (err) {
    logger.error('Error getting payment method', { error: err.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
      formatErrorResponse(err.message)
    );
  }
};

export default {
  addPaymentMethod,
  updatePaymentMethod,
  disablePaymentMethod,
  getAllUserPaymentMethods,
  getPaymentMethod,
  deleteMethod
};