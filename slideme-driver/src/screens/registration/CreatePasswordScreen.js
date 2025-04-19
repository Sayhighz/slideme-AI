// src/screens/registration/CreatePasswordScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter';
import RegistrationSteps from '../../components/auth/RegistrationSteps';

// Import services and constants
import { postRequest } from '../../services/api';
import { FONTS, COLORS, MESSAGES } from '../../constants';
import { API_ENDPOINTS } from '../../constants';

const CreatePasswordScreen = ({ navigation, route }) => {
  const { driverId, phoneNumber } = route.params || {};
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = { message: 'กรุณากรอกรหัสผ่าน' };
    } else if (password.length < 8) {
      newErrors.password = { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = { message: 'กรุณายืนยันรหัสผ่าน' };
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = { message: 'รหัสผ่านไม่ตรงกัน' };
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const completeRegistration = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // ส่งคำขอสร้างรหัสผ่านไปยัง API
      const response = await postRequest(API_ENDPOINTS.AUTH.CREATE_PASSWORD, {
        driver_id: driverId,
        phone_number: phoneNumber,
        password: password
      });
      
      console.log('Create Password Response:', response);
      
      if (response.Status) {
        setIsSuccess(true);
        
        // แจ้งเตือนผู้ใช้เมื่อสร้างรหัสผ่านสำเร็จ
        setTimeout(() => {
          Alert.alert(
            'สร้างรหัสผ่านสำเร็จ',
            'คุณสามารถเข้าสู่ระบบได้ด้วยเบอร์โทรศัพท์และรหัสผ่านที่สร้าง',
            [
              { 
                text: 'เข้าสู่ระบบ',
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                })
              }
            ]
          );
        }, 1500);
      } else {
        // แจ้งเตือนผู้ใช้เมื่อเกิดข้อผิดพลาด
        Alert.alert(
          'เกิดข้อผิดพลาด',
          response.Error || 'ไม่สามารถสร้างรหัสผ่านได้ กรุณาลองอีกครั้ง'
        );
      }
    } catch (error) {
      console.error('Error creating password:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถสร้างรหัสผ่านได้ กรุณาลองอีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้าการสร้างรหัสผ่านสำเร็จ แสดงหน้าจอสำเร็จ
  if (isSuccess) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white items-center justify-center px-6`}>
        <Animatable.View 
          animation="bounceIn" 
          duration={1000}
          style={tw`items-center`}
        >
          <View style={tw`w-24 h-24 rounded-full bg-[${COLORS.PRIMARY}] items-center justify-center mb-6`}>
            <Icon name="check" size={60} color="#fff" />
          </View>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.MEDIUM,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 text-center mb-3`,
          }}>
            ลงทะเบียนสำเร็จ!
          </Text>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.M,
            ...tw`text-gray-600 text-center mb-6`,
          }}>
            บัญชีของคุณได้รับการสร้างเรียบร้อยแล้ว
          </Text>
          
          <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.S,
            ...tw`text-gray-500 mt-2`,
          }}>
            กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
          </Text>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="สร้างรหัสผ่าน"
        onBack={() => navigation.goBack()}
      />
      
      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps 
          currentStep={3} 
          totalSteps={3}
          stepTitles={['ข้อมูลเบื้องต้น', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
        />
      </View>
      
      <ScrollView 
        contentContainerStyle={tw`p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <Animatable.View animation="fadeIn" duration={800}>
          <View style={tw`mb-8`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              fontSize: FONTS.SIZE.XL,
              ...tw`text-gray-800 text-center mb-2`,
            }}>
              ยินดีด้วย!
            </Text>
            
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              ...tw`text-gray-600 text-center`,
            }}>
              การลงทะเบียนของคุณได้รับการอนุมัติแล้ว กรุณาสร้างรหัสผ่านเพื่อเริ่มใช้งาน
            </Text>
          </View>
        </Animatable.View>
        
        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <View style={tw`mb-6`}>
            <View style={tw`relative`}>
              <AuthInput
                label="รหัสผ่าน"
                value={password}
                onChangeText={setPassword}
                placeholder="รหัสผ่าน"
                secureTextEntry={!showPassword}
                error={errors.password}
              />
              
              <TouchableOpacity 
                style={tw`absolute right-4 top-11`}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            
            {/* Password strength indicator */}
            <PasswordStrengthMeter password={password} />
            
            <View style={tw`relative`}>
              <AuthInput
                label="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="ยืนยันรหัสผ่าน"
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
              />
              
              <TouchableOpacity 
                style={tw`absolute right-4 top-11`}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={tw`bg-blue-50 p-4 rounded-lg border border-blue-200 mb-8`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.S,
              ...tw`text-blue-800 mb-2`,
            }}>
              คำแนะนำในการสร้างรหัสผ่านที่ปลอดภัย:
            </Text>
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.XS,
              ...tw`text-blue-800`,
            }}>
              • ใช้อักษรอย่างน้อย 8 ตัว{'\n'}
              • ใช้ตัวอักษรพิมพ์ใหญ่และพิมพ์เล็ก{'\n'}
              • ใช้ตัวเลขและอักขระพิเศษ{'\n'}
              • หลีกเลี่ยงข้อมูลส่วนตัวที่คาดเดาได้ง่าย
            </Text>
          </View>
        </Animatable.View>
      </ScrollView>
      
      <View style={tw`p-4 bg-white border-t border-gray-200`}>
        <AuthButton
          title="ยืนยันและเข้าสู่ระบบ"
          onPress={completeRegistration}
          isLoading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default CreatePasswordScreen;