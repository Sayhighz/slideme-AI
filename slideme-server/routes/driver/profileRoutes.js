import express from 'express';
import { 
  getDriverProfile, 
  updateDriverProfile, 
  updateIdExpiryDate,
  getVehicleTypes,
  getDriverStats,
  getDriverReviews,
  checkApprovalStatus
} from '../../controllers/driver/profileController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/profile/{driver_id}:
 *   get:
 *     summary: ดึงข้อมูลโปรไฟล์คนขับ
 *     description: | 
 *       - ดึงข้อมูลรายละเอียดของคนขับ
 *     tags: [Driver Profile]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลโปรไฟล์สำเร็จ
 *       404:
 *         description: ไม่พบข้อมูลคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/:driver_id', getDriverProfile);

/**
 * @swagger
 * /api/v1/driver/profile/update:
 *   post:
 *     summary: อัปเดตข้อมูลโปรไฟล์
 *     description: | 
 *       - อัปเดตข้อมูลส่วนตัวของคนขับ
 *     tags: [Driver Profile]
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
 *               email:
 *                 type: string
 *                 example: "driver@example.com"
 *               first_name:
 *                 type: string
 *                 example: "สมชาย"
 *               last_name:
 *                 type: string
 *                 example: "ใจดี"
 *               license_plate:
 *                 type: string
 *                 example: "กข 1234"
 *               id_expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-12-31"
 *               province:
 *                 type: string
 *                 example: "กรุงเทพมหานคร"
 *               vehicletype_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้องหรือไม่มีข้อมูลที่ต้องการอัปเดต
 *       404:
 *         description: ไม่พบข้อมูลคนขับ
 *       409:
 *         description: ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/update', updateDriverProfile);

/**
 * @swagger
 * /api/v1/driver/profile/update-expiry-date:
 *   post:
 *     summary: อัปเดตวันหมดอายุเอกสาร
 *     description: | 
 *       - อัปเดตวันหมดอายุบัตรประชาชนหรือใบอนุญาตขับขี่
 *     tags: [Driver Profile]
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
 *         description: อัปเดตวันหมดอายุสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       404:
 *         description: ไม่พบข้อมูลคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/update-expiry-date', updateIdExpiryDate);

/**
 * @swagger
 * /api/v1/driver/profile/vehicle-types:
 *   get:
 *     summary: ดึงประเภทรถ
 *     description: | 
 *       - ดึงรายการประเภทรถทั้งหมด
 *     tags: [Driver Profile]
 *     responses:
 *       200:
 *         description: ดึงประเภทรถสำเร็จ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/vehicle-types', getVehicleTypes);

/**
 * @swagger
 * /api/v1/driver/profile/stats/{driver_id}:
 *   get:
 *     summary: ดึงสถิติคนขับ
 *     description: | 
 *       - ดึงข้อมูลสถิติผลงานของคนขับ
 *     tags: [Driver Profile]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสถิติสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/stats/:driver_id', getDriverStats);

/**
 * @swagger
 * /api/v1/driver/profile/reviews/{driver_id}:
 *   get:
 *     summary: ดึงรีวิวของคนขับ
 *     description: | 
 *       - ดึงรายการรีวิวทั้งหมดของคนขับ
 *     tags: [Driver Profile]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนรายการต่อหน้า
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: ตำแหน่งเริ่มต้น
 *     responses:
 *       200:
 *         description: ดึงรีวิวสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/reviews/:driver_id', getDriverReviews);

/**
 * @swagger
 * /api/v1/driver/profile/approval-status/{driver_id}:
 *   get:
 *     summary: ตรวจสอบสถานะการอนุมัติ
 *     description: | 
 *       - ตรวจสอบสถานะการอนุมัติของคนขับ
 *     tags: [Driver Profile]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ตรวจสอบสถานะสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       404:
 *         description: ไม่พบข้อมูลคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/approval-status/:driver_id', checkApprovalStatus);

export default router;