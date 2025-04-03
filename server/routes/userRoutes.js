import express from 'express';
import { 
    addUserInfo, 
    checkUserPhone, 
    editProfile 
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @swagger
 * /user/add_user_info:
 *   post:
 *     summary: เพิ่มข้อมูลผู้ใช้ใหม่
 *     description: | 
 *       - เพิ่มข้อมูลลูกค้าใหม่เข้าสู่ระบบ
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               username:
 *                 type: string
 *                 example: "usertest"
 *               first_name:
 *                 type: string
 *                 example: "สมชาย"
 *               last_name:
 *                 type: string
 *                 example: "ใจดี"
 *     responses:
 *       200:
 *         description: เพิ่มข้อมูลผู้ใช้สำเร็จ
 *       400:
 *         description: กรุณาระบุเบอร์โทรศัพท์
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/add_user_info", addUserInfo);

/**
 * @swagger
 * /user/check_user_phone:
 *   post:
 *     summary: ตรวจสอบเบอร์โทรศัพท์ของผู้ใช้
 *     description: | 
 *       - ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบหรือไม่
 *     tags: [Users]
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
 *         description: ตรวจสอบเบอร์โทรศัพท์สำเร็จ (มีหรือไม่มีในระบบ)
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/check_user_phone", checkUserPhone);

/**
 * @swagger
 * /user/edit_profile:
 *   post:
 *     summary: แก้ไขข้อมูลโปรไฟล์ของผู้ใช้
 *     description: | 
 *       - แก้ไขข้อมูลส่วนตัวของลูกค้า
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *               email:
 *                 type: string
 *                 example: "updated@example.com"
 *               first_name:
 *                 type: string
 *                 example: "สมหญิง"
 *               last_name:
 *                 type: string
 *                 example: "ใจงาม"
 *     responses:
 *       200:
 *         description: แก้ไขข้อมูลโปรไฟล์สำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/edit_profile", editProfile);

export default router;