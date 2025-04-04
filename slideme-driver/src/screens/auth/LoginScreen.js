import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthLogo from '../../components/auth/AuthLogo';

// Import services and constants
import { login } from '../../services/auth';
import { FONTS, COLORS, MESSAGES } from '../../constants';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!phoneNumber) {
      newErrors.phoneNumber = { message: 'กรุณากรอกเบอร์โทรศัพท์' };
    } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = { message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' };
    }
    
    if (!password) {
      newErrors.password = { message: 'กรุณากรอกรหัสผ่าน' };
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await login(phoneNumber, password);
      
      if (response.status && response.token) {
        Alert.alert('สำเร็จ', MESSAGES.SUCCESS.LOGIN);
      } else {
        setErrors({ login: { message: response.Error || MESSAGES.ERRORS.LOGIN } });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ login: { message: MESSAGES.ERRORS.CONNECTION } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={tw`flex-grow p-4`}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tw`flex-1 justify-center items-center`}>
            <AuthLogo tagline="Drive & Earn" />

            {errors.login && (
              <Text 
                style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-red-500 mt-4 text-center`
                }}
              >
                {errors.login.message}
              </Text>
            )}
          </View>

          <View style={tw`w-full mt-6`}>
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

            <TouchableOpacity 
              onPress={() => Alert.alert('แจ้งเตือน', 'กรุณาติดต่อผู้ดูแลระบบ')}
              style={tw`mb-6`}
            >
              <Text 
                style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-gray-600 text-right`
                }}
              >
                ลืมรหัสผ่าน
              </Text>
            </TouchableOpacity>

            <AuthButton
              title="เข้าสู่ระบบ"
              onPress={handleLogin}
              isLoading={isLoading}
            />

            <AuthButton
              title="ลงทะเบียน"
              onPress={() => navigation.navigate('Register')}
              secondary
              style="mt-3"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;