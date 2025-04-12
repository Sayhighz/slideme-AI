import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl, 
  StatusBar, 
  Platform,
  Alert,
  ToastAndroid
} from 'react-native';
import tw from 'twrnc';
import { useFocusEffect } from '@react-navigation/native';

// Components
import DriverProfile from '../../components/home/DriverProfile';
import OffersSection from '../../components/home/OffersSection';
import PromotionBanner from '../../components/home/PromotionBanner';
import FindJobButton from '../../components/home/FindJobButton';

// Services
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

// Hooks
import { useTodayProfit, useDriverScore } from '../../utils/hooks';
import { MESSAGES } from '../../constants';

const HomeScreen = ({ navigation, route }) => {
  const { userData } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Using custom hooks
  const { profitToday, loading: profitLoading } = useTodayProfit(userData?.driver_id);
  const { driverScore, loading: scoreLoading } = useDriverScore(userData?.driver_id);

  // ฟังก์ชันแสดงข้อความแจ้งเตือน (สำหรับ Android)
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  // Fetch pending offers
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${API_ENDPOINTS.JOBS.GET_OFFERS}?driver_id=${userData?.driver_id}&status=pending`);
      
      if (response && response.Status) {
        setOfferData(response); // เก็บข้อมูลทั้งหมดจาก API
      } else {
        // กรณีมี response แต่ Status ไม่เป็น true
        setOfferData(null);
        console.error('Error fetching offers:', response?.Message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOfferData(null);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.CONNECTION);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userData?.driver_id) {
        fetchOffers();
      }
    }, [userData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  // Navigate to JobDetail
  const handleOfferPress = (offer) => {
    navigation.navigate('JobDetail', { 
      offer, 
      userData,
      fromScreen: 'Home'
    });
  };

  // ฟังก์ชันหลังจากยกเลิกข้อเสนอ
  const handleOfferCancel = async (offerId) => {
    // ดึงข้อมูลใหม่หลังจากยกเลิกข้อเสนอ
    await fetchOffers();
    
    // แสดงข้อความแจ้งเตือน
    if (Platform.OS === 'ios') {
      Alert.alert("สำเร็จ", "ยกเลิกข้อเสนอเรียบร้อยแล้ว");
    } else {
      showToast("ยกเลิกข้อเสนอเรียบร้อยแล้ว");
    }
  };

  // Navigate to JobsScreen
  const handleFindJobPress = () => {
    navigation.navigate('JobsScreen', { userData });
  };

  // ตรวจสอบว่าควรปิดปุ่มค้นหางานหรือไม่
  const pendingOffersCount = offerData?.Count || 0;
  const disableFindJob = pendingOffersCount >= 3;

  // ข้อความแสดงเมื่อปุ่มค้นหางานถูกปิด
  const findJobDisabledMessage = "คุณมีข้อเสนอที่รอการตอบรับมากกว่า 3 รายการ กรุณาจัดการข้อเสนอที่มีอยู่ก่อน";

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar 
        backgroundColor="#FFFFFF" 
        barStyle="dark-content" 
        translucent={Platform.OS === 'android'}
      />
      
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#60B876']} 
            tintColor="#60B876"
          />
        }
      >
        {/* Driver Profile Section */}
        <DriverProfile 
          userData={userData} 
          driverScore={driverScore} 
          profitToday={profitToday}
          isLoading={profitLoading || scoreLoading}
          onProfilePress={() => navigation.navigate('ProfileTab')}
        />
        
        {/* Promotion Banner */}
        <PromotionBanner />
        
        {/* Pending Offers Section */}
        <OffersSection 
          offers={offerData} 
          isLoading={loading} 
          onOfferPress={handleOfferPress}
          onOfferCancel={handleOfferCancel}
          userData={userData} // ส่ง userData เพื่อใช้ในการยกเลิกข้อเสนอ
          maxVisible={2} // แสดงแค่ 2 รายการ
        />
        
        {/* Spacing at the bottom */}
        <View style={tw`h-24`} />
      </ScrollView>
      
      {/* Find Job Button (Fixed at bottom) */}
      <FindJobButton 
        onPress={handleFindJobPress} 
        disabled={disableFindJob} 
        disabledMessage={findJobDisabledMessage}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;