import express from 'express';
import { loginUser, registerDriver, validateCustomer } from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: เข้าสู่ระบบสำหรับคนขับ
 *     description: | 
 *       - ตรวจสอบเบอร์โทรศัพท์และรหัสผ่าน
 *       - ตรวจสอบสถานะการอนุมัติของคนขับ
 *     tags: [Authentication]
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
 *                 example: "1"
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
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/register_driver:
 *   post:
 *     summary: ลงทะเบียนคนขับใหม่
 *     description: | 
 *       - สร้างบัญชีคนขับใหม่ในระบบ
 *     tags: [Authentication]
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
 *     responses:
 *       200:
 *         description: ลงทะเบียนสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/register_driver/:customer_id', registerDriver);

/**
 * @swagger
 * /auth/validate_customer:
 *   get:
 *     summary: ตรวจสอบความถูกต้องของลูกค้า
 *     description: |
 *       - ตรวจสอบว่าลูกค้ามีคำขอบริการในระบบหรือไม่
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ตรวจสอบความถูกต้องสำเร็จ
 *       400:
 *         description: กรุณาใส่ ID ของลูกค้า
 *       404:
 *         description: ไม่พบบันทึก
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/validate_customer', validateCustomer);

export default router;