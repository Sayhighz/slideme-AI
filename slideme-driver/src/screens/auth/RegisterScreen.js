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
import RNPickerSelect from 'react-native-picker-select';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthLogo from '../../components/auth/AuthLogo';

// Import services and constants
import { postRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES, PROVINCES, VEHICLE_TYPES } from '../../constants';

const RegisterScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [isAcceptTerms, setIsAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleNext = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const phoneExists = await checkPhoneNumberExists();
      
      if (phoneExists) {
        setErrors({ phoneNumber: { message: 'เบอร์โทรนี้ถูกใช้ไปแล้ว' } });
        return;
      }
      
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

  const renderPickerSelect = (placeholder, items, value, onChange, error) => (
    <View style={tw`mb-4`}>
      <Text 
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.M,
          ...tw`text-gray-700 mb-1`,
        }}
      >
        {placeholder}
      </Text>
      <View 
        style={{
          ...tw`border-2 border-gray-300 rounded-lg ${error ? 'border-red-500' : ''}`,
        }}
      >
        <RNPickerSelect
          placeholder={{ label: placeholder, value: null }}
          items={items}
          onValueChange={onChange}
          value={value}
          style={{
            inputIOS: {
              fontFamily: FONTS.FAMILY.REGULAR,
              padding: 12,
            },
            inputAndroid: {
              fontFamily: FONTS.FAMILY.REGULAR,
              padding: 12,
            },
          }}
        />
      </View>
      {error && (
        <Text 
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.S,
            ...tw`text-red-500 mt-1`,
          }}
        >
          {error.message}
        </Text>
      )}
    </View>
  );

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
          <AuthLogo tagline="สมัครเป็นคนขับ" style="mb-6" />
          
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
          
          {renderPickerSelect(
            'เลือกจังหวัด',
            PROVINCES,
            selectedProvince,
            setSelectedProvince,
            errors.province
          )}
          
          {renderPickerSelect(
            'เลือกประเภทรถ',
            VEHICLE_TYPES,
            selectedVehicleType,
            setSelectedVehicleType,
            errors.vehicleType
          )}
          
          <TouchableOpacity
            style={tw`flex-row items-center mb-6`}
            onPress={() => setIsAcceptTerms(!isAcceptTerms)}
          >
            <View
              style={tw`w-6 h-6 border-2 border-gray-300 rounded mr-2 ${
                isAcceptTerms ? `bg-[${COLORS.PRIMARY}]` : 'bg-white'
              }`}
            />
            <Text
              style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-700`,
              }}
            >
              ยอมรับเงื่อนไข SLIDEME
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;