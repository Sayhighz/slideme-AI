/**
 * SMS service for sending text messages
 */
import axios from 'axios';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

// SMS provider URL and API key from environment variables
const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;

/**
 * Send SMS message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} SMS sending result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Format phone number (remove non-digit characters)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error('Invalid phone number');
    }
    
    // If not in production, log SMS instead of sending
    if (!env.IS_PRODUCTION) {
      logger.info('SMS would be sent in production', { phoneNumber: formattedPhone, message });
      return { success: true, messageId: 'debug' };
    }
    
    // Check if SMS provider is configured
    if (!SMS_API_URL || !SMS_API_KEY) {
      logger.warn('SMS API not configured, skipping send');
      return { success: false, error: 'SMS API not configured' };
    }
    
    // Send SMS via API
    const response = await axios.post(SMS_API_URL, {
      apiKey: SMS_API_KEY,
      phoneNumber: formattedPhone,
      message,
      sender: process.env.SMS_SENDER || 'SlideMe'
    });
    
    logger.info('SMS sent successfully', { phoneNumber: formattedPhone, messageId: response.data.messageId });
    
    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    logger.error('Error sending SMS', { phoneNumber, error: error.message });
    throw error;
  }
};

/**
 * Send verification code
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} verificationCode - Verification code
 * @returns {Promise<Object>} SMS sending result
 */
export const sendVerificationCode = async (phoneNumber, verificationCode) => {
  const message = `รหัสยืนยัน SlideMe ของคุณคือ ${verificationCode} (ใช้ได้ 5 นาที)`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send welcome message to new customer
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} name - Customer name
 * @returns {Promise<Object>} SMS sending result
 */
export const sendWelcomeSMS = async (phoneNumber, name) => {
  const message = `สวัสดีคุณ ${name || 'ลูกค้า'} ยินดีต้อนรับสู่บริการ SlideMe! ขอบคุณที่ลงทะเบียนกับเรา`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send driver registration confirmation
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} name - Driver name
 * @returns {Promise<Object>} SMS sending result
 */
export const sendDriverRegistrationSMS = async (phoneNumber, name) => {
  const message = `สวัสดีคุณ ${name || 'คนขับ'} ขอบคุณที่ลงทะเบียนกับ SlideMe เราจะตรวจสอบข้อมูลของคุณและแจ้งผลการอนุมัติให้ทราบโดยเร็วที่สุด`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send password reset code
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} resetCode - Password reset code
 * @returns {Promise<Object>} SMS sending result
 */
export const sendPasswordResetCode = async (phoneNumber, resetCode) => {
  const message = `รหัสรีเซ็ตรหัสผ่าน SlideMe ของคุณคือ ${resetCode} (ใช้ได้ 1 ชั่วโมง)`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send service request confirmation
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} SMS sending result
 */
export const sendRequestConfirmationSMS = async (phoneNumber, requestId) => {
  const message = `คำขอบริการ #${requestId} ของคุณได้ถูกบันทึกในระบบแล้ว คุณสามารถติดตามสถานะคำขอได้ในแอปพลิเคชัน SlideMe`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send driver arrival notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} driverName - Driver name
 * @param {string} licensePlate - Vehicle license plate
 * @returns {Promise<Object>} SMS sending result
 */
export const sendDriverArrivalSMS = async (phoneNumber, driverName, licensePlate) => {
  const message = `คนขับ ${driverName} (ทะเบียน ${licensePlate}) มาถึงจุดรับแล้ว`;
  return sendSMS(phoneNumber, message);
};

export default {
  sendSMS,
  sendVerificationCode,
  sendWelcomeSMS,
  sendDriverRegistrationSMS,
  sendPasswordResetCode,
  sendRequestConfirmationSMS,
  sendDriverArrivalSMS
};