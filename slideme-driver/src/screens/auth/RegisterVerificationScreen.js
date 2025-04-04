import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';

// Import services and constants
import { FONTS, COLORS } from '../../constants';

const RegisterVerificationScreen = ({ navigation, route }) => {
  const routeParams = route.params || {};
  
  // Initial verification items with 'processing' status
  const initialItems = [
    { id: 1, label: 'กำลังตรวจสอบข้อมูลเพิ่มเติม', status: 'processing' },
    { id: 2, label: 'กำลังตรวจสอบข้อมูลยานพาหนะ', status: 'processing' },
    { id: 3, label: 'กำลังตรวจสอบข้อมูลส่วนตัว', status: 'processing' },
    { id: 4, label: 'อนุมัติการอบรม', status: 'pending' },
    { id: 5, label: 'อนุมัติรูปใบขับขี่', status: 'pending' },
  ];

  const [verificationItems, setVerificationItems] = useState(initialItems);
  const [allVerified, setAllVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate verification process
  useEffect(() => {
    // First batch of verifications after 2 seconds
    const firstTimer = setTimeout(() => {
      setVerificationItems(prev => 
        prev.map((item, index) => index <= 2 
          ? { ...item, status: 'completed' } 
          : item
        )
      );
      
      // Second batch after 4 seconds
      const secondTimer = setTimeout(() => {
        setVerificationItems(prev =>
          prev.map(item => ({ ...item, status: 'completed' }))
        );
        setAllVerified(true);
      }, 2000);
      
      return () => clearTimeout(secondTimer);
    }, 2000);
    
    return () => clearTimeout(firstTimer);
  }, []);

  const handleNext = () => {
    if (!allVerified) return;
    
    setIsLoading(true);
    
    try {
      navigation.navigate('RegisterPassword', routeParams);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />;
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
        title="การตรวจสอบ"
        showBackButton={false}
      />
      
      <ScrollView
        contentContainerStyle={tw`p-6`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`items-center mb-6`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 text-center mb-2`,
          }}>
            ขอบคุณสำหรับการลงทะเบียน
          </Text>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw`text-gray-500 text-center`,
          }}>
            กำลังตรวจสอบข้อมูลของคุณ โปรดรอสักครู่
          </Text>
          
          <View style={tw`w-full mt-8 mb-2`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-800`,
              }}>
                สถานะการตรวจสอบ
              </Text>
              
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-[${COLORS.PRIMARY}]`,
              }}>
                {allVerified ? '100%' : 'กำลังดำเนินการ'}
              </Text>
            </View>
            
            <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
              <View 
                style={{
                  ...tw`h-full bg-[${COLORS.PRIMARY}]`,
                  width: allVerified ? '100%' : '60%',
                  transition: 'width 1s ease',
                }}
              />
            </View>
          </View>
        </View>
        
        {/* Verification Items */}
        {verificationItems.map((item) => (
          <View 
            key={item.id}
            style={tw`flex-row items-center justify-between p-4 mb-4 bg-white rounded-lg shadow border border-gray-100`}
          >
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.M,
              ...tw`text-gray-800 flex-1`,
            }}>
              {item.label}
            </Text>
            
            {getStatusIcon(item.status)}
          </View>
        ))}
        
        <View style={tw`h-20`} />
      </ScrollView>
      
      <View style={tw`p-4 bg-white shadow-lg`}>
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