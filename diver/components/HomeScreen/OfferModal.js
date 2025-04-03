import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

const OfferModal = ({ visible, selectedOffer, onClose, onCancelOffer }) => {
  // Helper function: แปลงจำนวนเงินให้มี comma คั่นหลัก
  const formatNumberWithCommas = (number) => {
    if (isNaN(number)) return number;
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function: จัดรูปแบบสถานะของข้อเสนอ
  const getFormattedStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <Text style={[styles.globalText, tw`text-yellow-500 text-xs`]}>
            รออนุมัติ
          </Text>
        );
      case "accepted":
        return (
          <Text style={[styles.globalText, tw`text-green-500 text-xs`]}>
            อยู่ระหว่างการทำงาน
          </Text>
        );
      default:
        return <Text style={styles.globalText}>{status}</Text>;
    }
  };

  if (!selectedOffer) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-4/5 bg-white p-6 rounded-lg shadow-lg`}>
          <Text style={[styles.globalText, tw`text-lg mb-2 text-center`]}>
            รายละเอียดข้อเสนอ
          </Text>
          <Text style={[styles.globalText]}>
            <Icon name="map-marker" size={20} color="green" />
            ต้นทาง:
          </Text>
          <Text style={[styles.globalText, tw`text-gray-400 mb-3`]}>
            {selectedOffer.location_from}
          </Text>
          <Text style={[styles.globalText]}>
            <Icon name="map-marker" size={20} color="red" />
            ปลายทาง:
          </Text>
          <Text style={[styles.globalText, tw`text-gray-400`]}>
            {selectedOffer.location_to}
          </Text>
          <Text style={[styles.globalText, tw`mb-1`]}>
            ประเภท: {selectedOffer.vehicle_type}
          </Text>
          <Text style={[styles.globalText, tw`mb-1`]}>
            ราคาที่เสนอ:{" "}
            {selectedOffer.offered_price
              ? `฿${formatNumberWithCommas(selectedOffer.offered_price)}`
              : "N/A"}
          </Text>
          <Text style={[styles.globalText, tw`mb-4`]}>
            สถานะ: {getFormattedStatus(selectedOffer.offer_status)}
          </Text>
          <TouchableOpacity
            style={tw`bg-red-500 p-3 rounded-lg items-center`}
            onPress={() => onCancelOffer(selectedOffer.offer_id)}
          >
            <Text style={[styles.globalText, tw`text-white`]}>
              ยกเลิกข้อเสนอ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`mt-4 bg-gray-300 p-3 rounded-lg items-center`}
            onPress={onClose}
          >
            <Text style={[styles.globalText, tw`text-black`]}>
              ปิด
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default OfferModal;
