import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import tw from "twrnc";
import { postRequest } from "../../lib/axios"; // นำเข้า postRequest
import JobHeader from "../../components/JobDetail/JobHeader";
import JobInfo from "../../components/JobDetail/JobInfo";
import JobType from "../../components/JobDetail/JobType";
import JobPriceInput from "../../components/JobDetail/JobPriceInput";
import JobConfirmationDialog from "../../components/JobDetail/JobConfirmationDialog";

export default function JobDetailScreen({ route, navigation }) {
  const { distance, origin, destination, type, message, requestId } = route.params;
  const { userData = {} } = route.params || {};

  const [offeredPrice, setOfferedPrice] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOfferSubmit = async () => {
    if (!offeredPrice) {
      Alert.alert("ข้อผิดพลาด", "โปรดกรอกราคาที่ต้องการ");
      return;
    }

    try {
      const result = await postRequest("driver/offer_price", {
        request_id: requestId,
        driver_id: userData?.driver_id,
        offered_price: parseFloat(offeredPrice.replace(/,/g, "")), // แปลงค่าก่อนส่ง
      });

      console.log("asdasd",requestId, userData?.driver_id, parseFloat(offeredPrice.replace(/,/g, "")));

      if (result.Status) {
        navigation.navigate("HomeMain");
      } else {
        Alert.alert("ข้อผิดพลาด", result.message || "เสนอราคาไม่สำเร็จ");
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเสนอราคา");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-gray-100`} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={tw`p-4`} keyboardShouldPersistTaps="handled">
        <JobHeader distance={distance} onBack={() => navigation.goBack()} />
        <JobInfo origin={origin} destination={destination} message={message} />
        <JobType type={type} />
        <JobPriceInput
          offeredPrice={offeredPrice}
          onPriceChange={setOfferedPrice}
          onConfirm={() => setIsModalVisible(true)}
        />
      </ScrollView>
      <JobConfirmationDialog
        visible={isModalVisible}
        message={`คุณต้องการเสนอราคา ${offeredPrice} ใช่หรือไม่?`}
        onConfirm={() => {
          setIsModalVisible(false);
          handleOfferSubmit();
        }}
        onCancel={() => setIsModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
