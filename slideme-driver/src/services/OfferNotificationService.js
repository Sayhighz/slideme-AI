// src/services/OfferNotificationService.js
import { getRequest } from './api';
import { API_ENDPOINTS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

// เพิ่มระบบ debugging
const DEBUG_TAG = "OFFER_NOTIFICATION";
const debug = (message, data = null) => {
  if (__DEV__) { // ทำงานเฉพาะใน development mode
    if (data) {
      console.log(`[${DEBUG_TAG}] ${message}`, data);
    } else {
      console.log(`[${DEBUG_TAG}] ${message}`);
    }
  }
  
  // บันทึกลง AsyncStorage เพื่อดูย้อนหลังได้
  saveDebugLog(`${message} ${data ? JSON.stringify(data) : ''}`);
};

// ฟังก์ชันบันทึก log ลง AsyncStorage
const saveDebugLog = async (message) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}`;
    
    // ดึง logs ที่มีอยู่
    const existingLogs = await AsyncStorage.getItem('offer_notification_logs') || '[]';
    const logs = JSON.parse(existingLogs);
    
    // จำกัดจำนวน logs ไม่เกิน 100 รายการ
    logs.unshift(logEntry);
    if (logs.length > 100) {
      logs.pop();
    }
    
    // บันทึกกลับ
    await AsyncStorage.setItem('offer_notification_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving debug log:', error);
  }
};

// ชื่อ task สำหรับ background fetch
const BACKGROUND_FETCH_TASK = 'check-accepted-offers';

// เก็บค่า callback function สำหรับเมื่อมี offer ที่ถูกยอมรับ
let onOfferAcceptedCallback = null;

// ตั้งค่า task สำหรับ background fetch
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  debug('Background fetch task started');
  try {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      debug('No user data found in background fetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
          title: 'มีงานใหม่สำหรับคุณ!',
          body: `ข้อเสนอของคุณสำหรับการเดินทางจาก ${result.offer.location_from} ไป ${result.offer.location_to} ได้รับการยอมรับแล้ว`,
          data: { 
            type: 'offer_accepted',
            offer_id: result.offer.offer_id,
            request_id: result.offer.request_id
          },
        },
        trigger: null, // แสดงทันที
      });
    
    const user = JSON.parse(userData);
    debug(`Checking offers for driver ${user.driver_id} in background`);
    
    const result = await checkAcceptedOffers(user.driver_id);
    debug('Background check result', result);
    
    if (result.has_accepted_offer) {
      debug('Found accepted offer in background', result.offer);
      
      // ตรวจสอบว่ากำลังทำงานกับ request นี้อยู่หรือไม่
      const activeRequestId = await getActiveRequestId();
      if (activeRequestId && result.offer.request_id === activeRequestId) {
        debug(`Offer ${result.offer.offer_id} is for active request, skipping notification`);
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      
      // เช็คว่าเคยแสดง notification สำหรับ offer นี้หรือยัง
      const notifiedOfferIds = await AsyncStorage.getItem('notified_offer_ids') || '[]';
      const notifiedIds = JSON.parse(notifiedOfferIds);
      
      // ถ้ายังไม่เคยแสดง notification สำหรับ offer นี้
      if (!notifiedIds.includes(result.offer.offer_id)) {
        debug(`Scheduling notification for offer ${result.offer.offer_id}`);
        
        // แสดง notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'มีงานใหม่สำหรับคุณ!',
            body: `ข้อเสนอของคุณสำหรับการเดินทางจาก ${result.offer.location_from} ไป ${result.offer.location_to} ได้รับการยอมรับแล้ว`,
            data: { 
              type: 'offer_accepted',
              offer_id: result.offer.offer_id,
              request_id: result.offer.request_id
            },
          },
          trigger: null, // แสดงทันที
        });
        
        // เพิ่ม offer_id เข้าไปในรายการที่เคยแจ้งเตือนแล้ว
        notifiedIds.push(result.offer.offer_id);
        await AsyncStorage.setItem('notified_offer_ids', JSON.stringify(notifiedIds));
        debug(`Added offer ${result.offer.offer_id} to notified list`);
      } else {
        debug(`Offer ${result.offer.offer_id} already notified, skipping notification`);
      }
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    debug('No accepted offers found in background');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    debug('Error in background fetch', error.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ฟังก์ชันสำหรับตรวจสอบ offer ที่ถูกยอมรับ
async function checkAcceptedOffers(driverId) {
  debug(`Checking accepted offers for driver ${driverId}`);
  try {
    const endpoint = `${API_ENDPOINTS.JOBS.CHECK_ACCEPTED_OFFER}?driver_id=${driverId}`;
    debug(`Making API request to: ${endpoint}`);
    
    const response = await getRequest(endpoint);
    debug('API response received', response);
    
    // ถ้ามี offer ที่ถูกยอมรับ ให้ตรวจสอบว่าเป็น offer ที่กำลังทำงานอยู่หรือไม่
    if (response.has_accepted_offer) {
      const activeRequestId = await getActiveRequestId();
      debug(`Active request ID: ${activeRequestId}, Offer request ID: ${response.offer.request_id}`);
      
      // ถ้ากำลังทำงานกับ offer นี้อยู่แล้ว ไม่ต้องแจ้งเตือนอีก
      if (activeRequestId && response.offer.request_id === parseInt(activeRequestId)) {
        debug(`Offer ${response.offer.offer_id} is already being worked on, skipping notification`);
        return { has_accepted_offer: false, offer: null };
      }
    }
    
    return response;
  } catch (error) {
    debug('Error checking accepted offers', error.message);
    return { has_accepted_offer: false, offer: null };
  }
}

// บันทึก request_id ที่กำลังทำงานอยู่
async function setActiveRequestId(requestId) {
  try {
    if (requestId) {
      debug(`Setting active request ID: ${requestId}`);
      await AsyncStorage.setItem('active_request_id', requestId.toString());
    } else {
      debug('Clearing active request ID');
      await AsyncStorage.removeItem('active_request_id');
    }
  } catch (error) {
    debug('Error setting active request ID', error.message);
  }
}

// ตรวจสอบว่ากำลังทำงานกับ request_id ใดอยู่
async function getActiveRequestId() {
  try {
    const requestId = await AsyncStorage.getItem('active_request_id');
    debug(`Get active request ID: ${requestId || 'none'}`);
    return requestId ? parseInt(requestId) : null;
  } catch (error) {
    debug('Error getting active request ID', error.message);
    return null;
  }
}

// ตัวแปรสำหรับเก็บ interval ID
let foregroundCheckInterval = null;
let appStateSubscription = null;

// เริ่มการตรวจสอบเมื่อแอพเปิดอยู่
function startForegroundChecking(driverId) {
  debug(`Starting foreground checking for driver ${driverId}`);
  
  // ตรวจสอบทุกๆ 30 วินาทีเมื่อแอพเปิดอยู่
  foregroundCheckInterval = setInterval(async () => {
    // ตรวจสอบสถานะของแอพ
    if (AppState.currentState === 'active') {
      debug('Performing foreground interval check');
      const result = await checkAcceptedOffers(driverId);
      
      // ถ้ามี offer ที่ถูกยอมรับและมี callback function
      if (result.has_accepted_offer && onOfferAcceptedCallback) {
        debug('Found accepted offer in foreground interval check', result.offer);
        onOfferAcceptedCallback(result.offer);
      } else {
        debug('No accepted offers found in foreground interval check');
      }
    } else {
      debug(`App state is ${AppState.currentState}, skipping foreground check`);
    }
  }, 30000); // 30 วินาที
  debug('Foreground check interval set up');
  
  // ติดตามการเปลี่ยนแปลงสถานะของแอพ
  debug('Setting up AppState change listener');
  appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
    debug(`AppState changed to: ${nextAppState}`);
    // เมื่อแอพกลับมาทำงานในหน้าจอ
    if (nextAppState === 'active') {
      debug('App became active, performing check');
      const result = await checkAcceptedOffers(driverId);
      
      // ถ้ามี offer ที่ถูกยอมรับและมี callback function
      if (result.has_accepted_offer && onOfferAcceptedCallback) {
        debug('Found accepted offer on app resume', result.offer);
        onOfferAcceptedCallback(result.offer);
      } else {
        debug('No accepted offers found on app resume');
      }
    }
  });
  debug('AppState change listener set up');
}

// หยุดการตรวจสอบเมื่อแอพเปิดอยู่
function stopForegroundChecking() {
  debug('Stopping foreground checking');
  if (foregroundCheckInterval) {
    clearInterval(foregroundCheckInterval);
    foregroundCheckInterval = null;
    debug('Foreground check interval cleared');
  }
  
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
    debug('AppState change listener removed');
  }
}

// บริการจัดการการแจ้งเตือน offer ที่ถูกยอมรับ
const OfferNotificationService = {
  // เริ่มการตรวจสอบ offer ที่ถูกยอมรับ
  startChecking: async (driverId, onOfferAccepted) => {
    debug(`Starting offer notification service for driver ${driverId}`);
    
    // บันทึก callback function
    onOfferAcceptedCallback = onOfferAccepted;
    debug('Callback function registered');
    
    try {
      // ลงทะเบียน background fetch task
      debug('Registering background fetch task');
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // ตรวจสอบทุก 15 นาที (ค่าต่ำสุดที่ iOS อนุญาต)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      debug('Background fetch task registered successfully');
      
      // เริ่มการตรวจสอบเมื่อแอพเปิดอยู่
      debug('Starting foreground checking');
      startForegroundChecking(driverId);
      
      // ตรวจสอบทันทีเมื่อเริ่มบริการ
      debug('Performing immediate check');
      const result = await checkAcceptedOffers(driverId);
      if (result.has_accepted_offer && onOfferAcceptedCallback) {
        debug('Found accepted offer on service start', result.offer);
        onOfferAcceptedCallback(result.offer);
      }
      
      debug('Offer notification service started successfully');
    } catch (error) {
      debug('Error starting offer notification service', error.message);
    }
  },
  
  // หยุดการตรวจสอบ offer ที่ถูกยอมรับ
  stopChecking: async () => {
    debug('Stopping offer notification service');
    try {
      // ยกเลิกการลงทะเบียน background fetch task
      debug('Unregistering background fetch task');
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      debug('Background fetch task unregistered');
      
      // หยุดการตรวจสอบเมื่อแอพเปิดอยู่
      stopForegroundChecking();
      
      // ล้าง callback function
      onOfferAcceptedCallback = null;
      debug('Callback function cleared');
      
      debug('Offer notification service stopped successfully');
    } catch (error) {
      debug('Error stopping offer notification service', error.message);
    }
  },
  
  // ล้างรายการ offer ที่เคยแจ้งเตือนแล้ว
  clearNotifiedOffers: async () => {
    debug('Clearing notified offers list');
    try {
      await AsyncStorage.setItem('notified_offer_ids', '[]');
      debug('Notified offers list cleared successfully');
    } catch (error) {
      debug('Error clearing notified offers', error.message);
    }
  },
  
  // ตรวจสอบ offer ที่ถูกยอมรับทันที (สำหรับเรียกใช้เมื่อต้องการตรวจสอบทันที)
  checkNow: async (driverId) => {
    debug(`Manual check requested for driver ${driverId}`);
    const result = await checkAcceptedOffers(driverId);
    debug('Manual check result', result);
    return result;
  },
  
  // เพิ่มฟังก์ชันสำหรับดู debug logs
  getDebugLogs: async () => {
    try {
      const logs = await AsyncStorage.getItem('offer_notification_logs') || '[]';
      return JSON.parse(logs);
    } catch (error) {
      console.error('Error getting debug logs:', error);
      return [];
    }
  },

  clearDebugLogs: async () => {
    try {
      await AsyncStorage.setItem('offer_notification_logs', '[]');
      debug('Debug logs cleared');
    } catch (error) {
      console.error('Error clearing debug logs:', error);
    }
  },
  
  // บันทึก request_id ที่กำลังทำงานอยู่
  setActiveRequestId: setActiveRequestId,
  
  // ตรวจสอบว่ากำลังทำงานกับ request_id ใดอยู่
  getActiveRequestId: getActiveRequestId
};

export default OfferNotificationService;