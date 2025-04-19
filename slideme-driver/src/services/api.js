// src/services/api.js
import axios from "axios";
import { API_URL } from "../config";

/**
 * สร้าง Axios instance ที่มีการตั้งค่าเริ่มต้น
 * - baseURL: ใช้จาก config ไฟล์
 * - headers: ตั้งค่า Content-Type เป็น application/json
 * - timeout: ตั้งค่า timeout เพื่อป้องกันการทำงานค้าง
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 วินาที
});

/**
 * ส่ง GET request ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 */
export const getRequest = async (path) => {
  try {
    const response = await api.get(path);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("GET request timeout:", path);
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    if (error.message === 'Network Error') {
      console.error("GET network error:", path);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    console.error("GET request error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * ส่ง POST request ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @param {Object} body - ข้อมูลที่จะส่งไปกับ request (request body)
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 */
export const postRequest = async (path, body) => {
  try {
    const response = await api.post(path, body);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("POST request timeout:", path);
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    if (error.message === 'Network Error') {
      console.error("POST network error:", path, body);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    console.error("POST request error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * ส่ง PUT request ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @param {Object} body - ข้อมูลที่จะส่งไปกับ request (request body)
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 */
export const putRequest = async (path, body) => {
  try {
    const response = await api.put(path, body);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("PUT request timeout:", path);
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    if (error.message === 'Network Error') {
      console.error("PUT network error:", path, body);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    console.error("PUT request error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * ส่ง DELETE request ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 */
export const deleteRequest = async (path) => {
  try {
    const response = await api.delete(path);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("DELETE request timeout:", path);
      throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    if (error.message === 'Network Error') {
      console.error("DELETE network error:", path);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    console.error("DELETE request error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * ส่ง POST request สำหรับอัปโหลดไฟล์ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @param {FormData} formData - ข้อมูล FormData ที่มีไฟล์ที่จะอัปโหลด
 * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับการส่งคำขอ
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 */
export const uploadFile = async (path, formData, options = {}) => {
  try {
    const defaultOptions = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 วินาที สำหรับการอัปโหลดไฟล์
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };
    
    const response = await api.post(path, formData, mergedOptions);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("Upload timeout:", path);
      throw new Error('การอัปโหลดใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    if (error.message === 'Network Error') {
      console.error("Upload network error:", path);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    console.error("Upload error:", error.response?.data || error.message);
    throw error;
  }
};

// เพิ่มตัวจัดการ Network Connection state
export const checkNetworkConnection = async () => {
  try {
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error("Network connection check failed:", error.message);
    return false;
  }
};

export default api;