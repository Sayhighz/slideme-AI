// src/services/api.js
import axios from "axios";
import { API_URL } from "../config";

/**
 * สร้าง Axios instance ที่มีการตั้งค่าเริ่มต้น
 * - baseURL: ใช้จาก config ไฟล์
 * - headers: ตั้งค่า Content-Type เป็น application/json
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
    console.error("DELETE request error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * ส่ง POST request สำหรับอัปโหลดไฟล์ไปยัง API endpoint
 * @param {string} path - เส้นทาง API (ไม่รวม base URL)
 * @param {FormData} formData - ข้อมูล FormData ที่มีไฟล์ที่จะอัปโหลด
 * @returns {Promise<Object>} - ผลลัพธ์จาก API (data)
 * @throws {Error} - ข้อผิดพลาดในกรณีที่ request ล้มเหลว
 * 
 * ตัวอย่างการใช้งาน:
 * ```
 * const formData = new FormData();
 * formData.append('request_id', '123');
 * formData.append('photos', {
 *   uri: 'file:///path/to/image.jpg',
 *   name: 'image.jpg',
 *   type: 'image/jpeg'
 * });
 * const result = await uploadFile('/api/upload', formData);
 * ```
 */
export const uploadFile = async (path, formData) => {
  try {
    const response = await api.post(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;