import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';
import { formatNumberWithCommas, formatDate } from '../../utils/formatters';

const JobHistoryDetail = ({ job, visible, onClose }) => {
  if (!job) return null;

  // Format date from ISO
  const formatDateTime = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  };

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent={true} 
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-11/12 max-h-5/6 bg-white rounded-lg`}>
          <View style={tw`p-4 border-b border-gray-200 flex-row justify-between items-center`}>
            <Text 
              style={[
                tw`text-lg font-medium`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              รายละเอียดงาน
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={tw`p-4`}>
            {/* Date and Time */}
            <View style={tw`mb-4`}>
              <Text 
                style={[
                  tw`text-gray-500 mb-1`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                วันเวลา
              </Text>
              <Text 
                style={[
                  tw`text-gray-800`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {formatDateTime(job.booking_time || job.created_at)}
              </Text>
            </View>
            
            {/* Status */}
            <View style={tw`mb-4`}>
              <Text 
                style={[
                  tw`text-gray-500 mb-1`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                สถานะ
              </Text>
              <View style={tw`flex-row items-center`}>
                <View 
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    job.status === 'completed' ? tw`bg-green-500` : 
                    job.status === 'cancelled' ? tw`bg-red-500` : tw`bg-gray-500`
                  ]} 
                />
                <Text 
                  style={[
                    tw`text-gray-800`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {job.status === 'completed' ? 'เสร็จสิ้น' : 
                   job.status === 'cancelled' ? 'ยกเลิก' : job.status}
                </Text>
              </View>
            </View>
            
            {/* Locations */}
            <View style={tw`mb-4`}>
              <Text 
                style={[
                  tw`text-gray-500 mb-1`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                จุดรับ
              </Text>
              <Text 
                style={[
                  tw`text-gray-800 mb-3`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                <Icon name="map-marker" size={16} color="green" /> {job.location_from || job.origin}
              </Text>
              
              <Text 
                style={[
                  tw`text-gray-500 mb-1`,
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
                <Icon name="map-marker" size={16} color="red" /> {job.location_to || job.destination}
              </Text>
            </View>
            
            {/* Price */}
            <View style={tw`mb-4`}>
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
                  tw`text-xl text-[${COLORS.PRIMARY}]`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ฿{formatNumberWithCommas(job.profit || job.offered_price)}
              </Text>
            </View>
            
            {/* Customer Info */}
            {job.customer_name && (
              <View style={tw`mb-4`}>
                <Text 
                  style={[
                    tw`text-gray-500 mb-1`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  ลูกค้า
                </Text>
                <Text 
                  style={[
                    tw`text-gray-800`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {job.customer_name}
                </Text>
              </View>
            )}
            
            {/* Customer Message */}
            {job.customer_message && (
              <View style={tw`mb-4`}>
                <Text 
                  style={[
                    tw`text-gray-500 mb-1`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  ข้อความจากลูกค้า
                </Text>
                <Text 
                  style={[
                    tw`text-gray-800`,
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  {job.customer_message}
                </Text>
              </View>
            )}
          </ScrollView>
          
          <View style={tw`p-4 border-t border-gray-200`}>
            <TouchableOpacity 
              style={tw`bg-[${COLORS.PRIMARY}] p-3 rounded-lg items-center`} 
              onPress={onClose}
            >
              <Text 
                style={[
                  tw`text-white font-medium`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
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