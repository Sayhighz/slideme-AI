import express from 'express';
import { getAllNotifications } from '../controllers/notificationController.js';

const router = express.Router();

/**
 * @swagger
 * /notification/getAllNotifications:
 *   get:
 *     summary: ดึงการแจ้งเตือนทั้งหมด
 *     description: | 
 *       - ดึงการแจ้งเตือนทั้งหมดในแอปพลิเคชัน เรียงตามเวลาที่สร้าง
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: ดึงการแจ้งเตือนทั้งหมดสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/getAllNotifications', getAllNotifications);

export default router;