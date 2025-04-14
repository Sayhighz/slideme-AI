/**
 * Driver registration routes
 */
import express from 'express';
import { registerDriver, checkRegistrationStatus } from '../../controllers/driver/registrationController.js';
import { configureDriverUpload, handleDriverUploadErrors } from '../../middleware/driverUploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/driver/registration/register:
 *   post:
 *     summary: ลงทะเบียนคนขับรถสไลด์พร้อมเอกสาร
 *     description: | 
 *       - ลงทะเบียนคนขับรถสไลด์ใหม่พร้อมอัปโหลดเอกสารประกอบการสมัคร
 *       - ต้องอัปโหลดเอกสารทั้งหมด: รูปโปรไฟล์ (ไม่บังคับ), ใบขับขี่, รูปรถพร้อมป้ายทะเบียน, สำเนาเล่มทะเบียนรถ
 *     tags: [Driver Registration]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: phone_number
 *         type: string
 *         required: true
 *         description: เบอร์โทรศัพท์ของคนขับ
 *       - in: formData
 *         name: password
 *         type: string
 *         required: true
 *         description: รหัสผ่าน
 *       - in: formData
 *         name: first_name
 *         type: string
 *         required: true
 *         description: ชื่อจริง
 *       - in: formData
 *         name: last_name
 *         type: string
 *         required: true
 *         description: นามสกุล
 *       - in: formData
 *         name: license_plate
 *         type: string
 *         required: true
 *         description: ทะเบียนรถ เช่น กข 1234
 *       - in: formData
 *         name: province
 *         type: string
 *         required: true
 *         description: จังหวัดที่จดทะเบียนรถ
 *       - in: formData
 *         name: birth_date
 *         type: string
 *         format: date
 *         description: วันเกิด (YYYY-MM-DD)
 *       - in: formData
 *         name: vehicletype_id
 *         type: integer
 *         description: รหัสประเภทรถ
 *       - in: formData
 *         name: profile_picture
 *         type: file
 *         description: รูปโปรไฟล์ของคนขับ (ไม่บังคับ)
 *       - in: formData
 *         name: thai_driver_license
 *         type: file
 *         required: true
 *         description: รูปใบขับขี่
 *       - in: formData
 *         name: car_with_license_plate
 *         type: file
 *         required: true
 *         description: รูปรถพร้อมป้ายทะเบียน
 *       - in: formData
 *         name: vehicle_registration
 *         type: file
 *         required: true
 *         description: รูปสำเนาเล่มทะเบียนรถ
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ กรุณารอการตรวจสอบและอนุมัติจากทีมงาน
 *       400:
 *         description: ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง
 *       409:
 *         description: เบอร์โทรศัพท์หรือทะเบียนรถถูกใช้งานแล้ว
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/register', configureDriverUpload, handleDriverUploadErrors, registerDriver);


/**
 * @swagger
 * /api/v1/driver/auth/check-status:
 *   get:
 *     summary: ตรวจสอบสถานะการลงทะเบียน
 *     description: | 
 *       - ตรวจสอบสถานะการอนุมัติของคนขับ
 *     tags: [Driver Authentication]
 *     parameters:
 *       - in: query
 *         name: phone_number
 *         required: true
 *         schema:
 *           type: string
 *         description: เบอร์โทรศัพท์ของคนขับ
 *     responses:
 *       200:
 *         description: ตรวจสอบสถานะสำเร็จ
 *       400:
 *         description: กรุณาระบุเบอร์โทรศัพท์
 *       404:
 *         description: ไม่พบข้อมูลการลงทะเบียน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/check-status', checkRegistrationStatus);

export default router;