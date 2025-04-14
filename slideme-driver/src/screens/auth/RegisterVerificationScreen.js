import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';
import RegistrationSteps from '../../components/auth/RegistrationSteps';

// Import services and constants
import { FONTS, COLORS } from '../../constants';
import { postRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

const RegisterVerificationScreen = ({ navigation, route }) => {
  const routeParams = route.params || {};
  
  // เก็บข้อมูลสถานะการตรวจสอบ
  const [verificationItems, setVerificationItems] = useState([
    { id: 1, label: 'ตรวจสอบข้อมูลส่วนตัว', status: 'processing' },
    { id: 2, label: 'ตรวจสอบข้อมูลยานพาหนะ', status: 'pending' },
    { id: 3, label: 'ตรวจสอบเอกสารสำคัญ', status: 'pending' },
    { id: 4, label: 'ยืนยันตัวตน', status: 'pending' },
  ]);
  
  const [allVerified, setAllVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // จำลองการตรวจสอบข้อมูล (ในระบบจริงจะต้องส่งข้อมูลไปยังเซิร์ฟเวอร์)
  useEffect(() => {
    // เริ่มด้วยการตรวจสอบข้อมูลส่วนตัว
    setTimeout(() => {
      setVerificationItems(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], status: 'completed' };
        updated[1] = { ...updated[1], status: 'processing' };
        return updated;
      });
      setProgress(25);
      
      // ตรวจสอบข้อมูลยานพาหนะ
      setTimeout(() => {
        setVerificationItems(prev => {
          const updated = [...prev];
          updated[1] = { ...updated[1], status: 'completed' };
          updated[2] = { ...updated[2], status: 'processing' };
          return updated;
        });
        setProgress(50);
        
        // ตรวจสอบเอกสารสำคัญ
        setTimeout(() => {
          setVerificationItems(prev => {
            const updated = [...prev];
            updated[2] = { ...updated[2], status: 'completed' };
            updated[3] = { ...updated[3], status: 'processing' };
            return updated;
          });
          setProgress(75);
          
          // ยืนยันตัวตน
          setTimeout(() => {
            setVerificationItems(prev => {
              const updated = [...prev];
              updated[3] = { ...updated[3], status: 'completed' };
              return updated;
            });
            setProgress(100);
            setAllVerified(true);
          }, 1200);
          
        }, 1500);
        
      }, 1800);
      
    }, 1000);
    
    // Cleanup function
    return () => {
      // ล้าง timeout ทั้งหมดเมื่อ component unmount
    };
  }, []);

  // ฟังก์ชันไปยังขั้นตอนถัดไป
  const handleNext = () => {
    if (!allVerified) return;
    
    setIsLoading(true);
    
    try {
      // นำทางไปยังหน้าตั้งรหัสผ่าน
      navigation.navigate('RegisterPassword', routeParams);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันแสดงไอคอนสถานะ
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Animatable.View animation="bounceIn" duration={800}>
            <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
          </Animatable.View>
        );
      case 'processing':
        return <ActivityIndicator size="small" color={COLORS.PRIMARY} />;
      case 'pending':
        return <Icon name="clock-outline" size={24} color="#999" />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="ตรวจสอบข้อมูล"
        showBackButton={false}
      />
      
      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps 
          currentStep={3} 
          totalSteps={4}
          stepTitles={['ข้อมูลเบื้องต้น', 'ข้อมูลส่วนตัว', 'ตรวจสอบข้อมูล', 'ตั้งรหัสผ่าน']}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={tw`p-6`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`items-center mb-6`}>
          <Animatable.Image 
            source={require('../../assets/verification.png')} 
            style={tw`w-32 h-32 mb-4`}
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
          />
          
          <Text style={{
            fontFamily: FONTS.FAMILY.MEDIUM,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 text-center mb-2`,
          }}>
            {allVerified ? 'ตรวจสอบข้อมูลเสร็จสิ้น' : 'กำลังตรวจสอบข้อมูล'}
          </Text>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw`text-gray-500 text-center`,
          }}>
            {allVerified 
              ? 'ข้อมูลของคุณได้รับการตรวจสอบเรียบร้อยแล้ว' 
              : 'ระบบกำลังตรวจสอบข้อมูลของคุณ โปรดรอสักครู่'}
          </Text>
          
          <View style={tw`w-full mt-8 mb-2`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-800`,
              }}>
                ความคืบหน้า
              </Text>
              
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                ...tw`text-[${COLORS.PRIMARY}]`,
              }}>
                {progress}%
              </Text>
            </View>
            
            <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
              <Animatable.View 
                style={{
                  ...tw`h-full bg-[${COLORS.PRIMARY}]`,
                  width: `${progress}%`,
                }}
                animation="fadeIn"
                duration={300}
              />
            </View>
          </View>
        </View>
        
        {/* Verification Items */}
        {verificationItems.map((item) => (
          <Animatable.View 
            key={item.id}
            style={tw`flex-row items-center justify-between p-4 mb-4 bg-white rounded-lg shadow border border-gray-100`}
            animation={item.status === 'completed' ? 'fadeIn' : ''}
            duration={500}
          >
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.M,
              ...tw`text-gray-800 flex-1`,
            }}>
              {item.label}
            </Text>
            
            {getStatusIcon(item.status)}
          </Animatable.View>
        ))}
        
        {allVerified && (
          <Animatable.View 
            style={tw`bg-green-50 p-4 rounded-lg border border-green-200 mt-6`}
            animation="fadeIn"
            duration={800}
          >
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              ...tw`text-green-800 mb-1 text-center`,
            }}>
              การตรวจสอบเสร็จสิ้น!
            </Text>
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              ...tw`text-green-700 text-center`,
            }}>
              คุณสามารถดำเนินการขั้นตอนต่อไปได้
            </Text>
          </Animatable.View>
        )}
        
        <View style={tw`h-20`} />
      </ScrollView>
      
      <View style={tw`p-4 bg-white border-t border-gray-200`}>
        <AuthButton
          title="ถัดไป"
          onPress={handleNext}
          isLoading={isLoading}
          disabled={!allVerified}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegisterVerificationScreen;