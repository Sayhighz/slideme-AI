import express from 'express';
import { 
  editAddress, 
  addBookmark, 
  disableBookmark, 
  getuserBookmarks, 
  getServiceInfo,
  orderStatus,
  checkStatusOrder 
} from '../../controllers/customer/addressController.js';
import { validateAuthToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/customer/address/edit:
 *   post:
 *     summary: แก้ไขที่อยู่ที่บันทึกไว้
 *     description: | 
 *       - แก้ไขข้อมูลที่อยู่ที่บันทึกไว้
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address_id
 *             properties:
 *               address_id:
 *                 type: integer
 *                 example: 50
 *               save_name:
 *                 type: string
 *                 example: "บ้าน"
 *               location_from:
 *                 type: string
 *                 example: "เซ็นทรัลพระราม 2"
 *               pickup_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.7059
 *               pickup_long:
 *                 type: number
 *                 format: float
 *                 example: 100.4942
 *               location_to:
 *                 type: string
 *                 example: "อิมพีเรียลสำโรง"
 *               dropoff_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.6459
 *               dropoff_long:
 *                 type: number
 *                 format: float
 *                 example: 100.6127
 *               vehicletype_id:
 *                 type: integer
 *                 example: 1
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: แก้ไขที่อยู่สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/edit', validateAuthToken, editAddress);

/**
 * @swagger
 * /api/v1/customer/address/add-bookmark:
 *   post:
 *     summary: เพิ่มที่อยู่ที่บันทึกไว้
 *     description: | 
 *       - เพิ่มที่อยู่ใหม่เข้าในรายการที่บันทึกไว้
 *     tags: [Addresses]
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
 *               save_name:
 *                 type: string
 *                 example: "ที่ทำงาน"
 *               location_from:
 *                 type: string
 *                 example: "อิมพีเรียลสำโรง"
 *               pickup_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.6459
 *               pickup_long:
 *                 type: number
 *                 format: float
 *                 example: 100.6127
 *               location_to:
 *                 type: string
 *                 example: "เซ็นทรัลพระราม 2"
 *               dropoff_lat:
 *                 type: number
 *                 format: float
 *                 example: 13.7059
 *               dropoff_long:
 *                 type: number
 *                 format: float
 *                 example: 100.4942
 *               vehicletype_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: เพิ่มที่อยู่ที่บันทึกไว้สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/add-bookmark', validateAuthToken, addBookmark);

/**
 * @swagger
 * /api/v1/customer/address/disable-bookmark:
 *   post:
 *     summary: ยกเลิกการใช้งานที่อยู่ที่บันทึกไว้
 *     description: | 
 *       - ตั้งค่า is_deleted เป็น 1 สำหรับที่อยู่ที่ระบุ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address_id
 *             properties:
 *               address_id:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       200:
 *         description: ยกเลิกการใช้งานที่อยู่ที่บันทึกไว้สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       404:
 *         description: ไม่พบที่อยู่
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/disable-bookmark', validateAuthToken, disableBookmark);

/**
 * @swagger
 * /api/v1/customer/address/bookmarks:
 *   get:
 *     summary: ดึงรายการที่อยู่ที่บันทึกไว้ของผู้ใช้
 *     description: | 
 *       - ดึงรายการที่อยู่ที่บันทึกไว้ทั้งหมดของผู้ใช้ที่ยังไม่ถูกลบ
 *     tags: [Addresses]
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
 *         description: ดึงรายการที่อยู่ที่บันทึกไว้สำเร็จ
 *       400:
 *         description: customer_id เป็นสิ่งจำเป็น
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/bookmarks', validateAuthToken, getuserBookmarks);

/**
 * @swagger
 * /api/v1/customer/address/service-info:
 *   get:
 *     summary: ดึงข้อมูลบริการ
 *     description: | 
 *       - ดึงข้อมูลรายละเอียดของบริการตาม request_id
 *     tags: [Addresses]
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
 *         description: ดึงข้อมูลบริการสำเร็จ
 *       400:
 *         description: request_id เป็นสิ่งจำเป็น
 *       404:
 *         description: ไม่พบข้อมูลบริการ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/service-info', validateAuthToken, getServiceInfo);

/**
 * @swagger
 * /api/v1/customer/address/order-status/{customer_id}:
 *   get:
 *     summary: ดึงสถานะคำสั่งล่าสุดของลูกค้า
 *     description: | 
 *       - ดึงคำสั่งล่าสุดที่มีสถานะเป็น 'accepted' ของลูกค้า
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 90
 *     responses:
 *       200:
 *         description: ดึงสถานะคำสั่งสำเร็จ
 *       404:
 *         description: ไม่พบข้อมูลสำหรับลูกค้านี้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/order-status/:customer_id', validateAuthToken, orderStatus);

/**
 * @swagger
 * /api/v1/customer/address/check-status/{request_id}:
 *   get:
 *     summary: ตรวจสอบสถานะคำขอ
 *     description: | 
 *       - ตรวจสอบสถานะของคำขอ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 352
 *         description: หมายเลขคำขอที่ต้องการตรวจสอบ
 *     responses:
 *       200:
 *         description: สถานะของ request_id
 *       400:
 *         description: request_id ต้องเป็นตัวเลข
 *       404:
 *         description: ไม่พบคำขอ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/check-status/:request_id', validateAuthToken, checkStatusOrder);

export default router;