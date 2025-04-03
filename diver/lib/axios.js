import axios from "axios";
import { IP_ADDRESS } from "../config";

// สร้าง instance ของ axios
const api = axios.create({
  baseURL: `http://${IP_ADDRESS}:4000/`, // ตั้งค่า baseURL
  headers: {
    "Content-Type": "application/json",
  },
});

// ฟังก์ชันสำหรับ GET request
export const getRequest = async (path) => {
  try {
    const response = await api.get(path);
    return response.data;
  } catch (error) {
    console.error("GET request error:", error.response?.data || error.message);
    throw error;
  }
};

// ฟังก์ชันสำหรับ POST request
export const postRequest = async (path, body) => {
  try {
    const response = await api.post(path, body);
    return response.data;
  } catch (error) {
    console.error("POST request error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
