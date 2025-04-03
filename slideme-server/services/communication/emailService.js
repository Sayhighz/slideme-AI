/**
 * Email service for sending emails
 */
import nodemailer from 'nodemailer';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

// Create a transporter object for email sending
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Email sending result
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SlideMe <noreply@slideme.app>',
      to,
      subject,
      text,
      html
    };
    
    // If not in production, log email instead of sending
    if (!env.IS_PRODUCTION) {
      logger.info('Email would be sent in production', { to, subject });
      logger.debug('Email content:', { text, html });
      return { success: true, messageId: 'debug' };
    }
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error('Error sending email', { to, subject, error: error.message });
    throw error;
  }
};

/**
 * Send welcome email to new customer
 * @param {Object} customer - Customer data
 * @returns {Promise<Object>} Email sending result
 */
export const sendWelcomeEmail = async (customer) => {
  const subject = 'ยินดีต้อนรับสู่ SlideMe';
  const text = `สวัสดีคุณ ${customer.first_name || 'ลูกค้า'},\n\nยินดีต้อนรับสู่บริการ SlideMe! เราหวังว่าคุณจะมีประสบการณ์ที่ดีในการใช้บริการของเรา\n\nทีมงาน SlideMe`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #60B876;">ยินดีต้อนรับสู่ SlideMe!</h2>
      <p>สวัสดีคุณ ${customer.first_name || 'ลูกค้า'},</p>
      <p>ขอบคุณที่ลงทะเบียนใช้บริการ SlideMe บริการเรียกรถสไลด์อันดับ 1 ของไทย</p>
      <p>คุณสามารถเริ่มใช้งานได้ทันทีผ่านแอปพลิเคชัน หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อเราได้ตลอด 24 ชั่วโมง</p>
      <p>ขอให้มีประสบการณ์ที่ดีในการใช้บริการ</p>
      <p style="margin-top: 20px;">ด้วยความเคารพ,<br>ทีมงาน SlideMe</p>
    </div>
  `;
  
  return sendEmail({
    to: customer.email,
    subject,
    text,
    html
  });
};

/**
 * Send driver registration confirmation email
 * @param {Object} driver - Driver data
 * @returns {Promise<Object>} Email sending result
 */
export const sendDriverRegistrationEmail = async (driver) => {
  const subject = 'ขอบคุณสำหรับการลงทะเบียนกับ SlideMe';
  const text = `สวัสดีคุณ ${driver.first_name || 'คนขับ'},\n\nขอบคุณสำหรับการลงทะเบียนเป็นคนขับกับ SlideMe! เราจะตรวจสอบข้อมูลของคุณและแจ้งผลการอนุมัติให้ทราบโดยเร็วที่สุด\n\nทีมงาน SlideMe`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #60B876;">ขอบคุณสำหรับการลงทะเบียน!</h2>
      <p>สวัสดีคุณ ${driver.first_name || 'คนขับ'},</p>
      <p>ขอบคุณที่สนใจเป็นพาร์ทเนอร์คนขับกับ SlideMe</p>
      <p>เราได้รับข้อมูลการลงทะเบียนของคุณแล้ว และกำลังอยู่ในขั้นตอนการตรวจสอบ โดยปกติจะใช้เวลาประมาณ 2-5 วันทำการ</p>
      <p>เราจะแจ้งผลการอนุมัติให้ทราบทางอีเมลและเบอร์โทรศัพท์ที่คุณให้ไว้</p>
      <p style="margin-top: 20px;">ด้วยความเคารพ,<br>ทีมงาน SlideMe</p>
    </div>
  `;
  
  return sendEmail({
    to: driver.email,
    subject,
    text,
    html
  });
};

/**
 * Send password reset email
 * @param {Object} user - User data
 * @param {string} resetToken - Password reset token
 * @param {string} userType - User type (customer or driver)
 * @returns {Promise<Object>} Email sending result
 */
export const sendPasswordResetEmail = async (user, resetToken, userType) => {
  const resetLink = `${process.env.FRONTEND_URL}/${userType}/reset-password?token=${resetToken}`;
  
  const subject = 'คำขอรีเซ็ตรหัสผ่าน SlideMe';
  const text = `สวัสดีคุณ ${user.first_name || 'ผู้ใช้'},\n\nคุณได้ขอรีเซ็ตรหัสผ่านของคุณ โปรดคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:\n\n${resetLink}\n\nลิงก์นี้จะหมดอายุใน 1 ชั่วโมง หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน โปรดละเว้นอีเมลนี้\n\nทีมงาน SlideMe`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #60B876;">คำขอรีเซ็ตรหัสผ่าน</h2>
      <p>สวัสดีคุณ ${user.first_name || 'ผู้ใช้'},</p>
      <p>คุณได้ขอรีเซ็ตรหัสผ่านของคุณ โปรดคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #60B876; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">รีเซ็ตรหัสผ่าน</a>
      </p>
      <p>หรือคัดลอกลิงก์นี้ไปยังเบราว์เซอร์ของคุณ:</p>
      <p style="word-break: break-all;">${resetLink}</p>
      <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
      <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน โปรดละเว้นอีเมลนี้</p>
      <p style="margin-top: 20px;">ด้วยความเคารพ,<br>ทีมงาน SlideMe</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send service request confirmation email
 * @param {Object} request - Service request data
 * @param {Object} customer - Customer data
 * @returns {Promise<Object>} Email sending result
 */
export const sendRequestConfirmationEmail = async (request, customer) => {
  const subject = 'ยืนยันคำขอบริการ SlideMe';
  const text = `สวัสดีคุณ ${customer.first_name || 'ลูกค้า'},\n\nคำขอบริการของคุณได้ถูกบันทึกในระบบแล้ว\n\nรายละเอียดการบริการ:\nจุดรับ: ${request.location_from}\nจุดส่ง: ${request.location_to}\nวันเวลา: ${new Date(request.request_time).toLocaleString('th-TH')}\n\nคุณสามารถติดตามสถานะคำขอได้ในแอปพลิเคชัน\n\nทีมงาน SlideMe`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #60B876;">ยืนยันคำขอบริการ</h2>
      <p>สวัสดีคุณ ${customer.first_name || 'ลูกค้า'},</p>
      <p>คำขอบริการของคุณได้ถูกบันทึกในระบบแล้ว</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">รายละเอียดการบริการ:</h3>
        <p><strong>จุดรับ:</strong> ${request.location_from}</p>
        <p><strong>จุดส่ง:</strong> ${request.location_to}</p>
        <p><strong>วันเวลา:</strong> ${new Date(request.request_time).toLocaleString('th-TH')}</p>
      </div>
      <p>คุณสามารถติดตามสถานะคำขอได้ในแอปพลิเคชัน</p>
      <p style="margin-top: 20px;">ขอบคุณที่ใช้บริการ,<br>ทีมงาน SlideMe</p>
    </div>
  `;
  
  return sendEmail({
    to: customer.email,
    subject,
    text,
    html
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendDriverRegistrationEmail,
  sendPasswordResetEmail,
  sendRequestConfirmationEmail
};