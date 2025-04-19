// src/screens/auth/RegisterPersonalInfoScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import tw from 'twrnc';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import RegistrationSteps from '../../components/auth/RegistrationSteps';
import ThaiIDCardScanner from '../../components/auth/ThaiIDCardScanner';

// Import services and constants
import { FONTS, COLORS, MESSAGES } from '../../constants';
import { isValidDate, isValidLicensePlate } from '../../utils/validators';

const RegisterPersonalInfoScreen = ({ navigation, route }) => {
  const { phoneNumber, selectedProvince, selectedVehicleType } = route.params || {};
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [idExpiryDate, setIdExpiryDate] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // สำหรับ DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeField, setActiveField] = useState(null);

  // Prefill data if available (from OCR)
  useEffect(() => {
    if (route.params?.firstName) setFirstName(route.params.firstName);
    if (route.params?.lastName) setLastName(route.params.lastName);
    if (route.params?.idNumber) setIdNumber(route.params.idNumber);
    if (route.params?.birthDate) setBirthDate(route.params.birthDate);
    if (route.params?.idExpiryDate) setIdExpiryDate(route.params.idExpiryDate);
    if (route.params?.licensePlate) setLicensePlate(route.params.licensePlate);
  }, [route.params]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!firstName) {
      newErrors.firstName = { message: 'กรุณากรอกชื่อ' };
    }
    
    if (!lastName) {
      newErrors.lastName = { message: 'กรุณากรอกนามสกุล' };
    }
    
    if (!idNumber) {
      newErrors.idNumber = { message: 'กรุณากรอกเลขประจำตัวประชาชน' };
    } else if (!/^\d{13}$/.test(idNumber)) {
      newErrors.idNumber = { message: 'เลขประจำตัวประชาชนไม่ถูกต้อง' };
    }
    
    if (!birthDate) {
      newErrors.birthDate = { message: 'กรุณากรอกวันเกิด' };
    } else if (!isValidDate(birthDate)) {
      newErrors.birthDate = { message: 'รูปแบบวันเกิดไม่ถูกต้อง (YYYY-MM-DD)' };
    }
    
    if (!idExpiryDate) {
      newErrors.idExpiryDate = { message: 'กรุณากรอกวันหมดอายุใบขับขี่' };
    } else if (!isValidDate(idExpiryDate)) {
      newErrors.idExpiryDate = { message: 'รูปแบบวันหมดอายุไม่ถูกต้อง (YYYY-MM-DD)' };
    }
    
    if (!licensePlate) {
      newErrors.licensePlate = { message: 'กรุณากรอกทะเบียนรถ' };
    } else if (!isValidLicensePlate(licensePlate)) {
      newErrors.licensePlate = { message: 'ทะเบียนรถไม่ถูกต้อง' };
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const enforceDateFormat = (value) => {
    // Format YYYY-MM-DD
    const formattedValue = value.replace(/[^0-9]/g, '') // Remove non-numeric characters
      .replace(/(\d{4})(\d{0,2})(\d{0,2})/, (match, year, month, day) => {
        let result = year;
        if (month) result += '-' + month;
        if (day) result += '-' + day;
        return result;
      });
    return formattedValue.substring(0, 10); // Restrict length to YYYY-MM-DD
  };

  // จัดการการเปลี่ยนแปลงวันที่จาก DatePicker
  const handleDateChange = (event, selectedDate) => {
    const currentValue = selectedDate || currentDate;
    setShowDatePicker(false);
    setShowExpiryDatePicker(false);
    setCurrentDate(currentValue);
    
    // แปลงรูปแบบวันที่เป็น YYYY-MM-DD
    const formattedDate = format(currentValue, 'yyyy-MM-dd');
    
    if (activeField === 'birthDate') {
      setBirthDate(formattedDate);
    } else if (activeField === 'idExpiryDate') {
      setIdExpiryDate(formattedDate);
    }
  };

  // แสดง DatePicker
  const showDatePickerDialog = (fieldName) => {
    setActiveField(fieldName);
    
    if (fieldName === 'birthDate') {
      // ถ้ามีวันเกิดอยู่แล้ว ให้แสดงวันที่นั้น
      if (birthDate) {
        setCurrentDate(new Date(birthDate));
      } else {
        setCurrentDate(new Date());
      }
      setShowDatePicker(true);
    } else if (fieldName === 'idExpiryDate') {
      // ถ้ามีวันหมดอายุอยู่แล้ว ให้แสดงวันที่นั้น
      if (idExpiryDate) {
        setCurrentDate(new Date(idExpiryDate));
      } else {
        // ถ้าไม่มี ให้แสดงวันที่ 1 ปีข้างหน้า
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        setCurrentDate(date);
      }
      setShowExpiryDatePicker(true);
    }
  };

  // จัดการข้อมูลที่ได้จากการสแกนบัตรประชาชน
  const handleIDCardScanSuccess = (data) => {
    console.log('ID Card Scan Success:', data);
    
    // กรอกข้อมูลจากบัตรประชาชนลงในฟอร์ม
    setFirstName(data.firstName || '');
    setLastName(data.lastName || '');
    setIdNumber(data.idNumber || '');
    setBirthDate(data.birthDate || '');
    setIdExpiryDate(data.expireDate || '');
    
    // แสดงการแจ้งเตือนว่ากรอกข้อมูลสำเร็จ
    Alert.alert(
      'สแกนสำเร็จ',
      'ระบบกรอกข้อมูลจากบัตรประชาชนให้อัตโนมัติแล้ว โปรดตรวจสอบความถูกต้อง'
    );
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // ส่งข้อมูลไปยังหน้าถัดไป
      navigation.navigate('RegisterUpload', {
        phoneNumber,
        selectedProvince,
        selectedVehicleType,
        firstName,
        lastName,
        idNumber,
        birthDate,
        idExpiryDate,
        licensePlate,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="ข้อมูลส่วนตัว"
        onBack={() => navigation.goBack()}
      />
      
      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps 
          currentStep={2} 
          totalSteps={4}
          stepTitles={['ข้อมูลเบื้องต้น', 'ข้อมูลส่วนตัว', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
        />
      </View>
      
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={tw`p-6`}
          keyboardShouldPersistTaps="handled"
        >
          {/* Thai ID Card Scanner Component */}
          <ThaiIDCardScanner 
            onScanSuccess={handleIDCardScanSuccess}
            style={tw`mb-6`}
          />
          
          <Animatable.View animation="fadeInUp" duration={600} delay={200}>
            <View style={tw`mb-6`}>
              <View style={{
                ...tw`border-l-4 border-[${COLORS.PRIMARY}] pl-3 mb-6`,
              }}>
                <Text style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  fontSize: FONTS.SIZE.L,
                  ...tw`text-gray-800`,
                }}>
                  ข้อมูลส่วนตัว
                </Text>
              </View>
              
              <AuthInput
                label="ชื่อ (ตามบัตรประชาชน)*"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="ชื่อ"
                error={errors.firstName}
              />
              
              <AuthInput
                label="นามสกุล (ตามบัตรประชาชน)*"
                value={lastName}
                onChangeText={setLastName}
                placeholder="นามสกุล"
                error={errors.lastName}
              />
              
              <AuthInput
                label="เลขประจำตัวประชาชน*"
                value={idNumber}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text)) {
                    setIdNumber(text);
                  }
                }}
                placeholder="เลขประจำตัวประชาชน"
                keyboardType="numeric"
                maxLength={13}
                error={errors.idNumber}
              />
              
              {/* วันเกิด */}
              <View style={tw`mb-4`}>
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.M,
                  ...tw`text-gray-700 mb-1`,
                }}>
                  วันเกิด*
                </Text>
                
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center border-2 rounded-lg p-3`,
                    errors.birthDate ? tw`border-red-500` : tw`border-gray-300`,
                  ]}
                  onPress={() => showDatePickerDialog('birthDate')}
                >
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    flex: 1,
                    ...tw`text-gray-800`,
                  }}>
                    {birthDate || 'กดเพื่อเลือกวันเกิด'}
                  </Text>
                  <Icon name="calendar" size={24} color={COLORS.GRAY_500} />
                </TouchableOpacity>
                
                {errors.birthDate && (
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    fontSize: FONTS.SIZE.S,
                    ...tw`text-red-500 mt-1`,
                  }}>
                    {errors.birthDate.message}
                  </Text>
                )}
              </View>
              
              {/* วันหมดอายุใบขับขี่ */}
              <View style={tw`mb-4`}>
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.M,
                  ...tw`text-gray-700 mb-1`,
                }}>
                  วันที่หมดอายุใบขับขี่*
                </Text>
                
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center border-2 rounded-lg p-3`,
                    errors.idExpiryDate ? tw`border-red-500` : tw`border-gray-300`,
                  ]}
                  onPress={() => showDatePickerDialog('idExpiryDate')}
                >
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    flex: 1,
                    ...tw`text-gray-800`,
                  }}>
                    {idExpiryDate || 'กดเพื่อเลือกวันหมดอายุ'}
                  </Text>
                  <Icon name="calendar" size={24} color={COLORS.GRAY_500} />
                </TouchableOpacity>
                
                {errors.idExpiryDate && (
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    fontSize: FONTS.SIZE.S,
                    ...tw`text-red-500 mt-1`,
                  }}>
                    {errors.idExpiryDate.message}
                  </Text>
                )}
              </View>
            </View>
          </Animatable.View>
          
          <Animatable.View animation="fadeInUp" duration={600} delay={400}>
            <View style={tw`mb-12`}>
              <View style={{
                ...tw`border-l-4 border-[${COLORS.PRIMARY}] pl-3 mb-6`,
              }}>
                <Text style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  fontSize: FONTS.SIZE.L,
                  ...tw`text-gray-800`,
                }}>
                  ข้อมูลยานพาหนะ
                </Text>
              </View>
              
              <AuthInput
                label="ป้ายทะเบียนรถ*"
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="ป้ายทะเบียนรถ (เช่น กข 1234)"
                error={errors.licensePlate}
                maxLength={7}
              />
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Date Picker for birthDate */}
      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()} // ไม่ให้เลือกวันที่ในอนาคต
        />
      )}
      
      {/* Date Picker for idExpiryDate */}
      {showExpiryDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()} // ไม่ให้เลือกวันที่ในอดีต
        />
      )}
      
      <View style={tw`p-4 bg-white border-t border-gray-200`}>
        <AuthButton
          title="ถัดไป"
          onPress={handleNext}
          isLoading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegisterPersonalInfoScreen;