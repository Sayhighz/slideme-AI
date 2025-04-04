import React from 'react';
import { View, Text, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { IMAGE_URL } from '../../config';
import { useDriverScore } from '../../utils/hooks';

const HomeHeader = ({ userData }) => {
  const { driverScore } = useDriverScore(userData?.driver_id);

  return (
    <View style={tw`flex-row items-center mt-10 p-2 w-19/20 mx-auto`}>
      <Image
        source={{
          uri: `${IMAGE_URL}${userData?.profile_picture}`,
        }}
        style={tw`w-24 h-24 rounded-full border-2 border-green-400`}
      />
      <View style={tw`ml-4`}>
        <Text style={[tw`text-sm text-gray-400`, { fontFamily: 'Mitr-Regular' }]}>
          สวัสดี!
        </Text>
        <Text style={[tw`text-2xl text-[#60B876]`, { fontFamily: 'Mitr-Regular' }]}>
          {`${userData?.first_name || "ไม่พบข้อมูล"} ${userData?.last_name || ""}`}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Icon 
            name="star" 
            size={24} 
            color="orange" 
            style={tw`mr-1`}
          />
          <Text style={[tw`text-lg text-gray-700`, { fontFamily: 'Mitr-Regular' }]}>
            {driverScore ? driverScore : "0.0"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HomeHeader;