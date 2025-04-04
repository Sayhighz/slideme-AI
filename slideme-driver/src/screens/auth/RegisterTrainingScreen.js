import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import tw from 'twrnc';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

// Import services and constants
import { FONTS, COLORS, MESSAGES } from '../../constants';

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
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      newErrors.birthDate = { message: 'รูปแบบวันเกิดไม่ถูกต้อง (YYYY-MM-DD)' };
    }
    
    if (!idExpiryDate) {
      newErrors.idExpiryDate = { message: 'กรุณากรอกวันหมดอายุใบขับขี่' };
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(idExpiryDate)) {
      newErrors.idExpiryDate = { message: 'รูปแบบวันหมดอายุไม่ถูกต้อง (YYYY-MM-DD)' };
    }
    
    if (!licensePlate) {
      newErrors.licensePlate = { message: 'กรุณากรอกทะเบียนรถ' };
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

  const handleNext = () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      navigation.navigate('RegisterTraining', {
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
        title="ขั้นตอนที่ 1"
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
          <View style={tw`mb-6`}>
            <View style={{
              ...tw`border-l-4 border-[${COLORS.PRIMARY}] pl-3 mb-6`,
            }}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.XL,
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
            
            <AuthInput
              label="วันเกิด (YYYY-MM-DD)*"
              value={birthDate}
              onChangeText={(value) => setBirthDate(enforceDateFormat(value))}
              placeholder="วันเกิด (YYYY-MM-DD)"
              maxLength={10}
              error={errors.birthDate}
            />
            
            <AuthInput
              label="วันที่หมดอายุใบขับขี่ (YYYY-MM-DD)*"
              value={idExpiryDate}
              onChangeText={(value) => setIdExpiryDate(enforceDateFormat(value))}
              placeholder="วันที่หมดอายุใบขับขี่ (YYYY-MM-DD)"
              maxLength={10}
              error={errors.idExpiryDate}
            />
          </View>
          
          <View style={tw`mb-12`}>
            <View style={{
              ...tw`border-l-4 border-[${COLORS.PRIMARY}] pl-3 mb-6`,
            }}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.XL,
                ...tw`text-gray-800`,
              }}>
                ข้อมูลยานพาหนะ
              </Text>
            </View>
            
            <AuthInput
              label="ป้ายทะเบียนรถ*"
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="ป้ายทะเบียนรถ"
              error={errors.licensePlate}
              maxLength={7}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={tw`p-4 bg-white shadow-lg`}>
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