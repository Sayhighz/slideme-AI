import express from "express";
import { 
    addPaymentMethod, 
    updatePaymentMethod, 
    disablePaymentMethod, 
    getAllUserPaymentMethods, 
    getPaymentMethod,
    deleteMethod
} from "../controllers/paymentController.js";

const router = express.Router();

/**
 * @swagger
 * /payment/payment-method/add:
 *   post:
 *     summary: เพิ่มวิธีการชำระเงินใหม่
 *     description: | 
 *       - เพิ่มวิธีการชำระเงินใหม่
 *     tags: [Payments]
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
router.post("/payment-method/add", addPaymentMethod);

/**
 * @swagger
 * /payment/payment-method/update:
 *   put:
 *     summary: อัปเดตข้อมูลวิธีการชำระเงิน
 *     description: | 
 *       - สามารถเปลี่ยนข้อมูลของวิธีการชำระเงินได้
 *     tags: [Payments]
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
router.put("/payment-method/update", updatePaymentMethod);

/**
 * @swagger
 * /payment/payment-method/disable:
 *   put:
 *     summary: ปิดการใช้งานวิธีการชำระเงิน
 *     description: | 
 *       - ปิดการใช้งานวิธีการชำระเงินนี้
 *     tags: [Payments]
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
router.put("/payment-method/disable", disablePaymentMethod);

/**
 * @swagger
 * /payment/payment-methods:
 *   get:
 *     summary: ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *     description: |
 *       - ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *     tags: [Payments]
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
router.get("/payment-methods", getAllUserPaymentMethods);

/**
 * @swagger
 * /payment/payment-method:
 *   get:
 *     summary: ดึงข้อมูลวิธีการชำระเงิน
 *     description: | 
 *       - ดึงข้อมูลวิธีการชำระเงินทั้งหมดของผู้ใช้
 *       - โดยต้องเป็นวิธีการชำระเงินที่เปิดใช้งานอยู่ (is_active = 1)
 *     tags: [Payments]
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
router.get("/payment-method", getPaymentMethod);

/**
 * @swagger
 * /payment/payment-method/delete/{payment_method_id}:
 *   delete:
 *     summary: ลบวิธีการชำระเงิน 
 *     description: |
 *       - ลบวิธีการชำระเงินที่ต้องการ
 *       - ใช้แค่เฉพาะวิชา csi206 เท่านั้น
 *     tags: [Payments]
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
router.delete("/payment-method/delete/:payment_method_id", deleteMethod);

export default router;