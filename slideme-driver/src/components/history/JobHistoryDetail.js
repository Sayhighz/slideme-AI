import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Linking,
  Pressable
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';
import { formatNumberWithCommas } from '../../utils/formatters';

const JobHistoryDetail = ({ job, visible, onClose }) => {
  if (!job) return null;

  // Format date from DD/MM/YYYY format
  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'ไม่ระบุ';
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    return `${day} ${months[month-1]} ${year} ${timeString || ''}`;
  };
  
  // Helper function for getting status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: COLORS.SUCCESS,
          bgColor: 'bg-green-100',
          icon: 'check-circle',
          text: 'เสร็จสิ้น'
        };
      case 'cancelled':
        return {
          color: COLORS.DANGER,
          bgColor: 'bg-red-100',
          icon: 'close-circle',
          text: 'ยกเลิก'
        };
      default:
        return {
          color: COLORS.GRAY_600,
          bgColor: 'bg-gray-100',
          icon: 'information',
          text: status
        };
    }
  };

  const statusInfo = getStatusStyle(job.status);

  // Open location in Google Maps
  const openLocationInMaps = (latitude, longitude, label) => {
    // If we have actual coordinates
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      Linking.openURL(url);
    } else if (label) {
      // If we only have the location name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
      Linking.openURL(url);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true} 
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
        <View style={tw`bg-white rounded-t-3xl max-h-[85%]`}>
          {/* Header */}
          <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
            <View style={tw`flex-1`}>
              <Text 
                style={[
                  tw`text-2xl text-gray-800`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                รายละเอียดงาน
              </Text>
              <Text 
                style={[
                  tw`text-gray-500`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {formatDateTime(job.request_date, job.request_time)}
              </Text>
            </View>
            <TouchableOpacity 
              style={tw`h-10 w-10 rounded-full bg-gray-100 items-center justify-center`} 
              onPress={onClose}
            >
              <Icon name="close" size={24} color={COLORS.GRAY_700} />
            </TouchableOpacity>
          </View>

          {/* Status indicator */}
          <View style={tw`mx-6 mb-6 p-3 ${statusInfo.bgColor} rounded-lg flex-row items-center`}>
            <Icon name={statusInfo.icon} size={24} color={statusInfo.color} />
            <Text 
              style={[
                tw`ml-2 text-base`,
                { fontFamily: FONTS.FAMILY.MEDIUM, color: statusInfo.color }
              ]}
            >
              {statusInfo.text}
            </Text>
          </View>
          
          <ScrollView style={tw`px-6`} showsVerticalScrollIndicator={false}>
            {/* Price */}
            <View style={tw`mb-6 p-4 bg-gray-50 rounded-lg items-center`}>
              <Text 
                style={[
                  tw`text-gray-500 mb-1`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                รายได้
              </Text>
              <Text 
                style={[
                  tw`text-3xl text-[${COLORS.PRIMARY}]`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                ฿{formatNumberWithCommas(job.offered_price || job.profit || 0)}
              </Text>
            </View>
            
            {/* Locations */}
            <View style={tw`mb-6`}>
              <Text 
                style={[
                  tw`text-lg text-gray-800 mb-3`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                เส้นทาง
              </Text>
              
              {/* Pickup location */}
              <Pressable 
                style={tw`mb-4 p-4 bg-green-50 rounded-lg flex-row items-center`}
                onPress={() => openLocationInMaps(job.pickup_lat, job.pickup_long, job.location_from)}
              >
                <View style={tw`mr-3 h-10 w-10 bg-green-200 rounded-full items-center justify-center`}>
                  <Icon name="map-marker" size={20} color={COLORS.SUCCESS} />
                </View>
                <View style={tw`flex-1`}>
                  <Text 
                    style={[
                      tw`text-xs text-gray-500 mb-1`,
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
                  >
                    {job.location_from || job.origin || '-'}
                  </Text>
                </View>
                <Icon name="map" size={20} color={COLORS.PRIMARY} />
              </Pressable>
              
              {/* Line connector */}
              <View style={tw`w-0.5 h-6 bg-gray-300 self-center -my-1`} />
              
              {/* Dropoff location */}
              <Pressable 
                style={tw`p-4 bg-red-50 rounded-lg flex-row items-center`}
                onPress={() => openLocationInMaps(job.dropoff_lat, job.dropoff_long, job.location_to)}
              >
                <View style={tw`mr-3 h-10 w-10 bg-red-200 rounded-full items-center justify-center`}>
                  <Icon name="map-marker" size={20} color={COLORS.DANGER} />
                </View>
                <View style={tw`flex-1`}>
                  <Text 
                    style={[
                      tw`text-xs text-gray-500 mb-1`,
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
                  >
                    {job.location_to || job.destination || '-'}
                  </Text>
                </View>
                <Icon name="map" size={20} color={COLORS.PRIMARY} />
              </Pressable>
            </View>
            
            <View style={tw`flex-row mb-6`}>
              {/* Vehicle type */}
              {job.vehicletype_name && (
                <View style={tw`flex-1 bg-blue-50 p-3 rounded-lg mr-2`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Icon name="car" size={16} color={COLORS.INFO} />
                    <Text 
                      style={[
                        tw`ml-1 text-xs text-gray-500`,
                        { fontFamily: FONTS.FAMILY.REGULAR }
                      ]}
                    >
                      ประเภทรถ
                    </Text>
                  </View>
                  <Text 
                    style={[
                      tw`text-gray-800`,
                      { fontFamily: FONTS.FAMILY.REGULAR }
                    ]}
                  >
                    {job.vehicletype_name}
                  </Text>
                </View>
              )}
              
              {/* Travel info - distance and time */}
              {(job.distance_km || job.travel_time_minutes) && (
                <View style={tw`flex-1 bg-purple-50 p-3 rounded-lg`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Icon name="clock-outline" size={16} color="#9C27B0" />
                    <Text 
                      style={[
                        tw`ml-1 text-xs text-gray-500`,
                        { fontFamily: FONTS.FAMILY.REGULAR }
                      ]}
                    >
                      ระยะเวลา & ระยะทาง
                    </Text>
                  </View>
                  <Text 
                    style={[
                      tw`text-gray-800`,
                      { fontFamily: FONTS.FAMILY.REGULAR }
                    ]}
                  >
                    {job.distance_km ? `${job.distance_km} กม.` : ''} 
                    {job.distance_km && job.travel_time_minutes ? ' • ' : ''}
                    {job.travel_time_minutes ? `${job.travel_time_minutes} นาที` : ''}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Customer info */}
            {(job.customer_first_name || job.customer_last_name) && (
              <View style={tw`mb-6 bg-yellow-50 p-4 rounded-lg`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon name="account" size={20} color={COLORS.WARNING} />
                  <Text 
                    style={[
                      tw`ml-2 text-base text-gray-800`,
                      { fontFamily: FONTS.FAMILY.MEDIUM }
                    ]}
                  >
                    ข้อมูลลูกค้า
                  </Text>
                </View>
                <Text 
                  style={[
                    tw`text-gray-800`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {`${job.customer_first_name || ''} ${job.customer_last_name || ''}`}
                </Text>
              </View>
            )}
            
            {/* Rating info */}
            {job.rating && (
              <View style={tw`mb-6 bg-amber-50 p-4 rounded-lg`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon name="star" size={20} color="#FFC107" />
                  <Text 
                    style={[
                      tw`ml-2 text-base text-gray-800`,
                      { fontFamily: FONTS.FAMILY.MEDIUM }
                    ]}
                  >
                    คะแนน
                  </Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  {/* Display stars based on rating */}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon 
                      key={index} 
                      name={index < Math.floor(job.rating) ? "star" : 
                           (index < job.rating && job.rating % 1 !== 0) ? "star-half-full" : "star-outline"} 
                      size={24} 
                      color="#FFC107" 
                      style={tw`mr-1`}
                    />
                  ))}
                  <Text 
                    style={[
                      tw`ml-2 text-base text-gray-800`,
                      { fontFamily: FONTS.FAMILY.REGULAR }
                    ]}
                  >
                    {job.rating}/5
                  </Text>
                </View>
              </View>
            )}
            
            {/* Customer Message */}
            {job.customer_message && (
              <View style={tw`mb-6 p-4 bg-gray-50 rounded-lg`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon name="message-text" size={20} color={COLORS.GRAY_600} />
                  <Text 
                    style={[
                      tw`ml-2 text-base text-gray-800`,
                      { fontFamily: FONTS.FAMILY.MEDIUM }
                    ]}
                  >
                    ข้อความจากลูกค้า
                  </Text>
                </View>
                <Text 
                  style={[
                    tw`text-gray-700 italic`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  "{job.customer_message}"
                </Text>
              </View>
            )}
            
            {/* Extra space at bottom for better scrolling */}
            <View style={tw`h-6`} />
          </ScrollView>
          
          {/* Footer */}
          <View style={tw`p-4 shadow-t border-t border-gray-200`}>
            <TouchableOpacity 
              style={tw`bg-[${COLORS.PRIMARY}] p-4 rounded-xl items-center`} 
              onPress={onClose}
            >
              <Text 
                style={[
                  tw`text-white font-medium`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                ปิด
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default JobHistoryDetail;