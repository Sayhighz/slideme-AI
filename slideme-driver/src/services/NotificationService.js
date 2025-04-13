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
    priority: Notifications.AndroidNotificationPriority.MAX, // ตั้งค่าความสำคัญสูงสุดสำหรับ Android
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
      let { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        existingStatus = status;
      }
      
      if (existingStatus !== 'granted') {
        console.log('ไม่ได้รับอนุญาตให้แสดงการแจ้งเตือน!');
        return;
      }

      // สำหรับ iOS ต้องขอสิทธิ์เพิ่มเติมเพื่อแสดงการแจ้งเตือนเมื่อแอพอยู่ในพื้นหลัง
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('offer_accepted', [{
          identifier: 'accept',
          buttonTitle: 'ดูรายละเอียด',
          options: {
            opensAppToForeground: true,
          },
        }]);
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

      // ตั้งค่าช่องทางการแจ้งเตือนสำหรับ Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('offer_accepted', {
          name: 'Offer Accepted',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#60B876', // สีไฟการแจ้งเตือนตาม theme ของแอพ
          sound: true,
          enableVibrate: true,
          // ตั้งค่าเพิ่มเติมเพื่อให้แน่ใจว่าการแจ้งเตือนจะแสดงถึงแม้แอพจะปิดอยู่
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      console.log('Push notification token:', expoPushToken);
      return expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  },

  // ยกเลิกข้อเสนออื่นๆ เมื่อมีข้อเสนอที่ได้รับการยอมรับ
  cancelOtherOffers: async (driverId, acceptedRequestId) => {
    try {
      const response = await postRequest(API_ENDPOINTS.JOBS.REJECT_ALL_OFFERS, {
        driver_id: driverId,
        exclude_request_id: acceptedRequestId // ไม่ยกเลิกข้อเสนอที่ได้รับการยอมรับ
      });
      
      console.log("Cancelled all other offers successfully:", response);
      return response;
    } catch (error) {
      console.error("Error cancelling other offers:", error);
      throw error;
    }
  },

  // สำหรับการกดที่การแจ้งเตือน - ควรเรียกใช้ใน AppNavigator
  setupNotificationResponse: (navigation) => {
    // ตัวรับการแจ้งเตือนเมื่อแอปกำลังทำงานอยู่ (Foreground)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // คุณสามารถเพิ่มการจัดการพิเศษเมื่อแอพอยู่ในสถานะ foreground ที่นี่
      // เช่น แสดง in-app notification หรือเล่นเสียง
    });

    // ตัวรับการตอบสนองของการแจ้งเตือน (เมื่อกดที่การแจ้งเตือน)
    const responseListener = Notifications.addNotificationResponseReceivedListener(async response => {
      console.log('Notification clicked:', response);
      const data = response.notification.request.content.data;
      
      // ตรวจสอบประเภทของการแจ้งเตือน
      if (data.type === 'offer_accepted') {
        try {
          // ยกเลิกข้อเสนออื่นๆ ทั้งหมด
          if (data.driver_id && data.request_id) {
            console.log("Cancelling other offers for driver:", data.driver_id);
            await NotificationService.cancelOtherOffers(data.driver_id, data.request_id);
          }
          
          // นำทางไปยังหน้างานที่เกี่ยวข้อง
          console.log("Navigating to JobWorkingPickup with request_id:", data.request_id);
          navigation.navigate('JobWorkingPickup', {
            request_id: data.request_id,
            userData: { 
              driver_id: data.driver_id,
              // ข้อมูลอื่นๆ ที่จำเป็น
              first_name: data.driver_first_name,
              last_name: data.driver_last_name,
              // เพิ่มข้อมูลตามที่จำเป็นสำหรับหน้า JobWorkingPickup
            }
          });
        } catch (error) {
          console.error("Error handling notification click:", error);
        }
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
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: data.type === 'offer_accepted' ? 'offer_accepted' : 'default',
          // เพิ่ม custom sound ถ้าต้องการ
          // categoryId: data.type === 'offer_accepted' ? 'offer_accepted' : undefined, // สำหรับ iOS
        },
        trigger: null, // แสดงทันที
      });
      console.log("Local notification sent successfully");
    } catch (error) {
      console.error("Error sending local notification:", error);
    }
  },
};

export default NotificationService;