import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Dimensions 
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS } from '../../constants';

const { width } = Dimensions.get('window');

const OfferAcceptedModal = ({ visible, offer, onClose, onStartJob }) => {
  if (!offer) return null;
  
  // ข้อมูลที่จะแสดงใน modal
  const customerName = offer.customer_name || `${offer.customer_first_name || ''} ${offer.customer_last_name || ''}`.trim() || 'ลูกค้า';
  const price = offer.offered_price || '0.00';
  const location = {
    from: offer.location_from || 'ไม่ระบุ',
    to: offer.location_to || 'ไม่ระบุ'
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={[tw`bg-white rounded-xl p-5`, styles.modalContainer]}>
          {/* หัวข้อ */}
          <View style={tw`flex-row items-center justify-center mb-4`}>
            <Icon name="check-circle" size={32} color={COLORS.SUCCESS} style={tw`mr-2`} />
            <Text style={[tw`text-xl`, { fontFamily: FONTS.FAMILY.MEDIUM, color: COLORS.SUCCESS }]}>
              ข้อเสนอได้รับการยอมรับ!
            </Text>
          </View>
          
          {/* ข้อมูลลูกค้า */}
          <View style={tw`bg-gray-100 rounded-lg p-4 mb-4`}>
            <Text style={[tw`text-lg mb-1`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
              คุณ {customerName}
            </Text>
            <View style={tw`flex-row items-center`}>
              <Icon name="cash" size={16} color={COLORS.PRIMARY} style={tw`mr-1`} />
              <Text style={[tw`text-base text-gray-700`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                ฿{price}
              </Text>
            </View>
          </View>
          
          {/* ข้อมูลเส้นทาง */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Icon name="map-marker" size={20} color={COLORS.PRIMARY} style={tw`mr-2`} />
              <Text style={[tw`flex-1 text-base`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                {location.from}
              </Text>
            </View>
            <View style={tw`border-l-2 border-gray-300 h-6 ml-2.5`} />
            <View style={tw`flex-row items-center`}>
              <Icon name="map-marker" size={20} color="red" style={tw`mr-2`} />
              <Text style={[tw`flex-1 text-base`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                {location.to}
              </Text>
            </View>
          </View>
          
          {/* ปุ่มดำเนินการ */}
          <View style={tw`flex-row mt-2`}>
            <TouchableOpacity 
              style={[tw`flex-1 mr-2 py-3 rounded-xl bg-gray-200`, styles.button]}
              onPress={onClose}
            >
              <Text style={[tw`text-center text-gray-700`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
                ดูภายหลัง
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[tw`flex-1 ml-2 py-3 rounded-xl`, styles.primaryButton]}
              onPress={() => onStartJob(offer)}
            >
              <Text style={[tw`text-center text-white`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
                เริ่มงานทันที
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  }
});

export default OfferAcceptedModal;