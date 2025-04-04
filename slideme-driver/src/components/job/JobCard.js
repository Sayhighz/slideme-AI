import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { formatJobDetails } from '../../utils/formatters/job';
import { FONTS } from '../../constants';

const JobCard = ({ job, onPress }) => {
  const {
    formattedOrigin, 
    formattedDestination, 
    formattedPrice, 
    statusInfo 
  } = formatJobDetails(job);

  return (
    <TouchableOpacity 
      style={tw`p-4 bg-white rounded-lg mb-4 shadow-md border border-gray-200`}
      onPress={() => onPress(job)}
    >
      {/* Distance */}
      <Text 
        style={[
          tw`text-gray-700 mb-3`, 
          { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
        ]}
      >
        ระยะทาง: {job.distance || 'N/A'} กม.
      </Text>

      {/* Locations */}
      <View style={tw`flex-row mb-3`}>
        <View style={tw`flex-1 flex-row items-center`}>
          <Icon name="map-marker" size={20} color="green" />
          <Text 
            style={[
              tw`ml-2 text-gray-600`, 
              { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
            ]}
          >
            {formattedOrigin}
          </Text>
        </View>
        <View style={tw`flex-1 flex-row items-center justify-end`}>
          <Icon name="map-marker" size={20} color="red" />
          <Text 
            style={[
              tw`ml-2 text-gray-600`, 
              { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
            ]}
          >
            {formattedDestination}
          </Text>
        </View>
      </View>

      {/* Job Details */}
      <View style={tw`flex-row justify-between items-center`}>
        <View>
          <Text 
            style={[
              tw`text-blue-500`, 
              { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
            ]}
          >
            ฿{formattedPrice}
          </Text>
        </View>
        <View>
          <Text 
            style={[
              tw`${statusInfo.color} text-xs`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {statusInfo.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default JobCard;