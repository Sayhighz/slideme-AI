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
} from "react-native";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getRequest } from "../../services/api";
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from "../../constants";

// Import components
import SubmitButton from "../../components/common/SubmitButton";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";

export default function JobWorkingPickupScreen({ route }) {
  const navigation = useNavigation();
  const { request_id, workStatus } = route.params || {};
  const { userData = {} } = route.params || {};

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        const response = await getRequest(
          `${API_ENDPOINTS.JOBS.GET_DETAIL}?request_id=${request_id}`
        );
        
        if (response && response.Status && response.Result.length > 0) {
          setOffer(response.Result[0]);
        } else {
          setOffer(null);
        }
        setError(null);
      } catch (err) {
        setError("ไม่สามารถดึงข้อมูลได้");
        console.error("Error fetching offer details:", err);
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

  // Handle next step based on work status
  const checkWorkStatus = () => {
    if (workStatus) {
      // If workStatus is true, it means photos have been uploaded, go to dropoff
      navigation.navigate("JobWorkingDropoff", { 
        request_id,
        userData 
      });
    } else {
      // If workStatus is not defined or false, go to photo upload first
      navigation.navigate("CarUploadPickUpConfirmation", { 
        request_id,
        userData
      });
    }
  };

  // Handle calling customer
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url);
    } else {
      Alert.alert("หมายเลขโทรศัพท์", "หมายเลขโทรศัพท์ไม่พร้อมใช้งาน");
    }
  };

  // Navigate to chat screen
  const handleChat = () => {
    navigation.navigate("ChatScreen", { 
      room_id: request_id, 
      user_name: offer?.customer_name,
      phoneNumber: offer?.customer_phone 
    });
  };

  // Show confirmation dialog
  const confirmAction = () => {
    setIsModalVisible(true);
  };

  // Render loading state
  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text 
          style={[
            tw`text-red-500`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView contentContainerStyle={tw`p-4`}>
        {/* Header Section */}
        <View style={tw`flex-row justify-between my-7`}>
          <TouchableOpacity onPress={() => Alert.alert("ยกเลิกงาน", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้")}>
            <Text 
              style={[
                tw`text-lg text-[${COLORS.PRIMARY}]`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              ยกเลิกงาน
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("แจ้งปัญหา", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้")}>
            <Text 
              style={[
                tw`text-lg text-[${COLORS.PRIMARY}]`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              แจ้งปัญหา
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Information */}
        {offer ? (
          <View style={tw`p-4 bg-white shadow-md border border-gray-200 rounded-lg mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text 
                style={[
                  tw`text-gray-800`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                คุณ {offer.customer_name ? offer.customer_name : "ลูกค้า"}
              </Text>

              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  style={tw`bg-[${COLORS.PRIMARY}] w-7 h-7 rounded-full flex items-center justify-center mx-1`}
                  onPress={() => handleCall(offer.customer_phone)}
                >
                  <Icon name="call" size={15} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-[${COLORS.PRIMARY}] w-7 h-7 rounded-full flex items-center justify-center mx-1`}
                  onPress={handleChat}
                >
                  <Icon name="chat" size={15} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text 
            style={[
              tw`text-center text-gray-500`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ไม่พบข้อมูลลูกค้า
          </Text>
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
            <Text 
              style={[
                tw`text-gray-700`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              รายละเอียดที่อยู่
            </Text>
            <Text 
              style={[
                tw`text-gray-400 mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {offer.location_from || "ไม่มีข้อมูลเพิ่มเติม"}
            </Text>
            <Text 
              style={[
                tw`text-gray-700`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              รายละเอียดเพิ่มเติม
            </Text>
            <Text 
              style={[
                tw`text-gray-400 mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {offer.customer_message || "ไม่มีรายละเอียดจากลูกค้า"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={isModalVisible}
        title={workStatus === undefined ? "ยืนยันถึงจุดรับรถ" : "ยืนยันการรับรถ"}
        message={workStatus === undefined ? "คุณต้องการยืนยันถึงจุดรับรถใช่หรือไม่?" : "คุณต้องการยืนยันการรับรถใช่หรือไม่?"}
        onConfirm={() => {
          setIsModalVisible(false);
          checkWorkStatus();
        }}
        onCancel={() => setIsModalVisible(false)}
      />

      {/* Submit Button */}
      <SubmitButton 
        onPress={confirmAction} 
        title={workStatus === undefined ? "ยืนยันถึงจุดรับรถ" : "ยืนยันการรับรถ"} 
      />
    </SafeAreaView>
  );
}