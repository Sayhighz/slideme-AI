import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fetchImage, uploadBeforeService, uploadAfterService } from '../controllers/uploadController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * /upload/fetch_image:
 *   get:
 *     summary: ดึงรูปภาพ
 *     description: |
 *       - ดึงรูปภาพจากเซิร์ฟเวอร์ตาม filename ที่ระบุ
 *     tags: [Uploads]
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *           example: "photos-1647852369852.jpg"
 *     responses:
 *       200:
 *         description: ดึงรูปภาพสำเร็จ
 *       400:
 *         description: ต้องระบุชื่อไฟล์
 *       404:
 *         description: ไม่พบไฟล์
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get("/fetch_image", fetchImage);

/**
 * @swagger
 * /upload/upload_before_service:
 *   post:
 *     summary: อัปโหลดรูปภาพก่อนให้บริการ
 *     description: |
 *       - อัปโหลดรูปภาพก่อนเริ่มให้บริการของคนขับ (สูงสุด 4 รูป)
 *     tags: [Uploads]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: photos
 *         type: file
 *         description: รูปภาพที่ต้องการอัปโหลด (สูงสุด 4 รูป)
 *         required: true
 *       - in: formData
 *         name: request_id
 *         type: integer
 *         description: รหัสคำขอบริการ
 *         required: true
 *         example: 352
 *       - in: formData
 *         name: driver_id
 *         type: integer
 *         description: รหัสคนขับ
 *         required: true
 *         example: 91
 *     responses:
 *       200:
 *         description: อัปโหลดรูปภาพก่อนให้บริการสำเร็จ
 *       400:
 *         description: ไม่มีไฟล์ที่อัปโหลดหรือข้อมูลไม่ครบถ้วน
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/upload_before_service", upload.array("photos", 4), uploadBeforeService);

/**
 * @swagger
 * /upload/upload_after_service:
 *   post:
 *     summary: อัปโหลดรูปภาพหลังให้บริการ
 *     description: |
 *       - อัปโหลดรูปภาพหลังเสร็จสิ้นการให้บริการของคนขับ (สูงสุด 4 รูป)
 *     tags: [Uploads]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: photos
 *         type: file
 *         description: รูปภาพที่ต้องการอัปโหลด (สูงสุด 4 รูป)
 *         required: true
 *       - in: formData
 *         name: request_id
 *         type: integer
 *         description: รหัสคำขอบริการ
 *         required: true
 *         example: 352
 *       - in: formData
 *         name: driver_id
 *         type: integer
 *         description: รหัสคนขับ
 *         required: true
 *         example: 91
 *     responses:
 *       200:
 *         description: อัปโหลดรูปภาพหลังให้บริการสำเร็จ
 *       400:
 *         description: ไม่มีไฟล์ที่อัปโหลดหรือข้อมูลไม่ครบถ้วน
 *       404:
 *         description: ไม่พบบันทึกที่ตรงกันสำหรับอัปเดต
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post("/upload_after_service", upload.array("photos", 4), uploadAfterService);

export default router;