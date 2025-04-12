import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Image, 
  Platform,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

// Constants and formatters
import { COLORS, FONTS } from '../../constants';
import { formatCurrency } from '../../utils/formatters';
import { IMAGE_URL } from '../../config';

const DriverProfile = ({ userData, driverScore, profitToday, isLoading, onProfilePress }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset states when userData changes
    setImageError(false);
    
    // Only attempt to load image if profile_picture exists
    if (userData?.profile_picture) {
      setImageLoading(true);
      setProfileImage(`${IMAGE_URL}${userData.profile_picture}`);
    } else {
      setImageLoading(false);
    }
  }, [userData]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Shadow styles based on platform
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  });

  return (
    <View style={[
      tw`bg-white p-5 border-b border-gray-200`,
      cardShadow
    ]}>
      {/* Profile and Greeting */}
      <View style={tw`flex-row items-center mb-5`}>
        {/* Profile Picture */}
        <TouchableOpacity 
          style={tw`mr-4`}
          onPress={onProfilePress}
          disabled={!onProfilePress}
        >
          <View style={tw`relative`}>
            {imageLoading && (
              <View style={[
                tw`w-16 h-16 rounded-full bg-gray-100 items-center justify-center`,
                { overflow: 'hidden' }
              ]}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              </View>
            )}
            
            {!imageLoading && (profileImage && !imageError) ? (
              <Image
                source={{ uri: profileImage }}
                style={[
                  tw`w-16 h-16 rounded-full bg-gray-100`,
                  { borderWidth: 1.5, borderColor: COLORS.PRIMARY }
                ]}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <View style={[
                tw`w-16 h-16 rounded-full bg-gray-100 items-center justify-center`,
                { borderWidth: 1, borderColor: COLORS.GRAY_300 }
              ]}>
                <Icon name="account" size={40} color={COLORS.GRAY_500} />
              </View>
            )}
            
            {/* Online status indicator */}
            <View style={[
              tw`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white`,
              { backgroundColor: COLORS.SUCCESS }
            ]} />
          </View>
        </TouchableOpacity>
        
        {/* Greeting */}
        <View style={tw`flex-1`}>
          <Text style={[
            tw`text-2xl mb-1`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}>
            สวัสดี, คุณ{userData?.first_name || 'ผู้ขับ'}
          </Text>
          <Text style={[
            tw`text-sm text-gray-500`,
            { fontFamily: FONTS.FAMILY.LIGHT }
          ]}>
            {userData?.license_plate ? (
              <View style={tw`flex-row items-center`}>
                <Icon name="car" size={14} color={COLORS.GRAY_500} style={tw`mr-1`} />
                <Text style={{fontFamily: FONTS.FAMILY.LIGHT} }>ทะเบียนรถ: {userData.license_plate}</Text>
              </View>
            ) : (
              'ยินดีต้อนรับสู่ Slideme Driver'
            )}
          </Text>
        </View>
      </View>
      
      {/* Score and Earnings Row */}
      <View style={tw`flex-row justify-between mt-2`}>
        {/* Driver Score */}
        <View style={[
          tw`bg-gray-50 rounded-xl p-4 flex-1 mr-2`,
          { borderWidth: 1, borderColor: COLORS.GRAY_200 }
        ]}>
          <View style={tw`flex-row items-center mb-1`}>
            <Icon name="star" size={18} color="#FFC107" />
            <Text style={[
              tw`text-gray-600 ml-2 text-sm`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              คะแนนคนขับ
            </Text>
          </View>
          
          {isLoading ? (
            <View style={tw`h-7 justify-center`}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            </View>
          ) : (
            <Text style={[
              tw`text-xl font-semibold`,
              { fontFamily: FONTS.FAMILY.MEDIUM, color: driverScore >= 4.5 ? COLORS.SUCCESS : COLORS.TEXT_PRIMARY }
            ]}>
              {driverScore ? parseFloat(driverScore).toFixed(1) : '0.0'}<Text style={tw`text-gray-500 text-sm`}>/5.0</Text>
            </Text>
          )}
        </View>
        
        {/* Today's Earnings */}
        <View style={[
          tw`bg-gray-50 rounded-xl p-4 flex-1 ml-2`,
          { borderWidth: 1, borderColor: COLORS.GRAY_200 }
        ]}>
          <View style={tw`flex-row items-center mb-1`}>
            <Icon name="cash" size={18} color={COLORS.PRIMARY} />
            <Text style={[
              tw`text-gray-600 ml-2 text-sm`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              รายได้วันนี้
            </Text>
          </View>
          
          {isLoading ? (
            <View style={tw`h-7 justify-center`}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            </View>
          ) : (
            <Text style={[
              tw`text-xl font-semibold`,
              { fontFamily: FONTS.FAMILY.MEDIUM, color: COLORS.TEXT_PRIMARY }
            ]}>
              {formatCurrency(profitToday)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default DriverProfile;