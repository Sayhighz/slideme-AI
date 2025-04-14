import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
  Share
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';
import { IMAGE_URL } from '../../config';
import { formatDate } from '../../utils/formatters';
import { useDriverScore } from '../../utils/hooks';

// Import Components
import HeaderWithBackButton from '../../components/common/HeaderWithBackButton';

const AnimatedHeaderBackground = ({ scrollY }) => {
  const headerHeight = 250;
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View 
      style={[
        styles.headerBackground,
        { opacity: headerOpacity }
      ]}
    />
  );
};

const InfoItem = ({ label, value, icon }) => {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoLabel}>
        {icon && <Icon name={icon} size={20} color={COLORS.GRAY_600} style={styles.infoIcon} />}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>
        {value || 'ไม่พบข้อมูล'}
      </Text>
    </View>
  );
};

const PersonalInfoScreen = ({ navigation, route }) => {
  const { userData = {} } = route.params || {};
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { driverScore } = useDriverScore(userData?.driver_id);
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch user details
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userData?.driver_id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setLoading(false);
        return;
      }

      try {
        const response = await getRequest(`${API_ENDPOINTS.DRIVER.PROFILE.GET}/${userData.driver_id}`);
        
        if (response.Status) {
          const user = response;
          // Format dates if needed
          if (user.id_expiry_date) {
            user.id_expiry_date = formatDate(user.id_expiry_date);
          }
          if (user.birth_date) {
            user.birth_date = formatDate(user.birth_date);
          }
          setUserInfo(user);
          setError(null);
          
          // Animate in the content
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        } else {
          setError('ไม่พบข้อมูลผู้ใช้');
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userData?.driver_id]);


  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  // Show error message
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.DANGER} style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>กลับ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Profile image source
  const profileImage = userInfo?.profile_picture 
    ? { uri: `${IMAGE_URL}${userInfo.profile_picture}`, headers: { pragma: 'no-cache' } }
    : require('../../assets/images/default-avatar.png'); // Make sure to add this default image

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedHeaderBackground scrollY={scrollY} />
      <HeaderWithBackButton
        showBackButton={true}
        title="ข้อมูลส่วนตัว"
        onPress={() => navigation.goBack()}
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim }}
      >
        {/* Profile Header with Image */}
        <View style={styles.profileHeader}>
          <Image
            source={profileImage}
            style={styles.profileImage}
            defaultSource={require('../../assets/images/default-avatar.png')}
          />
          
          <Text style={styles.profileName}>
            {`${userInfo?.first_name || userData?.first_name || ''} ${userInfo?.last_name || userData?.last_name || ''}`}
          </Text>
          
          <View style={styles.ratingContainer}>
            <Icon name="star" size={20} color="#FFC107" />
            <Text style={styles.ratingText}>
              {driverScore ? driverScore : "0.0"}
            </Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="account-details" size={20} color={COLORS.PRIMARY} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
          </View>

          <View style={styles.infoCard}>
            <InfoItem 
              label="เบอร์โทรศัพท์" 
              value={userInfo?.phone_number || userData?.phone_number} 
              icon="phone"
            />
            
            {userInfo?.id_number && (
              <InfoItem 
                label="เลขบัตรประชาชน" 
                value={userInfo.id_number} 
                icon="card-account-details"
              />
            )}
            
            {userInfo?.birth_date && (
              <InfoItem 
                label="วันเกิด" 
                value={userInfo.birth_date} 
                icon="cake-variant"
              />
            )}
            
            {userInfo?.address && (
              <InfoItem 
                label="ที่อยู่" 
                value={userInfo.address} 
                icon="map-marker"
              />
            )}
          </View>
        </View>

        {/* Vehicle Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="car" size={20} color={COLORS.PRIMARY} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>ข้อมูลยานพาหนะ</Text>
          </View>

          <View style={styles.infoCard}>
            <InfoItem 
              label="ทะเบียนรถ" 
              value={userInfo?.license_plate} 
              icon="car-side"
            />
            
            <InfoItem 
              label="ประเภทรถ" 
              value={userInfo?.vehicletype_name} 
              icon="truck-flatbed"
            />
            
            {userInfo?.province && (
              <InfoItem 
                label="จังหวัด" 
                value={userInfo.province} 
                icon="map-marker-radius"
              />
            )}
            
            <InfoItem 
              label="วันหมดอายุใบขับขี่" 
              value={userInfo?.id_expiry_date} 
              icon="calendar"
            />
          </View>
        </View>

        {/* Spacer for fixed button */}
        <View style={styles.buttonSpacer} />
      </Animated.ScrollView>
      
      {/* Edit Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditInfo', { userData })}
          activeOpacity={0.8}
        >
          <Icon name="pencil" size={20} color="white" style={styles.editIcon} />
          <Text style={styles.editButtonText}>แก้ไขข้อมูล</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'white',
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.DANGER,
    fontFamily: FONTS.FAMILY.REGULAR,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.GRAY_300,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.GRAY_800,
    fontSize: 16,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.BOLD || FONTS.FAMILY.REGULAR,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginLeft: 4,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  shareIcon: {
    marginRight: 6,
  },
  shareText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabelText: {
    fontSize: 15,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
  },
  buttonSpacer: {
    height: 80,
  },
});

export default PersonalInfoScreen;