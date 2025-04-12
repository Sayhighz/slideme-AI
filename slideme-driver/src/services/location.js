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
    const response = await postRequest(API_ENDPOINTS.DRIVER.LOCATION.UPDATE, {
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
    
    // Keep track of the last update time and coordinates
    let lastUpdateTime = 0;
    let lastCoords = null;
    const MIN_TIME_BETWEEN_UPDATES = 15000; // 15 seconds delay between database updates
    const SIGNIFICANT_DISTANCE_CHANGE = 50; // 50 meters - only update if moved this far

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced, // Lower accuracy to save battery
        timeInterval: 10000, // Check location every 10 seconds
        distanceInterval: 20, // Minimum movement of 20 meters before checking
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        const currentTime = Date.now();
        
        // Always keep track of the latest position locally
        const hasMovedSignificantly = lastCoords && calculateDistance(
          lastCoords.latitude, 
          lastCoords.longitude, 
          latitude, 
          longitude
        ) > SIGNIFICANT_DISTANCE_CHANGE;

        const timeElapsed = currentTime - lastUpdateTime;
        
        // Only update database if enough time has passed OR significant movement detected
        if (timeElapsed > MIN_TIME_BETWEEN_UPDATES || hasMovedSignificantly) {
          console.log("Updating driver location in database...");
          
          try {
            await updateDriverLocation(driverId, latitude, longitude);
            lastUpdateTime = currentTime;
            lastCoords = { latitude, longitude };
          } catch (error) {
            console.error("Error updating location in tracking:", error);
          }
        } else {
          console.log("Skipping database update, not enough time passed or not enough movement");
        }
        
        // Always call callback with latest position if provided
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

// Helper function to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371 * 1000; // Earth's radius in meters

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};