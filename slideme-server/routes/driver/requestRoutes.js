import express from 'express';
import { 
  getAvailableRequests, 
  getRequestDetails, 
  getActiveRequests,
  completeRequest,
  notifyArrival,
  getRequestHistory,
  getCustomerInfo
} from '../../controllers/driver/requestController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/request/available:
 *   get:
 *     summary: ดึงคำขอบริการที่ยังไม่มีคนรับ
 *     description: | 
 *       - ดึงรายการคำขอบริการที่ยังไม่มีคนขับรับ
 *     tags: [Driver Requests]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *       - in: query
 *         name: vehicletype_id
 *         schema:
 *           type: integer
 *         description: รหัสประเภทรถ (หากไม่ระบุ จะใช้ประเภทรถของคนขับ)
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: ละติจูดของคนขับ (สำหรับคำนวณระยะทางและเรียงลำดับตามระยะทาง)
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: ลองจิจูดของคนขับ (สำหรับคำนวณระยะทางและเรียงลำดับตามระยะทาง)
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 20
 *         description: รัศมีค้นหา (กิโลเมตร)
 *     responses:
 *       200:
 *         description: ดึงคำขอบริการที่มีสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       403:
 *         description: คนขับยังไม่ได้รับการอนุมัติ
 *       404:
 *         description: ไม่พบข้อมูลคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/available', getAvailableRequests);

/**
 * @swagger
 * /api/v1/driver/request/details:
 *   get:
 *     summary: ดึงรายละเอียดคำขอบริการ
 *     description: | 
 *       - ดึงข้อมูลรายละเอียดของคำขอบริการ
 *     tags: [Driver Requests]
 *     parameters:
 *       - in: query
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคำขอบริการ
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ (ไม่บังคับ แต่ใช้สำหรับคำนวณระยะทางและตรวจสอบข้อเสนอ)
 *     responses:
 *       200:
 *         description: ดึงรายละเอียดคำขอบริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id
 *       404:
 *         description: ไม่พบคำขอบริการ
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/details', getRequestDetails);

/**
 * @swagger
 * /api/v1/driver/request/active/{driver_id}:
 *   get:
 *     summary: ดึงคำขอบริการที่กำลังดำเนินการ
 *     description: | 
 *       - ดึงรายการคำขอบริการที่คนขับได้รับการตอบรับและกำลังดำเนินการอยู่
 *     tags: [Driver Requests]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงคำขอบริการที่กำลังดำเนินการสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/active/:driver_id', getActiveRequests);

/**
 * @swagger
 * /api/v1/driver/request/complete:
 *   post:
 *     summary: เสร็จสิ้นการให้บริการ
 *     description: | 
 *       - อัปเดตสถานะคำขอบริการเป็น "เสร็จสิ้น"
 *     tags: [Driver Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - driver_id
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *     responses:
 *       200:
 *         description: เสร็จสิ้นการให้บริการสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบคำขอบริการหรือคนขับไม่ได้รับมอบหมาย
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/complete', completeRequest);

/**
 * @swagger
 * /api/v1/driver/request/notify-arrival:
 *   post:
 *     summary: แจ้งเตือนการมาถึง
 *     description: | 
 *       - แจ้งเตือนลูกค้าว่าคนขับมาถึงแล้ว
 *     tags: [Driver Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - driver_id
 *             properties:
 *               request_id:
 *                 type: integer
 *                 example: 352
 *               driver_id:
 *                 type: integer
 *                 example: 91
 *     responses:
 *       200:
 *         description: แจ้งเตือนสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบคำขอบริการหรือคนขับไม่ได้รับมอบหมาย
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/notify-arrival', notifyArrival);

/**
 * @swagger
 * /api/v1/driver/request/history/{driver_id}:
 *   get:
 *     summary: ดึงประวัติการให้บริการ
 *     description: | 
 *       - ดึงประวัติคำขอบริการที่เสร็จสิ้นหรือถูกยกเลิก
 *     tags: [Driver Requests]
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled]
 *         description: กรองตามสถานะ (completed, cancelled)
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
 *         description: ดึงประวัติการให้บริการสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/history/:driver_id', getRequestHistory);

/**
 * @swagger3
 * /api/v1/driver/request/customer-info:
 *   get:
 *     summary: ดึงข้อมูลลูกค้า
 *     description: | 
 *       - ดึงข้อมูลลูกค้าสำหรับคำขอบริการที่คนขับได้รับมอบหมาย
 *     tags: [Driver Requests]
 *     parameters:
 *       - in: query
 *         name: request_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคำขอบริการ
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลลูกค้าสำเร็จ
 *       400:
 *         description: กรุณาระบุ request_id และ driver_id
 *       404:
 *         description: ไม่พบข้อมูลลูกค้าหรือคนขับไม่ได้รับมอบหมาย
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/customer-info', getCustomerInfo);

export default router;