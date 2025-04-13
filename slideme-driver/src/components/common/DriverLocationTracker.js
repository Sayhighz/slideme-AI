import React, { useEffect, useState } from 'react';
import { View, Text, Platform, ActivityIndicator, Alert } from 'react-native';
import { startLocationTracking, requestLocationPermission } from '../../services/location';

// Component ที่จะติดตามตำแหน่งของผู้ขับและอัปเดตไปยังเซิร์ฟเวอร์อย่างต่อเนื่อง
const DriverLocationTracker = ({ driverId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);

  // เริ่มการติดตามตำแหน่งเมื่อ component mount
  useEffect(() => {
    let isMounted = true;

    // ฟังก์ชันสำหรับเริ่มการติดตามตำแหน่ง
    const startTracking = async () => {
      try {
        // ขอสิทธิ์การเข้าถึงตำแหน่ง
        const hasPermission = await requestLocationPermission();
        
        if (!hasPermission) {
          Alert.alert(
            "ต้องการสิทธิ์การเข้าถึงตำแหน่ง",
            "แอปต้องการสิทธิ์การเข้าถึงตำแหน่งเพื่อรับงานในพื้นที่ของคุณ",
            [
              { text: "ตกลง", onPress: () => startTracking() }
            ]
          );
          return;
        }

        // เริ่มการติดตามตำแหน่ง
        if (driverId && !isTracking) {
          console.log("Starting location tracking for driver:", driverId);
          
          const subscription = await startLocationTracking(driverId, (latitude, longitude) => {
            // เมื่อตำแหน่งมีการเปลี่ยนแปลง
            console.log(`Updated location: (${latitude}, ${longitude})`);
          });
          
          if (isMounted) {
            setLocationSubscription(subscription);
            setIsTracking(true);
          } else if (subscription) {
            // ถ้า component ถูก unmount ระหว่างเริ่มการติดตาม
            subscription.remove();
          }
        }
      } catch (error) {
        console.error("Error starting location tracking:", error);
        Alert.alert(
          "ข้อผิดพลาด",
          "ไม่สามารถติดตามตำแหน่งได้ โปรดลองใหม่อีกครั้ง",
          [
            { text: "ลองอีกครั้ง", onPress: () => startTracking() },
            { text: "ยกเลิก", style: "cancel" }
          ]
        );
      }
    };

    // เริ่มการติดตามถ้ามี driverId
    if (driverId) {
      startTracking();
    }

    // เมื่อ component จะถูก unmount
    return () => {
      isMounted = false;
      // ยกเลิกการติดตามตำแหน่ง
      if (locationSubscription) {
        console.log("Removing location tracking subscription");
        locationSubscription.remove();
      }
    };
  }, [driverId]);

  // ไม่แสดงอะไรใน UI (ทำงานในเบื้องหลัง)
  return null;
};

export default DriverLocationTracker;