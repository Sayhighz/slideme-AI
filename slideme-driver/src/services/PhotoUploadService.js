// src/services/PhotoUploadService.js
import { uploadFile } from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Service for handling photo uploads in the application
 */
class PhotoUploadService {
  /**
   * Upload car photos (before or after service)
   * @param {string} uploadType - Type of upload ('before' or 'after')
   * @param {Object} images - Object containing image URIs {front: uri, back: uri, left: uri, right: uri}
   * @param {string} request_id - The service request ID
   * @param {string} driver_id - The driver ID
   * @param {Function} setUploadStatus - Function to update upload status message
   * @returns {Promise<Object>} - Upload result
   */
  async uploadCarPhotos(uploadType, images, request_id, driver_id, setUploadStatus = () => {}) {
    // Validate parameters
    if (!request_id || !driver_id) {
      throw new Error('รหัสคำขอและรหัสผู้ขับไม่ถูกต้อง');
    }

    // Get image URIs
    const imageUris = Object.values(images).filter(uri => uri !== null);
    if (imageUris.length < 4) {
      throw new Error('กรุณาอัปโหลดรูปภาพทั้ง 4 รูป');
    }

    // Create form data
    setUploadStatus('กำลังเตรียมข้อมูล...');
    const formData = new FormData();
    formData.append('request_id', request_id);
    formData.append('driver_id', driver_id);

    // Add all photos to form data with position info in filename
    Object.entries(images).forEach(([position, uri]) => {
      if (!uri) return;
      
      const fileName = uri.split('/').pop();
      const fileType = fileName.split('.').pop();

      formData.append('photos', {
        uri,
        name: `photo-${position}.${fileType}`, // ระบุตำแหน่งไว้ในชื่อ
        type: `image/${fileType}`,
      });
    });

    // Determine API endpoint based on upload type
    const endpoint = uploadType === 'before' 
      ? API_ENDPOINTS.UPLOAD.UPLOAD_BEFORE 
      : API_ENDPOINTS.UPLOAD.UPLOAD_AFTER;

    // Upload photos
    setUploadStatus('กำลังอัปโหลดรูปภาพ...');
    try {
      const result = await uploadFile(endpoint, formData);
      
      if (!result || !result.Status) {
        throw new Error(result?.Error || 'การอัปโหลดรูปภาพล้มเหลว');
      }
      
      return result;
    } catch (error) {
      console.error(`Error uploading ${uploadType} service photos:`, error);
      throw error;
    }
  }

  /**
   * Process image locally before upload
   * @param {string} imageUri - The image URI
   * @param {Object} options - Processing options (resize, compress)
   * @returns {Promise<string>} - Processed image URI
   */
  async processImage(imageUri, options = {}) {
    // This is a placeholder for future image processing functionality
    // รองรับการเพิ่มฟีเจอร์ในอนาคตสำหรับการประมวลผลภาพในฝั่ง client ก่อนอัปโหลด
    // - บีบอัดขนาดภาพ
    // - ย่อขนาดภาพ
    // - เพิ่มลายน้ำ
    // - แก้ไขภาพอื่นๆ
    try {
      // ส่งคืน URI เดิมหากไม่มีการประมวลผล
      return imageUri;
    } catch (error) {
      console.error('Error processing image:', error);
      // ส่งคืน URI เดิมหากมีข้อผิดพลาด
      return imageUri;
    }
  }

  /**
   * ดึงรูปภาพจากเซิร์ฟเวอร์
   * @param {string} filename - ชื่อไฟล์ภาพ
   * @param {string} subdir - ไดเรกทอรีย่อย (optional)
   * @returns {string} - URL ของรูปภาพ
   */
  getImageUrl(filename, subdir = '') {
    if (!filename) return null;
    
    let url = `${API_ENDPOINTS.UPLOAD.FETCH_IMAGE}?filename=${encodeURIComponent(filename)}`;
    if (subdir) {
      url += `&subdir=${encodeURIComponent(subdir)}`;
    }
    
    return url;
  }
  
  /**
   * แปลงรูปภาพจาก API ให้อยู่ในรูปแบบที่ใช้งานในแอป
   * @param {Array} photosArray - อาร์เรย์ข้อมูล JSON ของรูปภาพจาก API
   * @returns {Object} - ข้อมูลรูปภาพในรูปแบบ {front: url, back: url, ...}
   */
  formatPhotosFromApi(photosArray) {
    if (!photosArray || !Array.isArray(photosArray)) return {};
    
    const result = {};
    
    photosArray.forEach(photo => {
      if (photo.position && photo.url) {
        result[photo.position] = photo.url;
      }
    });
    
    return result;
  }
}

export default new PhotoUploadService();