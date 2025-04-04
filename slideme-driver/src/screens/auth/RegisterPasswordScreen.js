import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

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
  const [errors, setErrors] = useState({});

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '', strength: 0 };
    
    // Check password criteria
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteria = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar];
    const metCriteria = criteria.filter(Boolean).length;
    
    // Calculate password strength
    if (metCriteria <= 2) {
      return { label: 'อ่อน', color: 'text-red-500', strength: 25 };
    } else if (metCriteria === 3) {
      return { label: 'ปานกลาง', color: 'text-yellow-500', strength: 50 };
    } else if (metCriteria === 4) {
      return { label: 'ดี', color: 'text-blue-500', strength: 75 };
    } else {
      return { label: 'ดีมาก', color: 'text-green-500', strength: 100 };
    }
  };

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
      // Prepare registration data from route params
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
      
      const response = await register(registrationData);
      
      if (response.Status) {
        Alert.alert(
          'ลงทะเบียนสำเร็จ',
          'บัญชีของคุณถูกสร้างขึ้นแล้ว ตอนนี้คุณสามารถเข้าสู่ระบบได้',
          [{ text: 'เข้าสู่ระบบ', onPress: () => navigation.navigate('Login') }]
        );
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

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="ตั้งรหัสผ่าน"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView 
        contentContainerStyle={tw`p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`mb-8`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 text-center mb-2`,
          }}>
            ยินดีด้วย!
          </Text>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw`text-gray-500 text-center`,
          }}>
            บัญชีของคุณได้รับการยืนยันแล้ว
          </Text>
        </View>
        
        <View style={tw`mb-6`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.L,
            ...tw`text-gray-800 mb-4`,
          }}>
            สร้างรหัสผ่าน
          </Text>
          
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
          {password && (
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between mb-1`}>
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`text-gray-500`,
                }}>
                  ความปลอดภัย
                </Text>
                
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`${passwordStrength.color}`,
                }}>
                  {passwordStrength.label}
                </Text>
              </View>
              
              <View style={tw`w-full h-1 bg-gray-200 rounded-full overflow-hidden`}>
                <View 
                  style={{
                    ...tw`h-full`,
                    backgroundColor: passwordStrength.strength >= 75 ? COLORS.PRIMARY : 
                                    passwordStrength.strength >= 50 ? '#3498db' :
                                    passwordStrength.strength >= 25 ? '#f1c40f' : '#e74c3c',
                    width: `${passwordStrength.strength}%`,
                  }}
                />
              </View>
              
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.XS,
                ...tw`text-gray-500 mt-1`,
              }}>
                รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข และอักขระพิเศษ
              </Text>
            </View>
          )}
          
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
      
      <View style={tw`p-4 bg-white shadow-lg`}>
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