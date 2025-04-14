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
import { register } from '../../services/auth';
import { FONTS, COLORS, MESSAGES } from '../../constants';

const RegisterPasswordScreen = ({ navigation, route }) => {
  const routeParams = route.params || {};
  
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

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // เตรียมข้อมูลสำหรับการลงทะเบียน
      const documents = routeParams.documents || {};
      
      // ในกรณีที่มีการอัปโหลดรูปภาพ ต้องแปลงให้อยู่ในรูปแบบที่ส่งไปยัง API ได้
      const registrationData = {
        phone_number: routeParams.phoneNumber,
        password: password,
        first_name: routeParams.firstName,
        last_name: routeParams.lastName,
        id_number: routeParams.idNumber,
        birth_date: routeParams.birthDate,
        id_expiry_date: routeParams.idExpiryDate,
        license_plate: routeParams.licensePlate,
        province: routeParams.selectedProvince,
        vehicle_type: routeParams.selectedVehicleType,
      };
      
      // ถ้าในขั้นตอนการพัฒนา เรายังไม่มี API สำหรับอัปโหลดรูปภาพ
      // เราแค่จำลองว่าการลงทะเบียนสำเร็จ
      const response = await register(registrationData);
      
      if (response.Status) {
        setIsSuccess(true);
        
        // จำลองการโหลดข้อมูล (ตัวอย่าง)
        setTimeout(() => {
          Alert.alert(
            'ลงทะเบียนสำเร็จ',
            'บัญชีของคุณถูกสร้างขึ้นแล้ว คุณสามารถเข้าสู่ระบบได้เลย',
            [{ text: 'เข้าสู่ระบบ', onPress: () => navigation.navigate('Login') }]
          );
        }, 1500);
      } else {
        Alert.alert('ข้อผิดพลาด', response.Error || MESSAGES.ERRORS.REGISTRATION);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.CONNECTION);
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้าการลงทะเบียนสำเร็จ แสดงหน้าจอสำเร็จ
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
        title="ตั้งรหัสผ่าน"
        onBack={() => navigation.goBack()}
      />
      
      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps 
          currentStep={4} 
          totalSteps={4}
          stepTitles={['ข้อมูลเบื้องต้น', 'ข้อมูลส่วนตัว', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
        />
      </View>
      
      <ScrollView 
        contentContainerStyle={tw`p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`mb-8`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.MEDIUM,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 text-center mb-2`,
          }}>
            ขั้นตอนสุดท้าย!
          </Text>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw`text-gray-500 text-center`,
          }}>
            โปรดตั้งรหัสผ่านสำหรับบัญชีของคุณ
          </Text>
        </View>
        
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
      </ScrollView>
      
      <View style={tw`p-4 bg-white border-t border-gray-200`}>
        <AuthButton
          title="ลงทะเบียน"
          onPress={handleRegister}
          isLoading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegisterPasswordScreen;