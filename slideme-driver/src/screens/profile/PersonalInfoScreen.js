import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';
import { IMAGE_URL } from '../../config';
import { formatDate } from '../../utils/formatters';
import { useDriverScore } from '../../utils/hooks';

// Import Components
import HeaderWithBackButton from '../../components/common/HeaderWithBackButton';

const PersonalInfoScreen = ({ navigation, route }) => {
  const { userData = {} } = route.params || {};
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { driverScore } = useDriverScore(userData?.driver_id);

  // Fetch user details
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userData?.driver_id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setLoading(false);
        return;
      }

      try {
        const response = await getRequest(`driver/getinfo?driver_id=${userData.driver_id}`);
        if (response && response.Status && response.Result.length > 0) {
          const user = response.Result[0];
          // Format dates if needed
          if (user.id_expiry_date) {
            user.id_expiry_date = formatDate(user.id_expiry_date);
          }
          if (user.birth_date) {
            user.birth_date = formatDate(user.birth_date);
          }
          setUserInfo(user);
          setError(null);
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
      <SafeAreaView style={tw`flex-1 bg-white justify-center items-center`}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </SafeAreaView>
    );
  }

  // Show error message
  if (error) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white justify-center items-center`}>
        <Text style={[tw`text-red-500 mb-4`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={tw`bg-gray-200 px-4 py-2 rounded-lg`}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontFamily: FONTS.FAMILY.REGULAR }}>กลับ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderWithBackButton
        showBackButton={true}
        title="ข้อมูลส่วนตัว"
        onPress={() => navigation.goBack()}
      />

      <ScrollView>
        {/* Profile Image and Name Section */}
        <View style={tw`items-center py-4`}>
          <Image
            source={{
              uri: `${IMAGE_URL}${userData?.profile_picture}`,
              headers: { pragma: 'no-cache' }
            }}
            style={tw`w-32 h-32 rounded-full border-2 border-[${COLORS.PRIMARY}]`}
          />
          <Text 
            style={[
              tw`text-xl mt-2 text-[${COLORS.PRIMARY}]`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {`${userInfo?.first_name || userData?.first_name || ''} ${userInfo?.last_name || userData?.last_name || ''}`}
          </Text>
          <View style={tw`flex-row items-center mt-1`}>
            <Icon name="star" size={16} color="orange" />
            <Text 
              style={[
                tw`ml-1 text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {driverScore ? driverScore.toFixed(1) : "0.0"}
            </Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={tw`px-4 py-4`}>
          <Text 
            style={[
              tw`text-lg mb-4 text-gray-700`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ข้อมูลทั่วไป
          </Text>

          <View style={tw`bg-white rounded-lg shadow-sm p-4 mb-4`}>
            {/* Phone Number */}
            <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                เบอร์โทรศัพท์
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.phone_number || userData?.phone_number || 'ไม่พบข้อมูล'}
              </Text>
            </View>

            {/* ID Number */}
            {userInfo?.id_number && (
              <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
                <Text 
                  style={[
                    tw`text-gray-500`, 
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  เลขบัตรประชาชน
                </Text>
                <Text 
                  style={[
                    tw`text-gray-700`, 
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {userInfo.id_number}
                </Text>
              </View>
            )}

            {/* Birth Date */}
            {userInfo?.birth_date && (
              <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
                <Text 
                  style={[
                    tw`text-gray-500`, 
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  วันเกิด
                </Text>
                <Text 
                  style={[
                    tw`text-gray-700`, 
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {userInfo.birth_date}
                </Text>
              </View>
            )}

            {/* Email */}
            <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                อีเมล
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.email || 'ไม่มีข้อมูล'}
              </Text>
            </View>

            {/* Address */}
            <View style={tw`flex-row justify-between`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ที่อยู่
              </Text>
              <Text 
                style={[
                  tw`text-gray-700 text-right flex-1 ml-4`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.address || 'ไม่มีข้อมูล'}
              </Text>
            </View>
          </View>

          {/* Vehicle Information Section */}
          <Text 
            style={[
              tw`text-lg mb-4 text-gray-700`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ข้อมูลยานพาหนะ
          </Text>

          <View style={tw`bg-white rounded-lg shadow-sm p-4`}>
            {/* License Plate */}
            <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ทะเบียนรถ
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.license_plate || 'ไม่พบข้อมูล'}
              </Text>
            </View>

            {/* Vehicle Type */}
            <View style={tw`flex-row justify-between mb-3 border-b border-gray-100 pb-3`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ประเภทรถ
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.vehicle_type || 'ไม่พบข้อมูล'}
              </Text>
            </View>

            {/* License Expiry */}
            <View style={tw`flex-row justify-between`}>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                วันหมดอายุใบขับขี่
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {userInfo?.id_expiry_date || 'ไม่พบข้อมูล'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Button */}
      <View style={tw`px-4 py-4 bg-white border-t border-gray-200`}>
        <TouchableOpacity
          style={tw`bg-[${COLORS.PRIMARY}] py-3 rounded-lg`}
          onPress={() => navigation.navigate('EditInfo', { userData })}
        >
          <Text 
            style={[
              tw`text-white text-center`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            แก้ไขข้อมูล
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PersonalInfoScreen;