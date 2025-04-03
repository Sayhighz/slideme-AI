import express from 'express';
import { loginDriver, registerDriver, checkRegistrationStatus, resetPassword } from '../../controllers/driver/authController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบสำหรับคนขับ
 *     description: | 
 *       - ตรวจสอบเบอร์โทรศัพท์และรหัสผ่าน
 *       - ตรวจสอบสถานะการอนุมัติของคนขับ
 *     tags: [Driver Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - password
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "0999999999"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *       400:
 *         description: กรุณาใส่เบอร์โทรศัพท์และรหัสผ่าน
 *       401:
 *         description: เบอร์โทรหรือรหัสผ่านผิด
 *       403:
 *         description: บัญชีนี้ไม่ได้รับการอนุมัติ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/login', loginDriver);

/**
 * @swagger
 * /api/v1/driver/auth/register:
 *   post:
 *     summary: ลงทะเบียนคนขับใหม่
 *     description: | 
 *       - สร้างบัญชีคนขับใหม่ในระบบ
 *     tags: [Driver Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - password
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "0812345678"
 *               first_name:
 *                 type: string
 *                 example: "สมชาย"
 *               last_name:
 *                 type: string
 *                 example: "ใจดี"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               license_plate:
 *                 type: string
 *                 example: "กข 1234"
 *               license_number:
 *                 type: string
 *                 example: "1234567890"
 *               id_expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-12-31"
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       409:
 *         description: เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/register', registerDriver);

/**
 * @swagger
 * /api/v1/driver/auth/check-status:
 *   get:
 *     summary: ตรวจสอบสถานะการลงทะเบียน
 *     description: | 
 *       - ตรวจสอบสถานะการอนุมัติของคนขับ
 *     tags: [Driver Authentication]
 *     parameters:
 *       - in: query
 *         name: phone_number
 *         required: true
 *         schema:
 *           type: string
 *         description: เบอร์โทรศัพท์ของคนขับ
 *     responses:
 *       200:
 *         description: ตรวจสอบสถานะสำเร็จ
 *       400:
 *         description: กรุณาระบุเบอร์โทรศัพท์
 *       404:
 *         description: ไม่พบข้อมูลการลงทะเบียน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/check-status', checkRegistrationStatus);

/**
 * @swagger
 * /api/v1/driver/auth/reset-password:
 *   post:
 *     summary: รีเซ็ตรหัสผ่าน
 *     description: | 
 *       - รีเซ็ตรหัสผ่านของคนขับ
 *     tags: [Driver Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - new_password
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "0812345678"
 *               new_password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: รีเซ็ตรหัสผ่านสำเร็จ
 *       400:
 *         description: กรุณาระบุเบอร์โทรศัพท์และรหัสผ่านใหม่
 *       404:
 *         description: ไม่พบบัญชีผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/reset-password', resetPassword);

export default router;
