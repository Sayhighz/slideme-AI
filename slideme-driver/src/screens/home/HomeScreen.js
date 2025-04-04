import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  TouchableOpacity, 
  Text, 
  Alert 
} from 'react-native';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';

// Import Components
import HomeHeader from '../../components/home/HomeHeader';
import ProfitDisplay from '../../components/home/ProfitDisplay';
import OffersList from '../../components/home/OffersList';
import AdBanner from '../../components/home/AdBanner'; 

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userData = {} } = route.params || {};

  // Notice array for ad banners 
  const notices = [
    { id: 1, image: 'ads1.png' },
    { id: 2, image: 'ads2.png' },
    { id: 3, image: 'ads3.png' },
  ];

  const handleJobSearch = () => {
    if (userData?.driver_id) {
      navigation.navigate('JobsScreen', { driver_id: userData.driver_id });
    } else {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header Component */}
      <HomeHeader userData={userData} />

      {/* Profit Display Component */}
      <ProfitDisplay driverId={userData?.driver_id} />

      {/* Offers List Component */}
      <OffersList 
        driverId={userData?.driver_id} 
        navigation={navigation} 
      />

      {/* Ad Banner Component */}
      <AdBanner ads={notices} />

      {/* Job Search Button */}
      <View style={tw`absolute bottom-4 w-full items-center`}>
        <TouchableOpacity
          style={tw`w-11/12 bg-[#60B876] rounded p-2 items-center`}
          onPress={handleJobSearch}
        >
          <Text style={[{ fontFamily: 'Mitr-Regular' }, tw`text-white text-lg`]}>
            ค้นหางาน
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;