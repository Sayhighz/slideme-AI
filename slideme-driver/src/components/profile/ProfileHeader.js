import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { IMAGE_URL } from '../../config';
import { FONTS, COLORS } from '../../constants';
import { useDriverScore } from '../../utils/hooks';

const ProfileHeader = ({ userData, onEditPress }) => {
  const { driverScore } = useDriverScore(userData?.driver_id);

  return (
    <View style={tw`p-4 bg-white mb-4 border-b border-gray-200`}>
      <View style={tw`flex-row items-center`}>
        <Image
          source={{
            uri: `${IMAGE_URL}${userData?.profile_picture}`,
            headers: { pragma: 'no-cache' }
          }}
          style={tw`w-24 h-24 rounded-full border-2 border-[${COLORS.PRIMARY}]`}
        />
        <View style={tw`ml-4 flex-1`}>
          <Text style={[tw`text-sm text-gray-400`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            สวัสดี!
          </Text>
          <Text style={[tw`text-2xl text-[${COLORS.PRIMARY}]`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            {`${userData?.first_name || "ไม่พบข้อมูล"} ${userData?.last_name || ""}`}
          </Text>
          <View style={tw`flex-row items-center`}>
            <Icon 
              name="star" 
              size={24} 
              color="orange" 
              style={tw`mr-1`}
            />
            <Text style={[tw`text-lg text-gray-700`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              {driverScore ? driverScore : "0.0"}
            </Text>
          </View>
        </View>
        {onEditPress && (
          <TouchableOpacity 
            style={tw`p-2 rounded-full bg-gray-100`}
            onPress={onEditPress}
          >
            <Icon name="edit" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProfileHeader;