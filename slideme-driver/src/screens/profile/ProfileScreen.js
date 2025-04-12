import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Animated,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../../services/auth';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';

// Import Components
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileMenuItem from '../../components/profile/ProfileMenuItem';
import DriverStatsCard from '../../components/profile/DriverStatsCard';
import LogoutConfirmation from '../../components/profile/LogoutConfirmation';

export default function ProfileScreen({ navigation, userData, onLogout }) {
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [userStatus, setUserStatus] = useState('available'); // available, busy, offline
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Define a fixed number of menu items
  const MENU_ITEMS_COUNT = 6;
  
  // Create animation values for menu items with a specific count
  const menuItemsAnim = useRef(
    Array.from({ length: MENU_ITEMS_COUNT }, () => new Animated.Value(0))
  ).current;
  
  useFocusEffect(
    React.useCallback(() => {
      // Animate screen elements when screen comes into focus
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        ...menuItemsAnim.map((anim, i) => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: 300 + (i * 100),
            useNativeDriver: true,
          })
        )
      ]).start();
      
      // Fetch user status
      fetchUserStatus();
      
      return () => {
        // Reset animations when screen loses focus
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        menuItemsAnim.forEach(anim => anim.setValue(0));
      };
    }, [userData?.driver_id])
  );
  
  // Fetch user's current status (available, busy, offline)
  const fetchUserStatus = async () => {
    if (!userData?.driver_id) return;
    
    try {
      const response = await getRequest(`${API_ENDPOINTS.DRIVER.PROFILE.GET}/${userData.driver_id}`);
      if (response.Status) {
        setUserStatus(response.driver_status || 'available');
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserStatus();
    setRefreshing(false);
  };

  // Handle Profile Edit Navigation
  const handleEditProfile = () => {
    navigation.navigate('EditInfo', { userData });
  };

  // Handle Personal Info Navigation
  const handlePersonalInfo = () => {
    navigation.navigate('PersonalInfo', { userData });
  };
  
  // Handle Reviews Navigation
  const handleReviews = () => {
    navigation.navigate('Reviews', { userData });
  };
  
  // Handle Help Action
  const handleHelp = () => {
    Alert.alert(
      'ช่วยเหลือ',
      'คุณสามารถติดต่อทีมงานได้ที่หมายเลข 02-xxx-xxxx หรืออีเมล support@slideme.co.th',
      [{ text: 'ตกลง' }]
    );
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
  
  // Make sure index is valid before using it
  const getAnimatedValue = (index) => {
    // Ensure we don't access out of bounds
    if (index >= 0 && index < menuItemsAnim.length) {
      return menuItemsAnim[index];
    }
    // Return a default animated value if index is invalid
    return new Animated.Value(1);
  };
  
  // Animated menu item
  const AnimatedMenuItem = ({ icon, label, onPress, index, isWarning = false, isLast = false }) => {
    // Get the proper animated value with safety check
    const animValue = getAnimatedValue(index);
    
    return (
      <Animated.View
        style={{
          opacity: animValue,
          transform: [
            { 
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }) 
            }
          ]
        }}
      >
        <ProfileMenuItem
          iconName={icon}
          label={label}
          onPress={onPress}
          isWarning={isWarning}
          isLast={isLast}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Profile Header Component */}
          <ProfileHeader 
            userData={userData} 
            onEditPress={handleEditProfile} 
          />
          
          {/* Driver Status Indicator */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>สถานะการทำงาน:</Text>
            <View style={[
              styles.statusBadge,
              userStatus === 'available' && styles.statusAvailable,
              userStatus === 'busy' && styles.statusBusy,
              userStatus === 'offline' && styles.statusOffline,
            ]}>
              <View style={[
                styles.statusDot,
                userStatus === 'available' && styles.dotAvailable,
                userStatus === 'busy' && styles.dotBusy,
                userStatus === 'offline' && styles.dotOffline,
              ]} />
              <Text style={styles.statusText}>
                {userStatus === 'available' && 'พร้อมรับงาน'}
                {userStatus === 'busy' && 'กำลังทำงาน'}
                {userStatus === 'offline' && 'ไม่พร้อมรับงาน'}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Driver Statistics Card */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 16,
            marginTop: 8,
          }}
        >
          <DriverStatsCard driverId={userData?.driver_id} />
        </Animated.View>
        

        {/* Menu Items Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>การตั้งค่าบัญชี</Text>

          <AnimatedMenuItem
            icon="account-details"
            label="ข้อมูลส่วนตัว"
            onPress={handlePersonalInfo}
            index={0}
          />
          
          <AnimatedMenuItem
            icon="pencil"
            label="แก้ไขข้อมูล"
            onPress={handleEditProfile}
            index={1}
          />

          <AnimatedMenuItem
            icon="file-document"
            label="ประวัติการทำงาน"
            onPress={() => navigation.navigate('History')}
            index={3}
          />
          
          <AnimatedMenuItem
            icon="help-circle"
            label="ช่วยเหลือ"
            onPress={handleHelp}
            index={4}
          />
          
          <AnimatedMenuItem
            icon="logout"
            label="ออกจากระบบ"
            onPress={() => setLogoutModalVisible(true)}
            isWarning={true}
            isLast={true}
            index={5}
          />
        </View>
        
        {/* App Version */}
        <Text style={styles.versionText}>SlideMe Driver v1.0.0</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  statusAvailable: {
    backgroundColor: `${COLORS.SUCCESS}10`,
  },
  statusBusy: {
    backgroundColor: `${COLORS.WARNING}10`,
  },
  statusOffline: {
    backgroundColor: `${COLORS.GRAY_400}10`,
  },
  dotAvailable: {
    backgroundColor: COLORS.SUCCESS,
  },
  dotBusy: {
    backgroundColor: COLORS.WARNING,
  },
  dotOffline: {
    backgroundColor: COLORS.GRAY_600,
  },
  reviewsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  menuContainer: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
    color: COLORS.TEXT_PRIMARY,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.GRAY_500,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginTop: 24,
    marginBottom: 24,
  },
});