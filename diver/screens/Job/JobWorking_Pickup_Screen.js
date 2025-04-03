import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import tw from "twrnc";
import { useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons"; // ใช้ MaterialIcons
import { IP_ADDRESS } from "../../config";
import SubmitButton from "../../components/SubmitButton";
import ConfirmationDialog from "../../components/ConfirmationDialog";

export default function JobWorking_Pickup_Screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { request_id, workStatus } = route.params || {};

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    // Fetch offer details
    const fetchOfferDetails = async () => {
      try {
        const response = await fetch(
          `http://${IP_ADDRESS}:3000/auth/getRequestDetailForDriver?request_id=${request_id}`
        );
        const data = await response.json();
        if (data && data.Status && data.Result.length > 0) {
          setOffer(data.Result[0]);
        } else {
          setOffer(null);
        }
      } catch (err) {
        setError("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    if (request_id) {
      fetchOfferDetails();
    }
  }, [request_id]);

  // Open Google Maps for navigation
  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const checkWorkSatus = () => {
    if (workStatus) {
      navigation.navigate("JobWorking_Dropoff", { request_id });
    }else{
      navigation.navigate("CarUploadPickUpConfirmation", { request_id })
    }
  }

  // Handle calling customer
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url);
    } else {
      Alert.alert("หมายเลขโทรศัพท์", "หมายเลขโทรศัพท์ไม่พร้อมใช้งาน");
    }
  };

  // Navigate to ChatScreen
  const handleChat = () => {
    navigation.navigate("ChatScreen", { room_id: request_id, user_name: offer.customer_name });
  };

  // Render loading indicator
  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text style={[styles.globalText, tw`text-red-500`]}>{error}</Text>
      </View>
    );
  }

  const confirmAction = () => {
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Scrollable content */}
      <ScrollView contentContainerStyle={tw`p-4`}>
        {/* Header Section */}
        <View style={tw`flex-row justify-between my-7`}>
          <TouchableOpacity onPress={() => Alert.alert("ยกเลิก", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้")}>
            <Text style={[styles.globalText, tw`text-lg text-[#60B876]`]}>ยกเลิกงาน</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("แจ้งปัญหา", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้")}>
            <Text style={[styles.globalText, tw`text-lg text-[#60B876]`]}>แจ้งปัญหา</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Information */}
        {offer ? (
          <View style={tw`p-4 bg-white shadow-md border border-gray-200 rounded-lg mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={[styles.globalText, tw`text-gray-800`]}>คุณ {offer.customer_name ? offer.customer_name : "ลูกค้า"}</Text>

              {/* ปุ่มโทรและปุ่มแชท */}
              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  style={tw`bg-[#60B876] w-7 h-7 rounded-full flex items-center justify-center mx-1`}
                  onPress={() => handleCall(offer.customer_phone)}
                >
                  <Icon name="call" size={15} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-[#60B876] w-7 h-7 rounded-full flex items-center justify-center mx-1`}
                  onPress={handleChat}
                >
                  <Icon name="chat" size={15} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={[styles.globalText, tw`text-center text-gray-500`]}>ไม่พบข้อมูลลูกค้า</Text>
        )}

        {/* Map Section */}
        {offer && offer.pickup_lat && offer.pickup_long && (
          <TouchableOpacity onPress={() => openGoogleMaps(offer.pickup_lat, offer.pickup_long)}>
            <View style={tw`flex bg-gray-300 items-center justify-center mb-4 rounded-lg h-70`}>
              <MapView
                style={{ width: "100%", height: "100%" }}
                initialRegion={{
                  latitude: parseFloat(offer.pickup_lat),
                  longitude: parseFloat(offer.pickup_long),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(offer.pickup_lat),
                    longitude: parseFloat(offer.pickup_long),
                  }}
                  title="จุดรับ"
                  description="ตำแหน่งที่ตั้งของการรับ"
                />
              </MapView>
            </View>
          </TouchableOpacity>
        )}

        {/* Address Details */}
        {offer && (
          <View>
            <Text style={[styles.globalText, tw`text-gray-700`]}>รายละเอียดที่อยู่</Text>
            <Text style={[styles.globalText, tw`text-gray-400 mb-4`]}>
              {offer.location_from || "ไม่มีข้อมูลเพิ่มเติม"}
            </Text>
            <Text style={[styles.globalText, tw`text-gray-700`]}>รายละเอียดเพิ่มเติม</Text>
            <Text style={[styles.globalText, tw`text-gray-400 mb-4`]}>
              {offer.customer_message || "ไม่มีรายละเอียดจากลูกค้า"}
            </Text>
          </View>
        )}
      </ScrollView>
      <ConfirmationDialog
      visible={isModalVisible}
      title={workStatus === undefined ? "ยืนยันถึงจุดรับรถ" : "ยืนยันการรับรถ"}
      message={workStatus === undefined ? "คุณต้องการยืนยันถึงจุดรับรถใช่หรือไม่?" : "คุณต้องการยืนยันการรับรถใช่หรือไม่?"}
      onConfirm={() => {
        setIsModalVisible(false);
        checkWorkSatus();
      }}
      onCancel={() => setIsModalVisible(false)}
    />

      {/* Confirmation Button */}
        <SubmitButton onPress={confirmAction} title={workStatus === undefined ? "ยืนยันถึงจุดรับรถ" : "ยืนยันการรับรถ"} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular", // Ensure this font is available in your project
  },
});
