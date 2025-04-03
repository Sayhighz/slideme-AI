import express from "express";
import {
  addRequest,
  getServiceHistory,
  getRequests,
  getRequestDetailForDriver,
  updateServiceRequest,
  completeRequest,
  cancelRequest,
} from "../controllers/requestController.js";

const router = express.Router();

/**
 * @swagger
 * /request/add_request:
 *   post:
 *     summary: เพิ่มคำขอบริการใหม่
 *     description: |
 *       - เพิ่มคำขอบริการใหม่เข้าสู่ระบบ
 *     tags: [Requests]
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
 *       200:
 *         description: เพิ่มคำขอบริการสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/add_request", addRequest);

/**
 * @swagger
 * /request/service_history_customer:
 *   get:
 *     summary: ดึงประวัติการใช้บริการของลูกค้า
 *     description: |
 *       - ดึงประวัติการใช้บริการทั้งหมดของลูกค้า
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ดึงประวัติการใช้บริการสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/service_history_customer", getServiceHistory);

/**
 * @swagger
 * /request/getRequests:
 *   get:
 *     summary: ดึงคำขอบริการที่รอการตอบรับ
 *     description: |
 *       - ดึงคำขอบริการทั้งหมดที่มีสถานะเป็น 'pending'
 *     tags: [Requests]
 *     responses:
 *       200:
 *         description: ดึงคำขอบริการสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/getRequests", getRequests);

/**
 * @swagger
 * /request/getRequestDetailForDriver:
 *   get:
 *     summary: ดึงรายละเอียดคำขอบริการสำหรับคนขับ
 *     description: |
 *       - ดึงข้อมูลรายละเอียดของคำขอบริการตาม request_id
 *     tags: [Requests]
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
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/getRequestDetailForDriver", getRequestDetailForDriver);

/**
 * @swagger
 * /request/update_service_request:
 *   post:
 *     summary: อัปเดตคำขอบริการ, การชำระเงิน, และข้อเสนอจากคนขับ
 *     description: |
 *       - สร้าง row ใหม่ในตาราง payments
 *       - อัปเดตราคาข้อเสนอ
 *     tags: [Requests]
 *     requestBody:
 *       description: ข้อมูลสำหรับการอัปเดตคำขอบริการ, การชำระเงิน, และข้อเสนอจากคนขับ
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 2500.50
 *               payment_method_id:
 *                 type: integer
 *                 example: 5
 *             required:
 *               - request_id
 *               - customer_id
 *               - offer_id
 *               - price
 *               - payment_method_id
 *     responses:
 *       200:
 *         description: อัปเดตคำขอบริการ, การชำระเงิน, และข้อเสนอจากคนขับสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       404:
 *         description: ไม่พบข้อมูลที่ตรงกันหรือข้อมูลได้ถูกอัปเดตแล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/update_service_request", updateServiceRequest);

/**
 * @swagger
 * /request/complete_request:
 *   post:
 *     summary: เสร็จสิ้นคำขอบริการ
 *     description: |
 *       - อัปเดตสถานะของคำขอบริการเป็น 'completed'
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *     responses:
 *       200:
 *         description: เสร็จสิ้นคำขอบริการสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/complete_request", completeRequest);

/**
 * @swagger
 * /request/cancel_request:
 *   put:
 *     summary: ยกเลิกคำขอบริการ
 *     description: ยกเลิกคำขอบริการ
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               request_id:
 *                 type: integer
 *                 description: รหัสคำขอที่ต้องการยกเลิก
 *                 example: 354
 *     responses:
 *       200:
 *         description: ยกเลิกคำขอเรียบร้อยแล้ว
 *       400:
 *         description: กรุณาระบุ request_id
 *       404:
 *         description: ไม่พบคำขอที่ต้องการยกเลิก
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 */
router.put("/cancel_request", cancelRequest);

export default router;