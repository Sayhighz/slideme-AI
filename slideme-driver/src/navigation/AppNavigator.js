import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { checkAuth } from '../services/auth';
import NotificationService from '../services/NotificationService';
import { styles } from '../styles/common';

const AppNavigator = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await checkAuth();
        setUserData(user);
        console.log('User data:', user);

        // ลงทะเบียนสำหรับการแจ้งเตือน push หากมีข้อมูลผู้ใช้
        if (user) {
          await NotificationService.registerForPushNotifications(user.driver_id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

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
    <NavigationContainer ref={navigationRef}>
      {userData ? <MainNavigator userData={userData} /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;