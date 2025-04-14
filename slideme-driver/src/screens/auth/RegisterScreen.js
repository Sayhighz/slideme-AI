import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import tw from 'twrnc';
import * as Animatable from 'react-native-animatable';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthLogo from '../../components/auth/AuthLogo';
import RegistrationSteps from '../../components/auth/RegistrationSteps';
import CustomDropdown from '../../components/auth/CustomDropdown';

// Import services and constants
import { postRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from '../../constants';

// กำหนดค่า PROVINCES และ VEHICLE_TYPES แบบ hardcode เพื่อให้แน่ใจว่ามีค่าถูกต้อง
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
  { label: "รถสไลด์มาตรฐาน", value: "standard_slide" },
  { label: "รถสไลด์ขนาดใหญ่", value: "heavy_duty_slide" },
  { label: "รถสไลด์สำหรับรถหรู", value: "luxury_slide" },
  { label: "รถสไลด์ฉุกเฉิน", value: "emergency_slide" }
];

const RegisterScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [isAcceptTerms, setIsAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Animation references
  const checkboxScale = useRef(new Animated.Value(1)).current;

  const validateForm = () => {
    const newErrors = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ตรวจสอบว่าเบอร์โทรศัพท์มีในระบบหรือไม่
  const checkPhoneNumberExists = async () => {
    try {
      const response = await postRequest(API_ENDPOINTS.AUTH.CHECK_PHONE, {
        phone_number: phoneNumber
      });
      
      return response.Exists;
    } catch (error) {
      console.error('Error checking phone number:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.CONNECTION);
      return false;
    }
  };

  // เมื่อกดปุ่มยอมรับเงื่อนไข
  const handleAcceptTerms = () => {
    // Animation when checkbox is clicked
    Animated.sequence([
      Animated.timing(checkboxScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(checkboxScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    setIsAcceptTerms(!isAcceptTerms);
  };

  // เมื่อกดปุ่มถัดไป
  const handleNext = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // ตรวจสอบว่าเบอร์โทรศัพท์มีในระบบหรือไม่
      const phoneExists = await checkPhoneNumberExists();
      
      if (phoneExists) {
        setErrors({ phoneNumber: { message: 'เบอร์โทรนี้ถูกใช้ไปแล้ว' } });
        return;
      }
      
      // ถ้าไม่มีข้อผิดพลาด ไปยังหน้าถัดไป
      navigation.navigate('RegisterPersonalInfo', {
        phoneNumber,
        selectedProvince,
        selectedVehicleType,
      });
    } catch (error) {
      console.error('Registration error:', error);
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
              totalSteps={4}
              stepTitles={['ข้อมูลเบื้องต้น', 'ข้อมูลส่วนตัว', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
            />
          </View>
          
          <Animatable.View animation="fadeIn" duration={800}>
            <AuthLogo tagline="สมัครเป็นคนขับ" style="mb-6" />
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
            
            {/* ใช้ CustomDropdown แทน RNPickerSelect */}
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
            
            <TouchableOpacity
              style={tw`flex-row items-center mb-6`}
              onPress={handleAcceptTerms}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
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
              </Animated.View>
              
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

export default RegisterScreen;