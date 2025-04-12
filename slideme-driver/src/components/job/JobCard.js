import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { formatJobDetails } from '../../utils/formatters/job';
import { FONTS, COLORS } from '../../constants';

const JobCard = ({ job, onPress }) => {
  // Either use the pre-formatted details from API or format them if not available
  const formattedJobDetails = job.formattedOrigin ? job : formatJobDetails(job);
  
  const {
    formattedOrigin,
    formattedDestination,
    formattedPrice,
    statusInfo
  } = formattedJobDetails;

  // Handle formatted distance from different sources
  const distanceText = typeof job.distance === 'string' 
    ? job.distance                     // Already formatted string from parent
    : job.distance_text                // API-provided formatted string
    || `${job.distance || 0} กม.`;    // Fallback to numeric value or 0

  // Format booking time if available
  const formattedTime = job.booking_time_formatted 
    ? `${job.booking_time_formatted.date} ${job.booking_time_formatted.time}`
    : '';

  // Determine status color
  const getStatusColor = () => {
    if (statusInfo?.color) return statusInfo.color;
    
    switch(job.status) {
      case 'pending': return 'text-yellow-500';
      case 'accepted': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        tw`p-4 bg-white rounded-xl mb-4 shadow-lg border border-gray-100`,
        styles.cardShadow
      ]}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      {/* Header: Distance and Time */}
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <View style={tw`flex-row items-center`}>
          <Icon name="map-marker-distance" size={18} color={COLORS.PRIMARY} />
          <Text 
            style={[
              tw`text-gray-700 ml-1 font-medium`, 
              { fontFamily: FONTS.FAMILY.MEDIUM, fontSize: FONTS.SIZE.M }
            ]}
          >
            {distanceText}
          </Text>
        </View>
        
        {formattedTime && (
          <View style={tw`flex-row items-center`}>
            <Icon name="clock-outline" size={16} color={COLORS.GRAY_600} />
            <Text 
              style={[
                tw`text-gray-500 ml-1`,
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }
              ]}
            >
              {formattedTime}
            </Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={tw`h-0.5 bg-gray-100 my-2`} />

      {/* Locations */}
      <View style={tw`mb-3`}>
        <View style={tw`flex-row mb-3`}>
          <View style={tw`mr-2 mt-1`}>
            <View style={tw`w-7 h-7 rounded-full bg-green-100 items-center justify-center`}>
              <Icon name="map-marker" size={18} color="green" />
            </View>
          </View>
          <View style={tw`flex-1`}>
            <Text 
              style={[
                tw`text-gray-500 mb-1`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }
              ]}
            >
              ต้นทาง
            </Text>
            <Text 
              style={[
                tw`text-gray-800`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
              numberOfLines={2}
            >
              {formattedOrigin || job.location_from}
            </Text>
          </View>
        </View>
        
        <View style={tw`flex-row`}>
          <View style={tw`mr-2 mt-1`}>
            <View style={tw`w-7 h-7 rounded-full bg-red-100 items-center justify-center`}>
              <Icon name="map-marker" size={18} color="red" />
            </View>
          </View>
          <View style={tw`flex-1`}>
            <Text 
              style={[
                tw`text-gray-500 mb-1`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }
              ]}
            >
              ปลายทาง
            </Text>
            <Text 
              style={[
                tw`text-gray-800`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
              numberOfLines={2}
            >
              {formattedDestination || job.location_to}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer: Price, Vehicle Type, Status */}
      <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100`}>
        {/* Price */}
        <View style={tw`flex-row items-center`}>
          <Icon name="cash" size={20} color={COLORS.PRIMARY} />
          <Text 
            style={[
              tw`text-[${COLORS.PRIMARY}] ml-1 font-medium`, 
              { fontFamily: FONTS.FAMILY.MEDIUM, fontSize: FONTS.SIZE.M }
            ]}
          >
            {formattedPrice ? `฿${formattedPrice}` : 'ตามระยะทาง'}
          </Text>
        </View>
        
        <View style={tw`flex-row items-center`}>
          {/* Vehicle Type - if available */}
          {job.vehicletype_name && (
            <View style={tw`flex-row items-center mr-3`}>
              <Icon name="car" size={16} color={COLORS.GRAY_600} />
              <Text 
                style={[
                  tw`text-gray-600 ml-1`, 
                  { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }
                ]}
              >
                {job.vehicletype_name}
              </Text>
            </View>
          )}
          
          {/* Status */}
          <View style={tw`bg-gray-100 px-2 py-1 rounded-full`}>
            <Text 
              style={[
                tw`${getStatusColor()} text-xs`, 
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}
            >
              {statusInfo?.text || (job.status === 'pending' ? 'รออนุมัติ' : job.status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  }
});

export default JobCard;