// src/screens/registration/BasicInfoScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import CustomDropdown from '../../components/auth/CustomDropdown';
import RegistrationSteps from '../../components/auth/RegistrationSteps';

// Import services and constants
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from '../../constants';
import { checkPhoneNumberExists } from '../../services/auth';

// Hardcoded PROVINCES and VEHICLE_TYPES to ensure correctness
const PROVINCES = [
  { label: "กรุงเทพมหานคร", value: "bangkok" },
  { label: "เชียงใหม่", value: "chiangmai" },
  { label: "ภูเก็ต", value: "phuket" },
  { label: "ชลบุรี", value: "chonburi" },
  { label: "นครราชสีมา", value: "korat" },
  { label: "ขอนแก่น", value: "khonkaen" },
  { label: "เชียงราย", value: "chiangrai" },
  { label: "อุดรธานี", value: "udonthani" },
  { label: "อุบลราชธานี", value: "ubonratchathani" },
  { label: "สงขลา", value: "songkhla" },
  { label: "นครศรีธรรมราช", value: "nakhonsithammarat" },
  { label: "สุราษฎร์ธานี", value: "suratthani" },
  { label: "ระยอง", value: "rayong" },
  { label: "อื่นๆ", value: "other" }
];

const VEHICLE_TYPES = [
  { label: "รถสไลด์มาตรฐาน", value: 1 },
  { label: "รถสไลด์ขนาดใหญ่", value: 2 },
  { label: "รถสไลด์สำหรับรถหรู", value: 3 },
  { label: "รถสไลด์ฉุกเฉิน", value: 4 }
];

const BasicInfoScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [isAcceptTerms, setIsAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // New states for password and password confirmation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = () => {
    const newErrors = {};

    // Existing validations
    if (!phoneNumber) {
      newErrors.phoneNumber = { message: 'กรุณากรอกเบอร์โทรศัพท์' };
    } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = { message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' };
    }

    if (!selectedProvince) {
      newErrors.province = { message: 'กรุณาเลือกจังหวัด' };
    }

    if (!selectedVehicleType) {
      newErrors.vehicleType = { message: 'กรุณาเลือกประเภทรถ' };
    }

    if (!isAcceptTerms) {
      newErrors.terms = { message: 'กรุณายอมรับเงื่อนไข' };
    }

    // New password validations
    if (!password) {
      newErrors.password = { message: 'กรุณากรอกรหัสผ่าน' };
    } else if (password.length < 6) {
      newErrors.password = { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = { message: 'กรุณายืนยันรหัสผ่าน' };
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = { message: 'รหัสผ่านไม่ตรงกัน' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle the "Accept Terms" button toggle
  const handleAcceptTerms = () => {
    setIsAcceptTerms(!isAcceptTerms);
  };

  // Handle the "Next" button click
  const handleNext = async () => {
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    setIsLoading(true);
    console.log("Checking phone number:", phoneNumber);
    
    try {
      console.log("About to call checkPhoneNumberExists API");
      // ตรวจสอบว่าเบอร์โทรศัพท์มีในระบบหรือไม่
      const canRegister = await checkPhoneNumberExists(phoneNumber);
      console.log("API response (canRegister):", canRegister);
      
      if (!canRegister) {
        console.log("Phone number already registered");
        Alert.alert('เบอร์โทรศัพท์นี้ถูกลงทะเบียนไปแล้ว');
        return;
      }
      
      console.log("Phone check passed, navigating to next screen");
      navigation.navigate('DocumentScan', {
        phoneNumber,
        selectedProvince,
        selectedVehicleType,
        password,
      });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="ลงทะเบียน"
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={tw`p-6`}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tw`px-4 pt-2 mb-6`}>
            <RegistrationSteps 
              currentStep={1} 
              totalSteps={3}
              stepTitles={['ข้อมูลเบื้องต้น', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
            />
          </View>
          
          <Animatable.View animation="fadeIn" duration={800}>
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              fontSize: FONTS.SIZE.XL,
              ...tw`text-center text-gray-800 mb-8`,
            }}>
              ข้อมูลเบื้องต้น
            </Text>
          </Animatable.View>
          
          <Animatable.View animation="fadeInUp" duration={800} delay={300}>
            <AuthInput
              label="เบอร์โทรศัพท์"
              value={phoneNumber}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setPhoneNumber(text);
                }
              }}
              placeholder="เบอร์โทรศัพท์"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              maxLength={10}
            />
            
            <CustomDropdown
              label="เลือกจังหวัด"
              items={PROVINCES}
              value={selectedProvince}
              onValueChange={setSelectedProvince}
              error={errors.province}
              placeholder="เลือกจังหวัด"
            />
            
            <CustomDropdown
              label="เลือกประเภทรถ"
              items={VEHICLE_TYPES}
              value={selectedVehicleType}
              onValueChange={setSelectedVehicleType}
              error={errors.vehicleType}
              placeholder="เลือกประเภทรถ"
            />
            
            {/* New Password Input */}
            <AuthInput
              label="รหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              placeholder="รหัสผ่าน"
              secureTextEntry
              error={errors.password}
            />

            {/* New Confirm Password Input */}
            <AuthInput
              label="ยืนยันรหัสผ่าน"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="ยืนยันรหัสผ่าน"
              secureTextEntry
              error={errors.confirmPassword}
            />
            
            <TouchableOpacity
              style={tw`flex-row items-center mb-6 mt-4`}
              onPress={handleAcceptTerms}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tw`w-6 h-6 rounded mr-2 items-center justify-center`,
                  isAcceptTerms 
                    ? { backgroundColor: COLORS.PRIMARY } 
                    : tw`bg-white border-2 border-gray-300`
                ]}
              >
                {isAcceptTerms && (
                  <Animatable.View animation="bounceIn" duration={300}>
                    <Text style={tw`text-white text-sm font-bold`}>
                      ✓
                    </Text>
                  </Animatable.View>
                )}
              </View>
              
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-gray-700`,
                }}
              >
                ยอมรับเงื่อนไขการใช้งาน SLIDEME
              </Text>
            </TouchableOpacity>
            
            {errors.terms && (
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`text-red-500 mb-4`,
                }}
              >
                {errors.terms.message}
              </Text>
            )}
            
            <View style={tw`mt-4`}>
              <AuthButton
                title="ถัดไป"
                onPress={handleNext}
                isLoading={isLoading}
              />
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BasicInfoScreen;
