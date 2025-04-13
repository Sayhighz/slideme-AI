import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';

// Constants
import { COLORS, FONTS, STATUS, MESSAGES } from '../../constants';
import { formatCurrency, formatDate, truncateText } from '../../utils/formatters';
import { calculateDistance } from '../../utils/helpers';

// Services
import { postRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

// Offer Item Component
const OfferItem = ({ offer, onPress, onCancel, index }) => {
  const [cancelling, setCancelling] = useState(false);
  
  // Platform specific shadow
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  });

  // Status color and text
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          label: 'รออนุมัติ',
          icon: 'clock-outline'
        };
      case 'accepted':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          label: 'ได้รับการอนุมัติ',
          icon: 'check-circle-outline'
        };
      case 'rejected':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          label: 'ถูกปฏิเสธ',
          icon: 'close-circle-outline'
        };
      case 'expired':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          label: 'หมดอายุ',
          icon: 'alert-circle-outline'
        };
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          label: status || 'ไม่ระบุ',
          icon: 'information-outline'
        };
    }
  };

  const statusInfo = getStatusInfo(offer.offer_status);
  
  // คำนวณระยะทางระหว่างต้นทางและปลายทาง (ถ้ามีข้อมูลพิกัด)
  const distance = offer.pickup_lat && offer.pickup_long && offer.dropoff_lat && offer.dropoff_long
    ? calculateDistance(
        parseFloat(offer.pickup_lat),
        parseFloat(offer.pickup_long),
        parseFloat(offer.dropoff_lat),
        parseFloat(offer.dropoff_long)
      )
    : null;

  // ฟังก์ชันสำหรับยกเลิกข้อเสนอ
  const handleCancel = async () => {
    // แสดง confirm dialog ก่อนยกเลิก
    Alert.alert(
      "ยกเลิกข้อเสนอ",
      MESSAGES.CONFIRM.CANCEL_OFFER,
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        {
          text: "ยืนยัน",
          onPress: async () => {
            try {
              setCancelling(true);
              // เรียก API เพื่อยกเลิกข้อเสนอ - ส่งทั้ง offer_id เท่านั้น 
              // driver_id จะถูกเพิ่มในฟังก์ชัน handleCancelOffer
              await onCancel(offer.offer_id);
            } catch (error) {
              console.error("Error cancelling offer:", error);
              Alert.alert("ข้อผิดพลาด", "ไม่สามารถยกเลิกข้อเสนอได้ กรุณาลองใหม่อีกครั้ง");
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={tw`mb-3`}>
      <TouchableOpacity 
        style={[
          tw`bg-white p-4 rounded-xl border border-gray-200`,
          cardShadow,
        ]}
        activeOpacity={0.7}
        onPress={() => onPress(offer)}
        disabled={cancelling}
      >
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3`}>
              <Icon name="car" size={20} color={COLORS.PRIMARY} />
            </View>
            <Text style={[
              tw`text-base font-semibold`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              {offer.vehicletype_name || 'ขนส่งรถยนต์'}
            </Text>
          </View>
          
          <View style={tw`${statusInfo.bg} px-3 py-1.5 rounded-full flex-row items-center`}>
            <Icon name={statusInfo.icon} size={14} style={tw`${statusInfo.text} mr-1`} />
            <Text style={[
              tw`${statusInfo.text} text-xs`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        
        {/* Locations */}
        <View style={tw`bg-gray-50 p-3 rounded-lg mb-3`}>
          {/* Origin */}
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-8 items-center`}>
              <View style={tw`w-2 h-2 rounded-full bg-blue-500`} />
              <View style={tw`w-0.5 h-4 bg-gray-300 mt-1 mb-1`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[
                tw`text-xs text-gray-500 mb-0.5`,
                { fontFamily: FONTS.FAMILY.LIGHT }
              ]}>
                ต้นทาง
              </Text>
              <Text style={[
                tw`text-sm text-gray-800`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]} numberOfLines={1}>
                {truncateText(offer.location_from || 'ไม่ระบุต้นทาง', 30)}
              </Text>
            </View>
          </View>
          
          {/* Destination */}
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-8 items-center`}>
              <View style={tw`w-2 h-2 rounded-full bg-green-500`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[
                tw`text-xs text-gray-500 mb-0.5`,
                { fontFamily: FONTS.FAMILY.LIGHT }
              ]}>
                ปลายทาง
              </Text>
              <Text style={[
                tw`text-sm text-gray-800`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]} numberOfLines={1}>
                {truncateText(offer.location_to || 'ไม่ระบุปลายทาง', 30)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center`}>
            <Icon name="calendar-clock" size={16} color={COLORS.GRAY_500} />
            <Text style={[
              tw`ml-1.5 text-xs text-gray-500`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              {formatDate(offer.created_at)}
            </Text>
            
            {distance && (
              <View style={tw`flex-row items-center ml-3`}>
                <Icon name="map-marker-distance" size={16} color={COLORS.GRAY_500} />
                <Text style={[
                  tw`ml-1 text-xs text-gray-500`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}>
                  {distance} กม.
                </Text>
              </View>
            )}
          </View>
          
          <View style={tw`flex-row items-center`}>
            <Text style={[
              tw`text-base font-bold text-green-600`,
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}>
              {formatCurrency(offer.offered_price)}
            </Text>
            <Icon name="chevron-right" size={20} color={COLORS.GRAY_400} style={tw`ml-1`} />
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Cancel button - แสดงเฉพาะข้อเสนอที่มีสถานะ pending */}
      {offer.offer_status === 'pending' && (
        <TouchableOpacity
          style={tw`absolute -top-2 -right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow-md z-10`}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon name="close" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Empty State Component
const EmptyState = () => (
  <View style={tw`bg-gray-50 rounded-xl p-8 items-center justify-center border border-gray-200`}>
    <View style={tw`w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3`}>
      <Icon name="inbox-outline" size={32} color={COLORS.GRAY_400} />
    </View>
    <Text style={[
      tw`text-gray-700 text-base text-center mb-1`,
      { fontFamily: FONTS.FAMILY.MEDIUM }
    ]}>
      ไม่มีข้อเสนองาน
    </Text>
    <Text style={[
      tw`text-gray-500 text-sm text-center`,
      { fontFamily: FONTS.FAMILY.REGULAR }
    ]}>
      ขณะนี้คุณไม่มีข้อเสนองานที่รอการตอบรับ
    </Text>
  </View>
);

// Main Component
const OffersSection = ({ 
  offers: apiResponse, 
  isLoading, 
  onOfferCancel,
  userData, // เพิ่ม userData
  maxVisible = 1 // จำนวนข้อเสนอที่จะแสดงเริ่มต้น
}) => {
  // สถานะการแสดงข้อเสนอทั้งหมด
  const [showAll, setShowAll] = useState(false);
  const navigation = useNavigation();
  
  // แยกข้อมูลจาก API response
  const offers = apiResponse?.Result || [];
  const offerCount = apiResponse?.Count || 0;
  
  // กำหนดข้อเสนอที่จะแสดง
  const displayedOffers = showAll ? offers : offers.slice(0, maxVisible);
  
  // ฟังก์ชันยกเลิกข้อเสนอ
  const handleCancelOffer = async (offerId) => {
    try {
      // ส่ง body ตามรูปแบบที่กำหนด
      const response = await postRequest(API_ENDPOINTS.JOBS.CANCEL_OFFER, {
        offer_id: offerId,
        driver_id: userData?.driver_id // เพิ่ม driver_id ตามที่ต้องการ
      });
      
      if (response && response.Status) {
        // ถ้ายกเลิกสำเร็จ ให้ดึงข้อมูลใหม่
        if (onOfferCancel) onOfferCancel(offerId);
        return true;
      } else {
        throw new Error(response?.Message || 'Failed to cancel offer');
      }
    } catch (error) {
      console.error('Error cancelling offer:', error);
      throw error;
    }
  };

  // ฟังก์ชันจัดการเมื่อกดที่ offer
  const handleOfferPress = (offer) => {
    // ตรวจสอบสถานะของข้อเสนอ
    if (offer.offer_status === 'accepted') {
      // ถ้าเป็นสถานะ accepted ให้นำทางไปยังหน้า JobWorkingPickupScreen
      navigation.navigate('JobWorkingPickup', {
        request_id: offer.request_id,
        userData
      });
    } else if (offer.offer_status === 'pending') {
      // สำหรับสถานะ pending อาจจะแสดงรายละเอียดเพิ่มเติมหรือไม่ทำอะไร
      Alert.alert(
        "ข้อเสนอรอการตอบรับ",
        "ข้อเสนอนี้กำลังรออยู่ในระบบ คุณจะได้รับการแจ้งเตือนเมื่อลูกค้าตอบรับ"
      );
    } else {
      // สำหรับสถานะอื่นๆ อาจจะแสดงข้อความตามสถานะ
      Alert.alert(
        "ข้อมูลข้อเสนอ",
        `ข้อเสนอนี้มีสถานะ: ${offer.offer_status === 'rejected' ? 'ถูกปฏิเสธ' : 
          offer.offer_status === 'expired' ? 'หมดอายุ' : offer.offer_status}`
      );
    }
  };

  // ฟังก์ชันสลับการแสดงข้อเสนอทั้งหมด
  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <View style={tw`p-5`}>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={[
          tw`text-xl`,
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}>
          ข้อเสนอที่รอการตอบรับ {offerCount > 0 ? `(${offerCount})` : ''}
        </Text>
        
        {offers.length > maxVisible && (
          <TouchableOpacity 
            style={tw`flex-row items-center`}
            onPress={toggleShowAll}
          >
            <Text style={[
              tw`text-sm text-green-600 mr-1`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}>
              {showAll ? 'แสดงน้อยลง' : 'ดูทั้งหมด'}
            </Text>
            <Icon 
              name={showAll ? "chevron-up" : "chevron-down"}
              size={16} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={tw`bg-gray-50 rounded-xl p-10 items-center justify-center border border-gray-200`}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={[
            tw`text-gray-500 mt-3`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}>
            กำลังโหลดข้อเสนองาน...
          </Text>
        </View>
      ) : offers.length === 0 ? (
        <EmptyState />
      ) : (
        <View>
          {displayedOffers.map((item, index) => (
            <OfferItem 
              key={item.offer_id?.toString() || `offer-${index}`}
              offer={item} 
              onPress={handleOfferPress}
              onCancel={handleCancelOffer}
              index={index} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default OffersSection;