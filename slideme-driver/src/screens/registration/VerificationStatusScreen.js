// src/screens/registration/VerificationStatusScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Linking
} from 'react-native';
import tw from 'twrnc';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';

// Import services and constants
import { FONTS, COLORS, MESSAGES } from '../../constants';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';
import { login } from '../../services/auth';

const VerificationStatusScreen = ({ navigation, route }) => {
  const { driverId, phoneNumber, name, password } = route.params || {};
  
  const [status, setStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  
  // ตรวจสอบสถานะการลงทะเบียน
  const checkRegistrationStatus = async () => {
    if (!phoneNumber) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลเบอร์โทรศัพท์');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await getRequest(
        `${API_ENDPOINTS.AUTH.CHECK_STATUS}?phone_number=${phoneNumber}`
      );
      
      console.log('Status Response:', response);
      
      if (response.Status) {
        setStatus(response.approval_status || 'pending');
        
        // ถ้าสถานะเป็น approved ให้ไปหน้าสร้างรหัสผ่าน
        if (response.approval_status === 'approved') {
          Alert.alert(
            'ได้รับการอนุมัติแล้ว!',
            'การสมัครของคุณได้รับการอนุมัติแล้ว คุณสามารถเริ่มใช้งานได้ทันที'
          );
          console.log(phoneNumber, password)
          login(phoneNumber, password);
          if (__DEV__) {
            const DevSettings = require('react-native').DevSettings;
            DevSettings.reload();
          }
        }
      } else {
        Alert.alert(
          'ไม่พบข้อมูลการลงทะเบียน',
          'ไม่พบข้อมูลการลงทะเบียนของคุณ กรุณาลองลงทะเบียนใหม่'
        );
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถตรวจสอบสถานะได้ในขณะนี้ กรุณาลองอีกครั้งในภายหลัง'
      );
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };
  
  // ตรวจสอบสถานะเมื่อเปิดหน้าจอ
  useEffect(() => {
    checkRegistrationStatus();
    
    // ตรวจสอบสถานะทุก 5 นาที
    const interval = setInterval(() => {
      checkRegistrationStatus();
    }, 5 * 60 * 1000); // 5 นาที
    
    return () => clearInterval(interval);
  }, []);
  
  // ลิงก์ไปยังข้อมูลติดต่อ
  const contactSupport = () => {
    Alert.alert(
      'ติดต่อฝ่ายสนับสนุน',
      'คุณต้องการติดต่อฝ่ายสนับสนุนผ่านช่องทางใด?',
      [
        {
          text: 'โทร',
          onPress: () => Linking.openURL('tel:+6623456789')
        },
        {
          text: 'อีเมล',
          onPress: () => Linking.openURL('mailto:support@slideme.co.th')
        },
        {
          text: 'ยกเลิก',
          style: 'cancel'
        }
      ]
    );
  };
  
  // ไปยังหน้าสร้างรหัสผ่าน (กรณีได้รับการอนุมัติแล้ว)
  
  // ออกจากการลงทะเบียนกลับไปหน้าล็อกอิน
  const exitRegistration = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };
  
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="สถานะการตรวจสอบ"
        showBackButton={false}
      />
      
      <ScrollView contentContainerStyle={tw`p-6 pb-16`}>
        <Animatable.View animation="fadeIn" duration={800}>
          <View style={tw`items-center mb-8`}>
            <Image 
              source={require('../../assets/verification.png')}
              style={tw`w-40 h-40 mb-4`}
              resizeMode="contain"
            />
            
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              fontSize: FONTS.SIZE.XL,
              ...tw`text-gray-800 text-center mb-2`,
            }}>
              {status === 'approved' 
                ? 'ได้รับการอนุมัติแล้ว!' 
                : status === 'rejected'
                ? 'การลงทะเบียนถูกปฏิเสธ'
                : 'รอการตรวจสอบและอนุมัติ'}
            </Text>
            
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.M,
              ...tw`text-gray-600 text-center mb-4`,
            }}>
              {status === 'rejected' 
                ? 'การลงทะเบียนถูกปฏิเสธ กรุณาติดต่อฝ่ายสนับสนุน' 
                : 'ขอบคุณสำหรับการลงทะเบียน เราจะตรวจสอบข้อมูลของคุณและแจ้งผลให้ทราบ'}
            </Text>
            
            {status === 'pending' && (
              <View style={tw`flex-row items-center bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6`}>
                <Icon name="information" size={24} color="#f59e0b" style={tw`mr-3`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`text-amber-800 flex-1`,
                }}>
                  การตรวจสอบอาจใช้เวลา 1-2 วันทำการ คุณสามารถตรวจสอบสถานะได้โดยใช้เบอร์โทรศัพท์ที่ลงทะเบียนไว้
                </Text>
              </View>
            )}
            
            {status === 'rejected' && (
              <View style={tw`flex-row items-center bg-red-50 p-4 rounded-lg border border-red-200 mb-6`}>
                <Icon name="alert-circle" size={24} color="#ef4444" style={tw`mr-3`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`text-red-800 flex-1`,
                }}>
                  การลงทะเบียนของคุณถูกปฏิเสธ กรุณาติดต่อฝ่ายสนับสนุนเพื่อสอบถามเหตุผลและข้อมูลเพิ่มเติม
                </Text>
              </View>
            )}
            
            {status === 'approved' && (
              <View style={tw`flex-row items-center bg-green-50 p-4 rounded-lg border border-green-200 mb-6`}>
                <Icon name="check-circle" size={24} color="#22c55e" style={tw`mr-3`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  fontSize: FONTS.SIZE.S,
                  ...tw`text-green-800 flex-1`,
                }}>
                  การลงทะเบียนของคุณได้รับการอนุมัติแล้ว คุณสามารถสร้างรหัสผ่านและเริ่มใช้งานได้ทันที
                </Text>
              </View>
            )}
          </View>
        </Animatable.View>
        
        <Animatable.View animation="fadeInUp" duration={800} delay={400}>
          <View style={tw`bg-white rounded-lg border border-gray-200 p-6 mb-6`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              fontSize: FONTS.SIZE.M,
              ...tw`text-gray-800 mb-4`,
            }}>
              ข้อมูลการลงทะเบียน
            </Text>
            
            <View style={tw`flex-row mb-3`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-600 w-1/3`,
              }}>
                เบอร์โทรศัพท์:
              </Text>
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                ...tw`text-gray-800 flex-1`,
              }}>
                {phoneNumber}
              </Text>
            </View>
            
            <View style={tw`flex-row mb-3`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-600 w-1/3`,
              }}>
                ชื่อ-นามสกุล:
              </Text>
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                ...tw`text-gray-800 flex-1`,
              }}>
                {name || 'ไม่ระบุ'}
              </Text>
            </View>
            
            <View style={tw`flex-row mb-3`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-600 w-1/3`,
              }}>
                รหัสผู้ขับรถ:
              </Text>
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                ...tw`text-gray-800 flex-1`,
              }}>
                {driverId || 'ไม่ระบุ'}
              </Text>
            </View>
            
            <View style={tw`flex-row`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-600 w-1/3`,
              }}>
                สถานะ:
              </Text>
              <View style={tw`flex-row items-center`}>
                <View style={[
                  tw`w-3 h-3 rounded-full mr-2`,
                  status === 'approved' ? tw`bg-green-500` : 
                  status === 'rejected' ? tw`bg-red-500` : 
                  tw`bg-amber-500`
                ]} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  ...tw`text-gray-800`,
                }}>
                  {status === 'approved' ? 'อนุมัติแล้ว' : 
                   status === 'rejected' ? 'ถูกปฏิเสธ' : 
                   'รอการตรวจสอบ'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={tw`mb-8`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.XS,
              ...tw`text-gray-500 mb-2`,
            }}>
              อัปเดตล่าสุด: {lastChecked ? lastChecked.toLocaleString('th-TH') : 'กำลังโหลด...'}
            </Text>
            
            <TouchableOpacity
              style={tw`flex-row items-center justify-center`}
              onPress={checkRegistrationStatus}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} style={tw`mr-2`} />
              ) : (
                <Icon name="refresh" size={16} color={COLORS.PRIMARY} style={tw`mr-2`} />
              )}
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.S,
                color: COLORS.PRIMARY,
              }}>
                {isLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะล่าสุด'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>
      
      <View style={tw`px-4 py-4 bg-white border-t border-gray-200`}>
        {status === 'approved' ? (
          <View style={tw`flex-row`}>
            <AuthButton
              title="กลับหน้าแรก"
              onPress={exitRegistration}
              secondary
              style="flex-1"
            />
          </View>
        ) : status === 'rejected' ? (
          <View style={tw`flex-row`}>
            <AuthButton
              title="ติดต่อเจ้าหน้าที่"
              onPress={contactSupport}
              style="mr-2 flex-1"
            />
          </View>
        ) : (
          <View style={tw`flex-row`}>
            <AuthButton
              title="ตรวจสอบสถานะ"
              onPress={checkRegistrationStatus}
              isLoading={isLoading}
              style="mr-2 flex-1"
            />
            <AuthButton
              title="กลับหน้าแรก"
              onPress={exitRegistration}
              secondary
              style="ml-2 flex-1"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default VerificationStatusScreen;