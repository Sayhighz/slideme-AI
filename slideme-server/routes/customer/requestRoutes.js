import express from "express";
import {
  createRequest,
  getRequestDetails,
  getRequestHistory,
  getActiveRequest,
  cancelRequest,
  getDriverOffers,
  acceptOffer,
  completeRequest
} from "../../controllers/customer/requestController.js";
import { validateAuthToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/request/create:
 *   post:
 *     summary: สร้างคำขอบริการใหม่
 *     description: |
 *       - เพิ่มคำขอบริการใหม่เข้าสู่ระบบ
 *     tags: [Requests]
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
 *               - pickup_lat
 *               - pickup_long
 *               - location_from
 *               - dropoff_lat
 *               - dropoff_long
 *               - location_to
 *               - vehicletype_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *               request_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-03-01T14:30:00"
 *               pickup_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.7059
 *               pickup_long:
 *                 type: number
 *                 format: float
 *                 example: 100.4942
 *               location_from:
 *                 type: string
 *                 example: "เซ็นทรัลพระราม 2"
 *               dropoff_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.6459
 *               dropoff_long:
 *                 type: number
 *                 format: float
 *                 example: 100.6127
 *               location_to:
 *                 type: string
 *                 example: "อิมพีเรียลสำโรง"
 *               vehicletype_id:
 *                 type: integer
 *                 example: 1
 *               booking_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-03-02T10:00:00"
 *               customer_message:
 *                 type: string
 *                 example: "ขอคนขับที่ชำนาญเส้นทาง"
 *     responses:
 *       201:
 *         description: สร้างคำขอบริการสำเร็จ
 *       400:
 *         description: ข้อมูลคำขอไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/create", validateAuthToken, createRequest);

/**
 * @swagger
 * /api/v1/customer/request/details:
 *   get:
 *     summary: ดึงรายละเอียดคำขอบริการ
 *     description: |
 *       - ดึงข้อมูลรายละเอียดของคำขอบริการตาม request_id
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 352
 *     responses:
 *       200:
 *         description: ดึงรายละเอียดคำขอบริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id
 *       404:
 *         description: ไม่พบข้อมูลคำขอบริการ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/details", validateAuthToken, getRequestDetails);

/**
 * @swagger
 * /api/v1/customer/request/history:
 *   get:
 *     summary: ดึงประวัติการใช้บริการของลูกค้า
 *     description: |
 *       - ดึงประวัติการใช้บริการทั้งหมดของลูกค้า
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, accepted, completed, cancelled]
 *           example: completed
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           example: 0
 *     responses:
 *       200:
 *         description: ดึงประวัติการใช้บริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ customer_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/history", validateAuthToken, getRequestHistory);

/**
 * @swagger
 * /api/v1/customer/request/active:
 *   get:
 *     summary: ดึงคำขอบริการที่กำลังดำเนินการ
 *     description: |
 *       - ดึงคำขอบริการล่าสุดที่มีสถานะเป็น 'pending' หรือ 'accepted'
 *     tags: [Requests]
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
 *         description: ดึงคำขอบริการที่กำลังดำเนินการสำเร็จ
 *       400:
 *         description: กรุณาระบุ customer_id
 *       404:
 *         description: ไม่พบคำขอบริการที่กำลังดำเนินการ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/active", validateAuthToken, getActiveRequest);

/**
 * @swagger
 * /api/v1/customer/request/cancel:
 *   post:
 *     summary: ยกเลิกคำขอบริการ
 *     description: |
 *       - ยกเลิกคำขอบริการที่มีสถานะเป็น 'pending' หรือ 'accepted'
 *     tags: [Requests]
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
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *     responses:
 *       200:
 *         description: ยกเลิกคำขอบริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id และ customer_id
 *       404:
 *         description: ไม่พบคำขอบริการที่ต้องการยกเลิก
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/cancel", validateAuthToken, cancelRequest);

/**
 * @swagger
 * /api/v1/customer/request/offers:
 *   get:
 *     summary: ดึงข้อเสนอจากคนขับ
 *     description: |
 *       - ดึงข้อเสนอทั้งหมดสำหรับคำขอบริการที่มีสถานะเป็น 'pending'
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 352
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ดึงข้อเสนอสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id และ customer_id
 *       404:
 *         description: ไม่พบคำขอบริการหรือคำขอบริการไม่ได้เป็นของลูกค้า
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/offers", validateAuthToken, getDriverOffers);

/**
 * @swagger
 * /api/v1/customer/request/accept-offer:
 *   post:
 *     summary: ตอบรับข้อเสนอจากคนขับ
 *     description: |
 *       - ตอบรับข้อเสนอจากคนขับและเริ่มกระบวนการชำระเงิน
 *     tags: [Requests]
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
 *               - offer_id
 *               - payment_method_id
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *               offer_id:
 *                 type: integer
 *                 example: 300
 *               payment_method_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: ตอบรับข้อเสนอสำเร็จ
 *       400:
 *         description: กรุณาระบุข้อมูลให้ครบถ้วน
 *       404:
 *         description: ไม่พบคำขอบริการหรือข้อเสนอ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/accept-offer", validateAuthToken, acceptOffer);

/**
 * @swagger
 * /api/v1/customer/request/complete:
 *   post:
 *     summary: เสร็จสิ้นคำขอบริการ
 *     description: |
 *       - เปลี่ยนสถานะของคำขอบริการเป็น 'completed'
 *     tags: [Requests]
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
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               customer_id:
 *                 type: integer
 *                 example: 90
 *     responses:
 *       200:
 *         description: เสร็จสิ้นคำขอบริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id และ customer_id
 *       404:
 *         description: ไม่พบคำขอบริการที่ต้องการเสร็จสิ้น
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/complete", validateAuthToken, completeRequest);

export default router;