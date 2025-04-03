// driver/locationRoutes.js
import express from 'express';
import { 
  updateDriverLocation, 
  getDriverLocation, 
  findNearbyDrivers,
  calculateDistance,
  getDriverTracking
} from '../../controllers/driver/locationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/location/update:
 *   post:
 *     summary: อัปเดตตำแหน่งคนขับ
 *     description: | 
 *       - อัปเดตตำแหน่งปัจจุบันของคนขับ
 *     tags: [Driver Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *               - current_latitude
 *               - current_longitude
 *             properties:
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *               current_latitude:
 *                 type: number
 *                 example: 13.736717
 *               current_longitude:
 *                 type: number
 *                 example: 100.523186
 *     responses:
 *       200:
 *         description: อัปเดตตำแหน่งสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง
 *       404:
 *         description: ไม่พบคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/update', updateDriverLocation);

/**
 * @swagger
 * /api/v1/driver/location/{driver_id}:
 *   get:
 *     summary: ดึงตำแหน่งคนขับ
 *     description: | 
 *       - ดึงตำแหน่งปัจจุบันของคนขับ
 *     tags: [Driver Location]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงตำแหน่งสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       404:
 *         description: ไม่พบข้อมูลตำแหน่งของคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/:driver_id', getDriverLocation);

/**
 * @swagger
 * /api/v1/driver/location/nearby/drivers:
 *   get:
 *     summary: ค้นหาคนขับใกล้เคียง
 *     description: | 
 *       - ค้นหาคนขับในรัศมีที่กำหนด
 *     tags: [Driver Location]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: ละติจูด
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: ลองจิจูด
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: รัศมีค้นหา (กิโลเมตร)
 *       - in: query
 *         name: vehicletype_id
 *         schema:
 *           type: integer
 *         description: รหัสประเภทรถ
 *     responses:
 *       200:
 *         description: ค้นหาคนขับใกล้เคียงสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/nearby/drivers', findNearbyDrivers);

/**
 * @swagger
 * /api/v1/driver/location/calculate/distance:
 *   get:
 *     summary: คำนวณระยะทาง
 *     description: | 
 *       - คำนวณระยะทางระหว่างสองตำแหน่ง
 *     tags: [Driver Location]
 *     parameters:
 *       - in: query
 *         name: origin_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: ละติจูดต้นทาง
 *       - in: query
 *         name: origin_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: ลองจิจูดต้นทาง
 *       - in: query
 *         name: destination_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: ละติจูดปลายทาง
 *       - in: query
 *         name: destination_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: ลองจิจูดปลายทาง
 *       - in: query
 *         name: vehicletype_id
 *         schema:
 *           type: integer
 *         description: รหัสประเภทรถสำหรับคำนวณราคา
 *     responses:
 *       200:
 *         description: คำนวณระยะทางสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/calculate/distance', calculateDistance);

/**
 * @swagger
 * /api/v1/driver/location/tracking/{request_id}/{customer_id}:
 *   get:
 *     summary: ดูข้อมูลการติดตามคนขับ
 *     description: | 
 *       - ดึงข้อมูลการติดตามคนขับสำหรับคำขอที่กำลังดำเนินการอยู่
 *     tags: [Driver Location]
 *     parameters:
 *       - in: path
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคำขอบริการ
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสลูกค้า
 *     responses:
 *       200:
 *         description: ดึงข้อมูลการติดตามสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบข้อมูลการเดินทาง หรือสถานะไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/tracking/:request_id/:customer_id', getDriverTracking);

export default router;