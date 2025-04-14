import AsyncStorage from "@react-native-async-storage/async-storage";
import { postRequest } from "./api";
import { API_ENDPOINTS } from "../constants";

// ฟังก์ชันสำหรับการล็อกอิน
export const login = async (phoneNumber, password) => {
    try {
      const response = await postRequest(API_ENDPOINTS.AUTH.LOGIN, { phone_number: phoneNumber, password });
      
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
// ฟังก์ชันสำหรับการลงทะเบียน
export const register = async (userData) => {
  try {
    // แยกข้อมูลที่ต้องอัปโหลดเป็นไฟล์ออกมา
    const { profile_picture, documents, ...userInfo } = userData;
    
    // ถ้ามีไฟล์เอกสาร จะต้องสร้าง FormData สำหรับการอัปโหลด
    if (documents && Object.values(documents).some(Boolean)) {
      const formData = new FormData();
      
      // ใส่ข้อมูลทั่วไปลงใน FormData
      Object.keys(userInfo).forEach(key => {
        formData.append(key, userInfo[key]);
      });
      
      // เพิ่มรูปโปรไฟล์ (ถ้ามี)
      if (profile_picture) {
        const uriParts = profile_picture.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop();
        
        formData.append('profile_picture', {
          uri: profile_picture,
          name: fileName,
          type: `image/${fileType}`
        });
      }
      
      // เพิ่มเอกสารต่างๆ
      if (documents.driverLicense) {
        appendFileToFormData(formData, documents.driverLicense, 'thai_driver_license');
      }
      
      if (documents.vehicleWithPlate) {
        appendFileToFormData(formData, documents.vehicleWithPlate, 'car_with_license_plate');
      }
      
      if (documents.vehicleRegistration) {
        appendFileToFormData(formData, documents.vehicleRegistration, 'vehicle_registration');
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await postRequest(API_ENDPOINTS.AUTH.REGISTER, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response;
    } else {
      // กรณีไม่มีเอกสาร ส่งข้อมูลทั่วไปเท่านั้น
      const response = await postRequest(API_ENDPOINTS.AUTH.REGISTER, userInfo);
      return response;
    }
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

// ฟังก์ชันช่วยเพิ่มไฟล์ลงใน FormData
const appendFileToFormData = (formData, uri, fieldName) => {
  if (!uri) return;
  
  // แยกข้อมูลไฟล์
  const uriParts = uri.split('/');
  const fileName = uriParts[uriParts.length - 1];
  const fileType = fileName.split('.').pop();
  
  // เพิ่มไฟล์ลงใน FormData
  formData.append(fieldName, {
    uri: uri,
    name: fileName,
    type: `image/${fileType}`
  });
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

  