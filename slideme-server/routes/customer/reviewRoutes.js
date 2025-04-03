import express from 'express';
import { 
  addReview, 
  getDriverReviews, 
  getDriverRating 
} from '../../controllers/customer/reviewController.js';
import { validateAuthToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/review/add:
 *   post:
 *     summary: เพิ่มรีวิวการใช้บริการ
 *     description: |
 *       - เพิ่มรีวิวและคะแนนสำหรับคนขับหลังจากเสร็จสิ้นการให้บริการ
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - customer_id
 *               - driver_id
 *               - rating
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               review_text:
 *                 type: string
 *                 example: "คนขับสุภาพ ขับรถดี ตรงเวลา"
 *     responses:
 *       201:
 *         description: เพิ่มรีวิวสำเร็จ
 *       400:
 *         description: กรุณากรอกข้อมูลให้ครบถ้วน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/add", validateAuthToken, addReview);

/**
 * @swagger
 * /api/v1/customer/review/driver/{driver_id}:
 *   get:
 *     summary: ดึงรีวิวทั้งหมดของคนขับ
 *     description: |
 *       - ดึงรีวิวทั้งหมดของคนขับตาม driver_id
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงรีวิวสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/driver/:driver_id", getDriverReviews);

/**
 * @swagger
 * /api/v1/customer/review/rating/{driver_id}:
 *   get:
 *     summary: ดึงคะแนนเฉลี่ยของคนขับ
 *     description: |
 *       - ดึงคะแนนเฉลี่ยและจำนวนรีวิวของคนขับ
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงคะแนนเฉลี่ยสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/rating/:driver_id", getDriverRating);

export default router;