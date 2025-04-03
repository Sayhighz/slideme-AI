import express from "express";
import { 
  addPaymentMethod, 
  updatePaymentMethod, 
  disablePaymentMethod, 
  getAllUserPaymentMethods, 
  getPaymentMethod,
  deleteMethod
} from "../../controllers/customer/paymentController.js";
import { validateAuthToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/payment/add:
 *   post:
 *     summary: เพิ่มวิธีการชำระเงินใหม่
 *     description: | 
 *       - เพิ่มวิธีการชำระเงินใหม่
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method_name
 *               - card_number
 *               - card_expiry
 *               - card_cvv
 *               - cardholder_name
 *               - customer_id
 *             properties:
 *               method_name:
 *                 type: string
 *                 example: "Mastercard"
 *               card_number:
 *                 type: string
 *                 example: "1234567890123456"
 *               card_expiry:
 *                 type: string
 *                 example: "12/26"
 *               card_cvv:
 *                 type: string
 *                 example: "123"
 *               cardholder_name:
 *                 type: string
 *                 example: "นนท์ธีร์"
 *               customer_id:
 *                 type: integer
 *                 example: 96
 *     responses:
 *       201:
 *         description: เพิ่มวิธีการชำระเงิน
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/add", validateAuthToken, addPaymentMethod);

/**
 * @swagger
 * /api/v1/customer/payment/update:
 *   put:
 *     summary: อัปเดตข้อมูลวิธีการชำระเงิน
 *     description: | 
 *       - สามารถเปลี่ยนข้อมูลของวิธีการชำระเงินได้
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method_id
 *               - method_name
 *               - card_number
 *               - card_expiry
 *               - card_cvv
 *               - cardholder_name
 *             properties:
 *               payment_method_id:
 *                 type: integer
 *                 example: 4
 *               method_name:
 *                 type: string
 *                 example: "Mastercard"
 *               card_number:
 *                 type: string
 *                 example: "0987654321012345"
 *               card_expiry:
 *                 type: string
 *                 example: "12/40"
 *               card_cvv:
 *                 type: string
 *                 example: "456"
 *               cardholder_name:
 *                 type: string
 *                 example: "นนท์ธีร์ ปานะถึก"
 *     responses:
 *       200:
 *         description: อัปเดตวิธีการชำระเงิน
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบวิธีการชำระเงิน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put("/update", validateAuthToken, updatePaymentMethod);

/**
 * @swagger
 * /api/v1/customer/payment/disable:
 *   put:
 *     summary: ปิดการใช้งานวิธีการชำระเงิน
 *     description: | 
 *       - ปิดการใช้งานวิธีการชำระเงินนี้
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method_id
 *             properties:
 *               payment_method_id:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: ปิดการใช้งานวิธีการชำระเงิน
 *       400:
 *         description: กรุณาระบุ payment_method_id
 *       404:
 *         description: ไม่พบวิธีการชำระเงิน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put("/disable", validateAuthToken, disablePaymentMethod);

/**
 * @swagger
 * /api/v1/customer/payment/all:
 *   get:
 *     summary: ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *     description: |
 *       - ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *         description: รหัสของลูกค้า (Customer ID)
 *     responses:
 *       200:
 *         description: สำเร็จ - ส่งคืนรายการวิธีการชำระเงิน
 *       400:
 *         description: กรุณาระบุ customer_id
 *       404:
 *         description: ไม่พบวิธีการชำระเงิน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/all", validateAuthToken, getAllUserPaymentMethods);

/**
 * @swagger
 * /api/v1/customer/payment/active:
 *   get:
 *     summary: ดึงข้อมูลวิธีการชำระเงินที่เปิดใช้งาน
 *     description: | 
 *       - ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *       - โดยต้องเป็นวิธีการชำระเงินที่เปิดใช้งานอยู่ (is_active = 1)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 87
 *         description: รหัสของลูกค้า (Customer ID)
 *     responses:
 *       200:
 *         description: วิธีการชำระเงินทั้งหมด
 *       400:
 *         description: กรุณาระบุ customer_id
 *       404:
 *         description: ไม่พบวิธีการชำระเงิน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/active", validateAuthToken, getPaymentMethod);

/**
 * @swagger
 * /api/v1/customer/payment/delete/{payment_method_id}:
 *   delete:
 *     summary: ลบวิธีการชำระเงิน 
 *     description: |
 *       - ลบวิธีการชำระเงินที่ต้องการ
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_method_id
 *         required: true
 *         description: ID ของวิธีการชำระเงินที่ต้องการลบ
 *         schema:
 *           type: integer
 *           example: 15
 *     responses:
 *       200:
 *         description: ลบวิธีการชำระเงินเรียบร้อย !
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบวิธีการชำระเงิน
 *       500:
 *         description: เกิดข้อผิดพลาดของฐานข้อมูล
 */
router.delete("/delete/:payment_method_id", validateAuthToken, deleteMethod);

export default router;