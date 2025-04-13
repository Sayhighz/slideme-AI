import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { checkAuth } from '../services/auth';
import NotificationService from '../services/NotificationService';
import OfferNotificationService from '../services/OfferNotificationService';
import OfferAcceptedModal from '../components/common/OfferAcceptedModal';
import { styles } from '../styles/common';

// เพิ่มฟังก์ชัน Debug
const debug = (message) => {
  if (__DEV__) {
    console.log(`[AppNavigator] ${message}`);
  }
};

const AppNavigator = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedOffer, setAcceptedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const navigationRef = useRef();

  // ฟังก์ชันตรวจสอบว่ากำลังอยู่ในหน้าที่เกี่ยวกับการทำงานหรือไม่
  const isInJobWorkingScreen = () => {
    if (!navigationRef.current) return false;
    
    // ดึงสถานะปัจจุบันของการนำทาง
    const currentRoute = navigationRef.current.getCurrentRoute();
    if (!currentRoute) return false;
    
    // รายชื่อหน้าจอที่เกี่ยวกับการทำงาน
    const jobWorkingScreens = [
      'JobWorkingPickup',
      'JobWorkingDropoff',
      'CarUploadPickUpConfirmation',
      'CarUploadDropOffConfirmation'
    ];
    
    // ตรวจสอบว่าอยู่ในหน้าจอที่เกี่ยวกับการทำงานหรือไม่
    const isJobScreen = jobWorkingScreens.includes(currentRoute.name);
    debug(`Current screen: ${currentRoute.name}, isJobWorkingScreen: ${isJobScreen}`);
    return isJobScreen;
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await checkAuth();
        setUserData(user);
        debug('User data loaded:', user?.driver_id);

        // ลงทะเบียนสำหรับการแจ้งเตือน push หากมีข้อมูลผู้ใช้
        if (user) {
          await NotificationService.registerForPushNotifications(user.driver_id);
          
          // เริ่มตรวจสอบ offer ที่ได้รับการยอมรับ
          debug(`Starting offer notification service for driver ${user.driver_id}`);
          OfferNotificationService.startChecking(user.driver_id, handleOfferAccepted);
          
          // ตรวจสอบทันทีหลังจาก login
          const result = await OfferNotificationService.checkNow(user.driver_id);
          debug(`Initial check result: has_accepted_offer=${result.has_accepted_offer}`);
          if (result.has_accepted_offer) {
            handleOfferAccepted(result.offer);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
    
    // Cleanup function
    return () => {
      if (userData?.driver_id) {
        debug(`Stopping offer notification service for driver ${userData.driver_id}`);
        OfferNotificationService.stopChecking();
      }
    };
  }, []);

  // จัดการเมื่อ offer ได้รับการยอมรับ
  const handleOfferAccepted = async (offer) => {
    debug(`Offer accepted handler called with offer ID: ${offer?.offer_id}`);
    
    // ตรวจสอบ active request ID
    const activeRequestId = await OfferNotificationService.getActiveRequestId();
    debug(`Active request ID: ${activeRequestId}, Offer request ID: ${offer?.request_id}`);
    
    // ถ้ากำลังทำงานกับ request นี้อยู่แล้ว ไม่ต้องแสดง modal
    if (activeRequestId && offer && activeRequestId === offer.request_id) {
      debug('Skip showing offer modal because user is working on this request already');
      return;
    }
    
    // ถ้ากำลังอยู่ในหน้าที่เกี่ยวกับการทำงาน ไม่ต้องแสดง Modal
    if (isInJobWorkingScreen()) {
      debug('Skip showing offer modal because user is in job working screen');
      return;
    }
    
    // ตรวจสอบว่ามีการแสดง Modal อยู่แล้วหรือไม่
    if (showOfferModal) {
      debug('Skip showing offer modal because modal is already shown');
      return;
    }
    
    debug(`Showing offer modal for offer ID: ${offer?.offer_id}`);
    setAcceptedOffer(offer);
    setShowOfferModal(true);
  };

  // จัดการเมื่อกดปุ่มเริ่มงานทันที
  const handleStartJob = async (offer) => {
    debug(`Starting job for offer ID: ${offer?.offer_id}`);
    setShowOfferModal(false);
    
    // นำทางไปยังหน้า JobWorkingPickup
    if (navigationRef.current && offer) {
      // บันทึก active request id ก่อนที่จะนำทางไปยังหน้า JobWorkingPickup
      await OfferNotificationService.setActiveRequestId(offer.request_id);
      debug(`Set active request ID: ${offer.request_id}`);
      
      navigationRef.current.navigate('JobWorkingPickup', {
        request_id: offer.request_id,
        userData
      });
    }
  };

  useEffect(() => {
    // ตั้งค่าการจัดการการแจ้งเตือนหากมีการนำทาง
    if (navigationRef.current) {
      const unsubscribe = NotificationService.setupNotificationResponse(navigationRef.current);
      return unsubscribe;
    }
  }, [navigationRef.current]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#60B876" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {userData ? <MainNavigator userData={userData} /> : <AuthNavigator />}
      </NavigationContainer>
      
      {/* Modal แสดงเมื่อ offer ได้รับการยอมรับ */}
      <OfferAcceptedModal
        visible={showOfferModal}
        offer={acceptedOffer}
        onClose={() => {
          debug('Offer modal closed by user');
          setShowOfferModal(false);
        }}
        onStartJob={handleStartJob}
      />
    </>
  );
};

export default AppNavigator;