import AsyncStorage from "@react-native-async-storage/async-storage";
import { postRequest } from "./api";

// ฟังก์ชันสำหรับการล็อกอิน
export const login = async (phoneNumber, password) => {
    try {
      const response = await postRequest("/auth/login", { phone_number: phoneNumber, password });
      
      if (response.Status && response.token) {
        // Extract the user data we want to store
        const userData = {
          driver_id: response.driver_id,
          first_name: response.first_name,
          last_name: response.last_name,
          license_plate: response.license_plate,
          phone_number: response.phone_number,
          token: response.token
        };
        
        // Save the user data to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        return response;
      } else {
        throw new Error(response.Error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

// ฟังก์ชันสำหรับการลงทะเบียน
export const register = async (userData) => {
  try {
    const response = await postRequest("/auth/register_driver", userData);
    if (response.Status) {
        return response;
      } else {
        throw new Error(response.Error || "ลงทะเบียนไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };
  
  // ฟังก์ชันสำหรับการตรวจสอบการเข้าสู่ระบบ
  export const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Check auth error:", error);
      return null;
    }
  };
  
  // ฟังก์ชันสำหรับการออกจากระบบ
  export const logout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };