// สร้างจากไฟล์ lib/axios.js เดิม
import axios from "axios";
import { API_URL } from "../config";

// สร้าง instance ของ axios
const api = axios.create({
  baseURL: API_URL,
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

// ฟังก์ชันสำหรับ PUT request
export const putRequest = async (path, body) => {
  try {
    const response = await api.put(path, body);
    return response.data;
  } catch (error) {
    console.error("PUT request error:", error.response?.data || error.message);
    throw error;
  }
};

// ฟังก์ชันสำหรับ DELETE request
export const deleteRequest = async (path) => {
  try {
    const response = await api.delete(path);
    return response.data;
  } catch (error) {
    console.error("DELETE request error:", error.response?.data || error.message);
    throw error;
  }
};

// ฟังก์ชันสำหรับ upload file
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