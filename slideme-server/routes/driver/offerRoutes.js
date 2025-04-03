import express from 'express';
import { 
  createOffer, 
  getDriverOffers, 
  cancelOffer, 
  getOfferDetails,
  rejectAllPendingOffers,
  getOffersHistory
} from '../../controllers/driver/offerController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/offer/create:
 *   post:
 *     summary: สร้างข้อเสนอใหม่
 *     description: | 
 *       - สร้างข้อเสนอราคาสำหรับคำขอบริการ
 *     tags: [Driver Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - driver_id
 *               - offered_price
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *               offered_price:
 *                 type: number
 *                 format: float
 *                 example: 350.00
 *     responses:
 *       201:
 *         description: สร้างข้อเสนอสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง
 *       403:
 *         description: คนขับยังไม่ได้รับการอนุมัติ
 *       404:
 *         description: ไม่พบคำขอบริการ
 *       409:
 *         description: มีข้อเสนออยู่แล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/create', createOffer);

/**
 * @swagger
 * /api/v1/driver/offer/list:
 *   get:
 *     summary: ดึงรายการข้อเสนอ
 *     description: | 
 *       - ดึงข้อเสนอทั้งหมดของคนขับ
 *     tags: [Driver Offers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงรายการข้อเสนอสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/list', getDriverOffers);

/**
 * @swagger
 * /api/v1/driver/offer/cancel:
 *   post:
 *     summary: ยกเลิกข้อเสนอ
 *     description: | 
 *       - ยกเลิกข้อเสนอที่ยังไม่ได้รับการยอมรับ
 *     tags: [Driver Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offer_id
 *               - driver_id
 *             properties:
 *               offer_id:
 *                 type: integer
 *                 example: 300
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *     responses:
 *       200:
 *         description: ยกเลิกข้อเสนอสำเร็จ
 *       400:
 *         description: ไม่สามารถยกเลิกข้อเสนอที่ถูกยอมรับแล้ว
 *       404:
 *         description: ไม่พบข้อเสนอ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/cancel', cancelOffer);

/**
 * @swagger
 * /api/v1/driver/offer/details:
 *   get:
 *     summary: ดึงรายละเอียดข้อเสนอ
 *     description: | 
 *       - ดึงข้อมูลรายละเอียดของข้อเสนอ
 *     tags: [Driver Offers]
 *     parameters:
 *       - in: query
 *         name: offer_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสข้อเสนอ
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ (ไม่บังคับ แต่จะตรวจสอบว่าเป็นเจ้าของข้อเสนอหรือไม่)
 *     responses:
 *       200:
 *         description: ดึงรายละเอียดข้อเสนอสำเร็จ
 *       400:
 *         description: กรุณาระบุ offer_id
 *       404:
 *         description: ไม่พบข้อเสนอ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/details', getOfferDetails);

/**
 * @swagger
 * /api/v1/driver/offer/reject-all:
 *   post:
 *     summary: ปฏิเสธข้อเสนอทั้งหมด
 *     description: | 
 *       - ปฏิเสธข้อเสนอที่รอการตอบรับทั้งหมด
 *     tags: [Driver Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *             properties:
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *     responses:
 *       200:
 *         description: ปฏิเสธข้อเสนอทั้งหมดสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/reject-all', rejectAllPendingOffers);

/**
 * @swagger
 * /api/v1/driver/offer/history:
 *   get:
 *     summary: ดึงประวัติข้อเสนอ
 *     description: | 
 *       - ดึงประวัติข้อเสนอที่เสร็จสิ้นแล้ว
 *     tags: [Driver Offers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: จำนวนรายการต่อหน้า
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: ตำแหน่งเริ่มต้น
 *     responses:
 *       200:
 *         description: ดึงประวัติข้อเสนอสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/history', getOffersHistory);

export default router;