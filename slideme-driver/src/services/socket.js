import * as Location from "expo-location";
import { postRequest } from "./api";
import { API_ENDPOINTS } from "../constants";

// ขออนุญาตการเข้าถึงตำแหน่ง
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Location permission error:", error);
    return false;
  }
};

// ดึงตำแหน่งปัจจุบัน
export const getCurrentLocation = async () => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    return {
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  } catch (error) {
    console.error("Get current location error:", error);
    throw error;
  }
};

// อัปเดตตำแหน่งคนขับ
export const updateDriverLocation = async (driverId, latitude, longitude) => {
  try {
    const response = await postRequest(API_ENDPOINTS.DRIVER.UPDATE_LOCATION, {
      driver_id: driverId,
      current_latitude: latitude,
      current_longitude: longitude
    });
    return response;
  } catch (error) {
    console.error("Update driver location error:", error);
    throw error;
  }
};

// เริ่มการติดตามตำแหน่ง
export const startLocationTracking = async (driverId, callback) => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error("Location permission denied");
    }
    
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        
        try {
          await updateDriverLocation(driverId, latitude, longitude);
        } catch (error) {
          console.error("Error updating location in tracking:", error);
        }
        
        if (callback) {
          callback(latitude, longitude);
        }
      }
    );
  } catch (error) {
    console.error("Start location tracking error:", error);
    throw error;
  }
};