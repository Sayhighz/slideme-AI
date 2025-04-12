import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';
import { formatNumberWithCommas } from '../../utils/formatters';

const JobHistoryItem = ({ job, onPress }) => {
  // Helper function for getting status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: COLORS.SUCCESS,
          bgColor: 'bg-green-50',
          icon: 'check-circle',
          text: 'เสร็จสิ้น'
        };
      case 'cancelled':
        return {
          color: COLORS.DANGER,
          bgColor: 'bg-red-50',
          icon: 'close-circle',
          text: 'ยกเลิก'
        };
      default:
        return {
          color: COLORS.GRAY_500,
          bgColor: 'bg-gray-50',
          icon: 'information',
          text: status
        };
    }
  };

  const statusInfo = getStatusStyle(job.status);
  
  // Format date and time
  const formatDateFromAPI = (dateStr, timeStr) => {
    if (!dateStr) return '';
    
    // Convert date format from DD/MM/YYYY to readable format
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 
      'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 
      'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    return `${day} ${months[month-1]} ${year} ${timeStr || ''}`;
  };

  return (
    <TouchableOpacity
      style={tw`mx-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      {/* Status indicator at top */}
      <View style={tw`flex-row items-center justify-between ${statusInfo.bgColor} px-4 py-2`}>
        <View style={tw`flex-row items-center`}>
          <Icon name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text 
            style={[
              tw`ml-2`,
              { fontFamily: FONTS.FAMILY.REGULAR, color: statusInfo.color }
            ]}
          >
            {statusInfo.text}
          </Text>
        </View>
        <Text 
          style={[
            tw`text-gray-500`,
            { fontFamily: FONTS.FAMILY.REGULAR, fontSize: 12 }
          ]}
        >
          {formatDateFromAPI(job.request_date, job.request_time)}
        </Text>
      </View>
      
      {/* Main content */}
      <View style={tw`p-4`}>
        {/* Locations */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`h-8 w-8 bg-green-100 rounded-full items-center justify-center mr-3`}>
              <Icon name="map-marker" size={18} color={COLORS.SUCCESS} />
            </View>
            <View style={tw`flex-1`}>
              <Text 
                style={[
                  tw`text-xs text-gray-500 mb-0.5`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                จุดรับ
              </Text>
              <Text 
                style={[
                  tw`text-gray-800`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
                numberOfLines={1}
              >
                {job.location_from || job.origin || '-'}
              </Text>
            </View>
          </View>
          
          <View style={tw`flex-row items-center`}>
            <View style={tw`h-8 w-8 bg-red-100 rounded-full items-center justify-center mr-3`}>
              <Icon name="map-marker" size={18} color={COLORS.DANGER} />
            </View>
            <View style={tw`flex-1`}>
              <Text 
                style={[
                  tw`text-xs text-gray-500 mb-0.5`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                จุดส่ง
              </Text>
              <Text 
                style={[
                  tw`text-gray-800`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
                numberOfLines={1}
              >
                {job.location_to || job.destination || '-'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Horizontal divider */}
        <View style={tw`border-t border-gray-200 my-2`} />
        
        {/* Footer info */}
        <View style={tw`flex-row justify-between items-center mt-2`}>
          {/* Vehicle info */}
          {job.vehicletype_name && (
            <View style={tw`flex-row items-center`}>
              <Icon name="car" size={16} color={COLORS.GRAY_600} />
              <Text 
                style={[
                  tw`ml-1 text-gray-600 text-xs`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {job.vehicletype_name}
              </Text>
            </View>
          )}
          
          {/* Price */}
          <Text 
            style={[
              tw`text-lg text-[${COLORS.PRIMARY}] font-semibold`,
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
          >
            ฿{formatNumberWithCommas(job.offered_price || job.profit || 0)}
          </Text>
        </View>
        
        {/* Rating if available */}
        {job.rating && (
          <View style={tw`flex-row items-center mt-2`}>
            <Icon name="star" size={16} color="#FFC107" />
            <Text 
              style={[
                tw`ml-1 text-gray-600 text-xs`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {job.rating}/5
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default JobHistoryItem;