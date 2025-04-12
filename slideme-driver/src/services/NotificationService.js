// src/services/NotificationService.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { postRequest } from './api';
import { API_ENDPOINTS } from '../constants';

// ตั้งค่าการแจ้งเตือน
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// บริการการแจ้งเตือน
const NotificationService = {
  // ลงทะเบียนสำหรับการแจ้งเตือน (เรียกใช้เมื่อล็อกอิน)
  registerForPushNotifications: async (driverId) => {
    try {
      // ตรวจสอบว่าอยู่บนอุปกรณ์จริงไม่ใช่ simulator
      if (!Constants.isDevice) {
        console.log('ต้องใช้อุปกรณ์จริงสำหรับการแจ้งเตือน');
        return;
      }

      // ขอสิทธิ์การแจ้งเตือน
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('ไม่ได้รับอนุญาตให้แสดงการแจ้งเตือน!');
        return;
      }

      // รับโทเค็นสำหรับการแจ้งเตือน
      const expoPushToken = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      // บันทึกโทเค็นไปยังเซิร์ฟเวอร์
      await postRequest(API_ENDPOINTS.DRIVER.NOTIFICATION.REGISTER_TOKEN, {
        driver_id: driverId,
        push_token: expoPushToken,
        device_type: Platform.OS
      });

      // ตั้งค่าการรับและการจัดการการแจ้งเตือน
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  },

  // สำหรับการกดที่การแจ้งเตือน - ควรเรียกใช้ใน AppNavigator
  setupNotificationResponse: (navigation) => {
    // ตัวรับการแจ้งเตือนเมื่อแอปทำงานอยู่
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // ตัวรับการตอบสนองของการแจ้งเตือน (เมื่อกดที่การแจ้งเตือน)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
      const data = response.notification.request.content.data;
      
      // ตรวจสอบประเภทของการแจ้งเตือน
      if (data.type === 'offer_accepted') {
        // นำทางไปยังหน้างานที่เกี่ยวข้อง
        navigation.navigate('JobWorkingPickup', {
          requestId: data.request_id,
          offerId: data.offer_id
        });
      }
    });

    // คืนค่าตัวรับฟังก์ชันสำหรับการล้างเมื่อไม่ต้องการใช้
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  },

  // ส่งการแจ้งเตือนท้องถิ่น (สำหรับทดสอบ)
  sendLocalNotification: async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // แสดงทันที
    });
  }
};

export default NotificationService;