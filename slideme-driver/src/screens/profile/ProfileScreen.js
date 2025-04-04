import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import { useFocusEffect } from '@react-navigation/native';
import { logout } from '../../services/auth';
import { FONTS, COLORS } from '../../constants';

// Import Components
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileMenuItem from '../../components/profile/ProfileMenuItem';
import DriverStatsCard from '../../components/profile/DriverStatsCard';
import LogoutConfirmation from '../../components/profile/LogoutConfirmation';

export default function ProfileScreen({ navigation, userData, onLogout }) {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Handle Profile Edit Navigation
  const handleEditProfile = () => {
    navigation.navigate('EditInfo', { userData });
  };

  // Handle Personal Info Navigation
  const handlePersonalInfo = () => {
    navigation.navigate('PersonalInfo', { userData });
  };

  // Handle Logout Process
  const handleLogout = async () => {
    setLogoutModalVisible(false);
    // Execute the logout process
    const logoutSuccess = await logout();
    
    if (logoutSuccess && typeof onLogout === 'function') {
      onLogout();
    }
  };

  return (
    <SafeAreaView
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header Component */}
        <ProfileHeader 
          userData={userData} 
          onEditPress={handleEditProfile} 
        />

        {/* Driver Statistics Card */}
        <View style={tw`px-4`}>
          <DriverStatsCard driverId={userData?.driver_id} />
        </View>

        {/* Menu Items Section */}
        <View style={tw`mt-4 bg-white`}>
          <Text 
            style={[
              tw`px-4 pt-2 pb-1 text-gray-500`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            การตั้งค่าบัญชี
          </Text>

          <ProfileMenuItem
            iconName="account-details"
            label="ข้อมูลส่วนตัว"
            onPress={handlePersonalInfo}
          />
          
          <ProfileMenuItem
            iconName="pencil"
            label="แก้ไขข้อมูล"
            onPress={handleEditProfile}
          />

          <ProfileMenuItem
            iconName="file-document"
            label="ประวัติการทำงาน"
            onPress={() => navigation.navigate('History')}
          />
          

          <ProfileMenuItem
            iconName="help-circle"
            label="ช่วยเหลือ"
            onPress={() => {
              // This would navigate to help/support screen
              // For now, just show an alert
              Alert.alert('ช่วยเหลือ', 'คุณสามารถติดต่อทีมงานได้ที่หมายเลข 02-xxx-xxxx');
            }}
          />
        </View>

        {/* Other Options Section */}
        <View style={tw`mt-4 bg-white`}>
          {/* <Text 
            style={[
              tw`px-4 pt-2 pb-1 text-gray-500`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            อื่นๆ
          </Text> */}
          
          <ProfileMenuItem
            iconName="logout"
            label="ออกจากระบบ"
            onPress={() => setLogoutModalVisible(true)}
            isWarning={true}
            isLast={true}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        visible={logoutModalVisible}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}