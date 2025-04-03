import express from 'express';
import { 
  loginCustomer, 
  registerCustomer, 
  validateCustomer 
} from '../../controllers/customer/authController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบสำหรับลูกค้า
 *     description: | 
 *       - ตรวจสอบเบอร์โทรศัพท์และสร้าง JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "0812345678"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     customer_id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *       400:
 *         description: กรุณาใส่เบอร์โทรศัพท์
 *       401:
 *         description: เบอร์โทรไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/login', loginCustomer);

/**
 * @swagger
 * /api/v1/customer/auth/register:
 *   post:
 *     summary: ลงทะเบียนลูกค้าใหม่
 *     description: | 
 *       - สร้างบัญชีลูกค้าใหม่ในระบบ
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
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
 *               email:
 *                 type: string
 *                 example: "somchai@example.com"
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer_id:
 *                       type: integer
 *                     token:
 *                       type: string
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       409:
 *         description: เบอร์โทรศัพท์นี้ลงทะเบียนแล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/register', registerCustomer);

/**
 * @swagger
 * /api/v1/customer/auth/validate:
 *   get:
 *     summary: ตรวจสอบความถูกต้องของลูกค้า
 *     description: |
 *       - ตรวจสอบว่าลูกค้ามีในระบบหรือไม่
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
router.get('/validate', validateCustomer);

export default router;