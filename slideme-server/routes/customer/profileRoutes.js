import express from 'express';
import { 
  getProfile,
  updateProfile,
  updateProfilePicture,
  getServiceStats,
  checkUsernameAvailability,
  deleteAccount
} from '../../controllers/customer/profileController.js';
import { validateAuthToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/profile:
 *   get:
 *     summary: ดึงข้อมูลโปรไฟล์ของลูกค้า
 *     description: | 
 *       - ดึงข้อมูลโปรไฟล์ของลูกค้าตาม customer_id
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ดึงข้อมูลโปรไฟล์สำเร็จ
 *       400:
 *         description: กรุณาระบุ customer_id
 *       404:
 *         description: ไม่พบข้อมูลลูกค้า
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/', validateAuthToken, getProfile);

/**
 * @swagger
 * /api/v1/customer/profile/update:
 *   post:
 *     summary: แก้ไขข้อมูลโปรไฟล์ของลูกค้า
 *     description: | 
 *       - แก้ไขข้อมูลส่วนตัวของลูกค้า
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
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
 *               username:
 *                 type: string
 *                 example: "usertest"
 *               first_name:
 *                 type: string
 *                 example: "สมหญิง"
 *               last_name:
 *                 type: string
 *                 example: "ใจงาม"
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: แก้ไขข้อมูลโปรไฟล์สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       404:
 *         description: ไม่พบข้อมูลลูกค้า
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/update', validateAuthToken, updateProfile);

/**
 * @swagger
 * /api/v1/customer/profile/update-photo:
 *   post:
 *     summary: อัปเดตรูปโปรไฟล์
 *     description: | 
 *       - อัปเดตรูปโปรไฟล์ของลูกค้า
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - profile_picture_url
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *               profile_picture_url:
 *                 type: string
 *                 example: "https://example.com/path/to/image.jpg"
 *     responses:
 *       200:
 *         description: อัปเดตรูปโปรไฟล์สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบข้อมูลลูกค้า
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/update-photo', validateAuthToken, updateProfilePicture);

/**
 * @swagger
 * /api/v1/customer/profile/stats:
 *   get:
 *     summary: ดึงข้อมูลสถิติการใช้บริการ
 *     description: | 
 *       - ดึงสถิติการใช้บริการของลูกค้า เช่น จำนวนทริปที่เสร็จสิ้น, ยกเลิก, ทั้งหมด
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสถิติสำเร็จ
 *       400:
 *         description: กรุณาระบุ customer_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/stats', validateAuthToken, getServiceStats);

/**
 * @swagger
 * /api/v1/customer/profile/check-username:
 *   get:
 *     summary: ตรวจสอบความพร้อมใช้งานของชื่อผู้ใช้
 *     description: | 
 *       - ตรวจสอบว่าชื่อผู้ใช้นี้สามารถใช้งานได้หรือถูกใช้ไปแล้ว
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *           example: "usertest"
 *       - in: query
 *         name: current_customer_id
 *         required: false
 *         schema:
 *           type: integer
 *           example: 90
 *         description: ID ของลูกค้าปัจจุบัน (สำหรับกรณีที่ต้องการเปลี่ยนชื่อผู้ใช้แต่ยังเป็นชื่อเดิม)
 *     responses:
 *       200:
 *         description: ตรวจสอบสำเร็จ
 *       400:
 *         description: กรุณาระบุชื่อผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/check-username', checkUsernameAvailability);

/**
 * @swagger
 * /api/v1/customer/profile/delete:
 *   post:
 *     summary: ลบบัญชีลูกค้า
 *     description: | 
 *       - ลบบัญชีลูกค้า (soft delete)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: ลบบัญชีสำเร็จ
 *       400:
 *         description: กรุณาระบุ customer_id หรือมีคำขอที่ยังดำเนินการอยู่
 *       404:
 *         description: ไม่พบข้อมูลลูกค้า
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/delete', validateAuthToken, deleteAccount);

export default router;