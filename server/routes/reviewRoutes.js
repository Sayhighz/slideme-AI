import express from 'express';
import { addReview } from '../controllers/reviewController.js';

const router = express.Router();

/**
 * @swagger
 * /review/add_reviews:
 *   post:
 *     summary: เพิ่มรีวิวการใช้บริการ
 *     description: |
 *       - เพิ่มรีวิวและคะแนนสำหรับคนขับหลังจากเสร็จสิ้นการให้บริการ
 *     tags: [Reviews]
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
 *       200:
 *         description: เพิ่มรีวิวสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/add_reviews", addReview);

export default router;