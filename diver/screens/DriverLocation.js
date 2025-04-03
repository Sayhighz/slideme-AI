import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { IP_ADDRESS } from "../config";
import * as Location from 'expo-location';

export default function DriverLocation({ driver_id }) {
  const [location, setLocation] = useState(null);
  const locationWatcher = useRef(null);
  console.log(driver_id);

  const startTrackingLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location services.");
        return;
      }

      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });
        }
      );
    } catch (error) {
      console.error("Error starting location tracking:", error);
    }
  };

  const stopTrackingLocation = () => {
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
  };

  const updateLocationToDB = async (location) => {
    if (!location) return;
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/driver/update_location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver_id,
            current_latitude: location.latitude,
            current_longitude: location.longitude,
          }),
        }
      );

      const responseData = await response.json();
      if (!responseData.Status) {
        console.error("API Error:", responseData.Error);
      } else {
      }
    } catch (error) {
      console.error("Network Error:", error.message);
    }
  };

  useEffect(() => {
    startTrackingLocation();

    return () => {
      stopTrackingLocation();
    };
  }, []);

  useEffect(() => {
    if (location) {
      updateLocationToDB(location);
    }
  }, [location]);

  return null;
}
