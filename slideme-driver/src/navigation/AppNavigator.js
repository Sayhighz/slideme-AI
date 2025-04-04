import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { checkAuth } from '../services/auth';
import { styles } from '../styles/common';

const AppNavigator = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await checkAuth();
        setUserData(user);
        console.log('User data:', user);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#60B876" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userData ? <MainNavigator userData={userData} /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;