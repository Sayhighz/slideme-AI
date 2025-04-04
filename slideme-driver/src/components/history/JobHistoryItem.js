import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';
import { formatNumberWithCommas } from '../../utils/formatters';

const JobHistoryItem = ({ job, onPress }) => {
  // Helper function for getting status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return tw`text-green-500`;
      case 'cancelled':
        return tw`text-red-500`;
      default:
        return tw`text-gray-500`;
    }
  };

  // Format status text
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity
      style={tw`p-4 mb-4 mx-3 bg-white rounded-lg shadow-md border border-gray-200 flex-row`}
      onPress={() => onPress(job)}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Icon name="map-marker" size={20} color="green" />
          <Text 
            style={[
              tw`ml-2 text-gray-800`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {job.location_from || job.origin}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Icon name="map-marker" size={20} color="red" />
          <Text 
            style={[
              tw`ml-2 text-gray-800`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {job.location_to || job.destination}
          </Text>
        </View>
      </View>
      <View style={tw`ml-4 justify-center`}>
        <Text 
          style={[
            tw`text-base`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ฿{formatNumberWithCommas(job.profit || job.offered_price)}
        </Text>
        <Text 
          style={[
            getStatusStyle(job.status),
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {getStatusText(job.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default JobHistoryItem;