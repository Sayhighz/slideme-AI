// NotificationRequest.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
// import TrackPlayer from 'react-native-track-player'; // Import TrackPlayer if needed
import { IP_ADDRESS } from "../config";

export default function NotificationRequest({ driver_id, status }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const navigation = useNavigation();
  const [hasShownModal, setHasShownModal] = useState(status);
  console.log(hasShownModal);

  const checkForNewRequest = async () => {
    if (hasShownModal) return; // Prevent further checks once the modal is shown

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/driver/notifications?driver_id=${driver_id}`
      );
      const data = await response.json();

      if (data.Status && data.Result && data.Result.length > 0) {
        const newRequest = data.Result[0];
        setRequestData({
          request_id: newRequest.request_id,
          origin: newRequest.orgin,
          destination: newRequest.destination,
          price: `฿${formatNumberWithCommas(newRequest.profit)}`,
        });
        setModalVisible(true);
        setHasShownModal(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch new requests.");
      console.error(error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewRequest();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [hasShownModal]);

  const closeModal = () => {
    setModalVisible(false);
    setRequestData(null);
  };

  const rejectAllOffers = async () => {
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/driver/reject_all_offers`,
        {
          method: "POST", // Use POST method; adjust if different
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ driver_id }), // Send driver_id as payload
        }
      );
      const data = await response.json();
      console.log("Reject all offers response:", data);

      if (data.Status == true) {
        Alert.alert("คุณได้รับงานแล้ว", "ระบบจะยกเลิกข้อเสนอทั้งหมด");
      } else {
        Alert.alert("Error", "Failed to reject all offers.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while rejecting offers.");
      console.error(error);
    }
  };

  const startJob = async () => {
    await rejectAllOffers(); // Reject all offers before starting the job
    closeModal();
    navigation.navigate("JobWorking_Pickup", {
      request_id: requestData?.request_id,
    });
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View
        style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
      >
        <View style={tw`w-4/5 bg-white p-6 rounded-lg`}>
          <Text style={[tw`text-3xl mb-2 text-center`, styles.globalText]}>
            ยินดีด้วย!
          </Text>
          <Text style={[tw`text-gray-600 mb-4 text-center`, styles.globalText]}>
            ลูกค้ารับข้อเสนอของคุณแล้ว
          </Text>

          {requestData && (
            <View
              style={tw`p-4 py-6 bg-white shadow-md border border-gray-200 rounded-lg mb-4`}
            >
              <View style={tw`flex items-start mb-2`}>
                <View style={tw`flex-row items-center`}>
                <Icon name="map-marker" size={20} color="green" />
                <Text style={[tw`text-black text-lg`, styles.globalText]}>
                  จุดรับรถ
                </Text>
                </View>
                <Text style={[tw`ml-2 text-gray-600`, styles.globalText]}>
                  {requestData.origin}
                </Text>
              </View>
              <View style={tw`flex items-start mb-2`}>
                <View style={tw`flex-row items-center`}>
                <Icon name="map-marker" size={20} color="red" />
                <Text style={[tw`text-black text-lg`, styles.globalText]}>
                  จุดส่งรถ
                </Text>
                </View>
                <Text style={[tw`ml-2 text-gray-600`, styles.globalText]}>
                  {requestData.destination}
                </Text>
              </View>
            </View>
          )}

          <Text style={[tw`text-lg mb-4`, styles.globalText]}>
            รายได้ {requestData?.price}
          </Text>

          <TouchableOpacity
            style={tw`bg-[#60B876] rounded px-4 py-2 items-center`}
            onPress={startJob}
          >
            <Text style={[tw`text-white text-lg`, styles.globalText]}>
              เริ่มงาน
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular", // Use your custom font
  },
});
