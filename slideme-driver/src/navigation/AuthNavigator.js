import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegistrationNavigator from './RegistrationNavigator';

const Stack = createStackNavigator();

/**
 * AuthNavigator - คอมโพเนนต์สำหรับนำทางในส่วนการเข้าสู่ระบบและลงทะเบียน
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      {/* หน้าล็อกอิน */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      
      {/* การลงทะเบียน (ใช้ RegistrationNavigator แทนหน้าจอเดิม) */}
      <Stack.Screen 
        name="Register" 
        component={RegistrationNavigator} 
      />
      
      {/* หน้าลืมรหัสผ่าน */}
      {/* <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      /> */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;