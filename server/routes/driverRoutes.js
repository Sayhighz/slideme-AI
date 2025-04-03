import express from 'express';
import { 
    offerPrice, 
    getOffersFromDriver, 
    cancelOffer, 
    getDrivers, 
    score,
    profitToday,
    driverOffers,
    getInfo,
    getHistory,
    Notifications,
    rejectAllOffers,
    editProfile,
    driverLocation,
    UpdateLocation,
    fetchDriverInfo
} from '../controllers/driverController.js';

const router = express.Router();

/**
 * @swagger
 * /driver/offer_price:
 *   post:
 *     summary: เสนอราคาสำหรับคำขอบริการ
 *     description: | 
 *       - คนขับเสนอราคาสำหรับคำขอบริการที่มีสถานะไม่เป็น 'cancelled'
 *     tags: [Drivers]
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
 *                 example: 2500.50
 *     responses:
 *       200:
 *         description: เสนอราคาสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/offer_price", offerPrice);

/**
 * @swagger
 * /driver/getOffersFromDriver:
 *   get:
 *     summary: ดึงข้อเสนอของคนขับ
 *     description: | 
 *       - ดึงข้อเสนอทั้งหมดของคนขับที่ไม่ถูกปฏิเสธและไม่เสร็จสิ้น
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงข้อเสนอของคนขับสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/getOffersFromDriver", getOffersFromDriver);

/**
 * @swagger
 * /driver/cancel_offer:
 *   post:
 *     summary: ยกเลิกข้อเสนอ
 *     description: | 
 *       - คนขับยกเลิกข้อเสนอโดยเปลี่ยนสถานะเป็น 'rejected'
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offer_id
 *             properties:
 *               offer_id:
 *                 type: integer
 *                 example: 300
 *     responses:
 *       200:
 *         description: ยกเลิกข้อเสนอสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/cancel_offer", cancelOffer);

/**
 * @swagger
 * /driver/drivers:
 *   get:
 *     summary: ดึงรายชื่อคนขับทั้งหมด
 *     description: | 
 *       - ดึงข้อมูลคนขับทั้งหมดจาก driverdetails
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: ดึงรายชื่อคนขับสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/drivers", getDrivers);

/**
 * @swagger
 * /driver/score:
 *   get:
 *     summary: ดึงคะแนนเฉลี่ยของคนขับ
 *     description: | 
 *       - ดึงคะแนนเฉลี่ยจากรีวิวของคนขับ
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงคะแนนเฉลี่ยของคนขับสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/score', score);

/**
 * @swagger
 * /driver/profitToday:
 *   get:
 *     summary: ดึงรายได้ของวันนี้
 *     description: | 
 *       - คำนวณรายได้รวมของคนขับในวันนี้จากบริการที่เสร็จสิ้น
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงรายได้ของวันนี้สำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/profitToday', profitToday);

/**
 * @swagger
 * /driver/driveroffers:
 *   get:
 *     summary: ดึงข้อเสนอที่รอการตอบรับ
 *     description: | 
 *       - ดึงข้อเสนอทั้งหมดที่มีสถานะเป็น 'pending' สำหรับคำขอที่ระบุ
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 352
 *     responses:
 *       200:
 *         description: ดึงข้อเสนอที่รอการตอบรับสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/driveroffers', driverOffers);

/**
 * @swagger
 * /driver/getinfo:
 *   get:
 *     summary: ดึงข้อมูลคนขับ
 *     description: | 
 *       - ดึงข้อมูลส่วนตัวของคนขับ
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงข้อมูลคนขับสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/getinfo', getInfo);

/**
 * @swagger
 * /driver/getHistory:
 *   get:
 *     summary: ดึงประวัติการให้บริการ
 *     description: | 
 *       - ดึงประวัติการให้บริการทั้งหมดของคนขับที่สถานะไม่ใช่ 'pending'
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงประวัติการให้บริการสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/getHistory', getHistory);

/**
 * @swagger
 * /driver/notifications:
 *   get:
 *     summary: ดึงการแจ้งเตือนสำหรับคนขับ
 *     description: | 
 *       - ดึงคำขอที่คนขับได้รับการยอมรับข้อเสนอ
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 91
 *     responses:
 *       200:
 *         description: ดึงการแจ้งเตือนสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/notifications', Notifications);

/**
 * @swagger
 * /driver/reject_all_offers:
 *   post:
 *     summary: ปฏิเสธข้อเสนอที่รอการตอบรับทั้งหมด
 *     description: | 
 *       - เปลี่ยนสถานะข้อเสนอทั้งหมดที่ไม่ได้รับการยอมรับเป็น 'rejected'
 *     tags: [Drivers]
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
 *         description: ปฏิเสธข้อเสนอสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/reject_all_offers', rejectAllOffers);

/**
 * @swagger
 * /driver/edit_profile:
 *   post:
 *     summary: แก้ไขข้อมูลโปรไฟล์คนขับ
 *     description: | 
 *       - แก้ไขวันหมดอายุบัตรประชาชนของคนขับ
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *               - id_expiry_date
 *             properties:
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *               id_expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-12-31"
 *     responses:
 *       200:
 *         description: แก้ไขข้อมูลโปรไฟล์สำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/edit_profile', editProfile);

/**
 * @swagger
 * /driver/fetch_driver_info/{customer_id}/{driver_id}/{request_id}:
 *   get:
 *     summary: ดึงข้อมูลของคนขับที่รับงาน
 *     description: |
 *       - ข้อมูลของ request
 *       - ดึงข้อมูลของคนขับที่ได้รับงาน
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         description: ID ของลูกค้า
 *         schema:
 *           type: integer
 *           example: 90
 *       - in: path
 *         name: driver_id
 *         required: true
 *         description: ID ของคนขับ
 *         schema:
 *           type: integer
 *           example: 91
 *       - in: path
 *         name: request_id
 *         required: true
 *         description: ID ของคำขอบริการ
 *         schema:
 *           type: integer
 *           example: 352
 *     responses:
 *       200:
 *         description: ดึงข้อมูลของคนขับที่ได้รับงานสำเร็จ
 *       400:
 *         description: ข้อมูลที่ส่งมาไม่ถูกต้อง
 *       404:
 *        description: ไม่พบข้อมูล
 *       500:
 *         description: ข้อผิดพลาดของเซิร์ฟเวอร์
 */
router.get('/fetch_driver_info/:customer_id/:driver_id/:request_id', fetchDriverInfo);

export default router;