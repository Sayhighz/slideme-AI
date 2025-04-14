import express from 'express';
import { loginDriver, checkRegistrationStatus, resetPassword } from '../../controllers/driver/authController.js';

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
