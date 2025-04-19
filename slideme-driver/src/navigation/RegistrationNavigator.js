// src/navigation/RegistrationNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import BasicInfoScreen from '../screens/registration/BasicInfoScreen';
import DocumentScanScreen from '../screens/registration/DocumentScanScreen';
import VerificationStatusScreen from '../screens/registration/VerificationStatusScreen';
import CreatePasswordScreen from '../screens/registration/CreatePasswordScreen';

const Stack = createStackNavigator();

/**
 * RegistrationNavigator - คอมโพเนนต์สำหรับนำทางในส่วนลงทะเบียนคนขับ
 * การลงทะเบียนมี 3 ขั้นตอนหลัก:
 * 1. กรอกข้อมูลเบื้องต้น (เบอร์โทร, ที่อยู่, ประเภทรถ)
 * 2. สแกนและอัปโหลดเอกสาร (ใบขับขี่, รถพร้อมป้ายทะเบียน, เอกสารรถ)
 * 3. สร้างรหัสผ่าน (หลังจากได้รับการอนุมัติแล้วเท่านั้น)
 */
const RegistrationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      {/* ขั้นตอนที่ 1: กรอกข้อมูลเบื้องต้น */}
      <Stack.Screen 
        name="BasicInfo" 
        component={BasicInfoScreen} 
        options={{ gestureEnabled: false }}
      />
      
      {/* ขั้นตอนที่ 2: สแกนและอัปโหลดเอกสาร */}
      <Stack.Screen 
        name="DocumentScan" 
        component={DocumentScanScreen}
        options={{ gestureEnabled: false }}
      />
      
      {/* หน้าแสดงสถานะการตรวจสอบและรอการอนุมัติ */}
      <Stack.Screen 
        name="VerificationStatus" 
        component={VerificationStatusScreen}
        options={{ gestureEnabled: false }}
      />
      
      {/* ขั้นตอนที่ 3: สร้างรหัสผ่าน (หลังจากได้รับการอนุมัติแล้ว) */}
      <Stack.Screen 
        name="CreatePassword" 
        component={CreatePasswordScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default RegistrationNavigator;