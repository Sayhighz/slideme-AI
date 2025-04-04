import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import tw from "twrnc";
import { postRequest } from "../../services/api";
import { API_ENDPOINTS, MESSAGES } from "../../constants";

// Import components
import JobHeader from "../../components/job/JobHeader";
import JobInfo from "../../components/job/JobInfo";
import JobType from "../../components/job/JobType";
import JobPriceInput from "../../components/job/JobPriceInput";
import JobConfirmationDialog from "../../components/job/JobConfirmationDialog";

export default function JobDetailScreen({ route, navigation }) {
  const { distance, origin, destination, type, message, requestId } = route.params;
  const { userData = {} } = route.params || {};

  const [offeredPrice, setOfferedPrice] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOfferSubmit = async () => {
    if (!offeredPrice) {
      Alert.alert(
        "ข้อผิดพลาด", 
        MESSAGES.ERRORS.VALIDATION
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postRequest(API_ENDPOINTS.JOBS.OFFER_PRICE, {
        request_id: requestId,
        driver_id: userData?.driver_id,
        offered_price: parseFloat(offeredPrice.replace(/,/g, "")),
      });

      if (result.Status) {
        Alert.alert("สำเร็จ", MESSAGES.SUCCESS.OFFER);
        navigation.navigate("HomeMain");
      } else {
        Alert.alert(
          "ข้อผิดพลาด", 
          result.message || "เสนอราคาไม่สำเร็จ"
        );
      }
    } catch (error) {
      Alert.alert(
        "ข้อผิดพลาด", 
        MESSAGES.ERRORS.CONNECTION
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={tw`flex-1 bg-gray-100`} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={tw`p-4`} 
        keyboardShouldPersistTaps="handled"
      >
        <JobHeader 
          distance={distance} 
          onBack={() => navigation.goBack()} 
        />
        <JobInfo 
          origin={origin} 
          destination={destination} 
          message={message} 
        />
        <JobType type={type} />
        <JobPriceInput
          offeredPrice={offeredPrice}
          onPriceChange={setOfferedPrice}
          onConfirm={() => setIsModalVisible(true)}
          disabled={isSubmitting}
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