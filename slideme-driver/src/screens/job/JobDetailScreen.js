import React, { useState, useEffect } from "react";
import { 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  View,
  TouchableWithoutFeedback
} from "react-native";
import tw from "twrnc";
import { postRequest } from "../../services/api";
import { API_ENDPOINTS, MESSAGES, COLORS } from "../../constants";

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Listen for keyboard events to adjust UI
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle offer submission
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
      // Clean the price string (remove commas)
      const cleanPrice = offeredPrice.replace(/,/g, "");
      
      const result = await postRequest(API_ENDPOINTS.JOBS.CREATE_OFFER, {
        request_id: requestId,
        driver_id: userData?.driver_id,
        offered_price: parseFloat(cleanPrice),
      });

      if (result.Status) {
        Alert.alert(
          "สำเร็จ", 
          MESSAGES.SUCCESS.OFFER,
          [{ text: "ตกลง", onPress: () => navigation.navigate("HomeMain") }]
        );
      } else {
        Alert.alert(
          "ข้อผิดพลาด", 
          result.message || "เสนอราคาไม่สำเร็จ"
        );
      }
    } catch (error) {
      console.error("API error:", error);
      Alert.alert(
        "ข้อผิดพลาด", 
        MESSAGES.ERRORS.CONNECTION
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dismiss keyboard when tapping outside input
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      style={[tw`flex-1 bg-gray-100`, styles.container]} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          contentContainerStyle={tw`pb-6`} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <JobHeader 
            distance={distance} 
            onBack={() => navigation.goBack()} 
          />
          
          <View style={tw`px-4`}>
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
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      
      {/* Confirmation Dialog */}
      <JobConfirmationDialog
        visible={isModalVisible}
        message={`คุณต้องการเสนอราคา ${offeredPrice} บาท สำหรับการเดินทาง ${distance} ใช่หรือไม่?`}
        onConfirm={() => {
          setIsModalVisible(false);
          handleOfferSubmit();
        }}
        onCancel={() => setIsModalVisible(false)}
      />
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={tw`absolute inset-0 bg-black bg-opacity-30 items-center justify-center`}>
          <View style={tw`bg-white p-4 rounded-xl`}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F7FA"
  }
});