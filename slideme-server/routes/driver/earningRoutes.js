// driver/earningRoutes.js
import express from 'express';
import { 
  getTotalEarnings, 
  getEarningsHistory, 
  getEarningsBreakdown,
  getTodayProfit
} from '../../controllers/driver/earningController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/earning/total:
 *   get:
 *     summary: ดึงรายได้รวม
 *     description: | 
 *       - ดึงข้อมูลรายได้รวมของคนขับ
 *     tags: [Driver Earnings]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *         description: ช่วงเวลาที่ต้องการ (วันนี้, สัปดาห์นี้, เดือนนี้, ปีนี้, ทั้งหมด)
 *     responses:
 *       200:
 *         description: ดึงข้อมูลรายได้สำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/total', getTotalEarnings);

/**
 * @swagger
 * /api/v1/driver/earning/history:
 *   get:
 *     summary: ดึงประวัติรายได้
 *     description: | 
 *       - ดึงข้อมูลประวัติรายได้ของคนขับ
 *     tags: [Driver Earnings]
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
 *         description: ดึงข้อมูลประวัติรายได้สำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/history', getEarningsHistory);

/**
 * @swagger
 * /api/v1/driver/earning/breakdown:
 *   get:
 *     summary: ดึงข้อมูลรายได้แบบแยกตามช่วงเวลา
 *     description: | 
 *       - ดึงข้อมูลรายได้รายวัน/รายเดือน
 *     tags: [Driver Earnings]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลรายได้แบบแยกตามช่วงเวลาสำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/breakdown', getEarningsBreakdown);

/**
 * @swagger
 * /api/v1/driver/earning/today:
 *   get:
 *     summary: ดึงรายได้วันนี้
 *     description: | 
 *       - ดึงข้อมูลรายได้ของคนขับในวันนี้
 *     tags: [Driver Earnings]
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสคนขับ
 *     responses:
 *       200:
 *         description: ดึงข้อมูลรายได้วันนี้สำเร็จ
 *       400:
 *         description: กรุณาระบุ driver_id
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/today', getTodayProfit);

export default router;