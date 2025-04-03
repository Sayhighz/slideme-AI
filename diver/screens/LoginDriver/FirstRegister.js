import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import tw from "twrnc";
import Icon from "react-native-vector-icons/Ionicons";
import { IP_ADDRESS } from "../../config";
import SubmitButton from "../../components/SubmitButton";

const FirstRegister = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const dynamicFontSize = (size) => Math.max(16, (size * width) / 375);
  const { width } = Dimensions.get("window");

  const provinces = [
    { label: "กรุงเทพมหานคร", value: "bangkok" },
    { label: "เชียงใหม่", value: "chiangmai" },
    { label: "ภูเก็ต", value: "phuket" },
    { label: "ชลบุรี", value: "chonburi" },
    { label: "นครราชสีมา", value: "korat" },
  ];

  const vehicleTypes = [
    { label: "รถสไลด์มาตรฐาน", value: "standard_slide" },
    { label: "รถสไลด์ขนาดใหญ่", value: "heavy_duty_slide" },
    { label: "รถสไลด์สำหรับรถหรู", value: "luxury_slide" },
    { label: "รถสไลด์ฉุกเฉิน", value: "emergency_slide" },
  ];

  const checkPhoneNumberExists = async (phone) => {
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/auth/check_user_phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone }),
        }
      );
      const data = await response.json();
      return data.Exists;
    } catch (error) {
      Alert.alert("Error", "Unable to check phone number");
      console.error(error);
      return false;
    }
  };

  const handleRegisterPress = async () => {
    if (phoneNumber.length !== 10 || isNaN(phoneNumber)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกเบอร์โทรศัพท์ที่มีความยาว 10 ตัวเลข");
      return;
    }

    const phoneExists = await checkPhoneNumberExists(phoneNumber);
    if (phoneExists) {
      Alert.alert("ข้อผิดพลาด", "เบอร์โทรนี้ถูกใช้ไปแล้ว");
      return;
    }

    if (!phoneNumber || !selectedProvince || !selectedVehicleType) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (!isTermsAccepted) {
      Alert.alert("ข้อผิดพลาด", "กรุณายอมรับเงื่อนไขก่อนสมัคร");
      return;
    }

    navigation.navigate("SecondRegister", {
      phoneNumber,
      selectedProvince,
      selectedVehicleType,
    });
    console.log(
      `Phone: ${phoneNumber}, Province: ${selectedProvince}, Vehicle: ${selectedVehicleType}`
    );
  };

  const handleBackPress = () => {
    navigation.navigate("HomeLogin");
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={tw`p-4`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={tw`absolute top-10 left-4 z-50`}>
            <TouchableOpacity onPress={handleBackPress}>
              <Icon name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={tw`flex-1 justify-center items-center`}>
          <View style={tw`flex-1 justify-center items-center mt-5`}>
            <Text
              style={[
                styles.globalText,
                tw.style("text-center", {
                  fontSize: dynamicFontSize(52),
                  color: "#60B876",
                  lineHeight: dynamicFontSize(58),
                }),
              ]}
            >
              SLIDE
            </Text>
            <Text
              style={[
                styles.globalText,
                tw.style("text-center", {
                  fontSize: dynamicFontSize(80),
                  color: "#60B876",
                  lineHeight: dynamicFontSize(88),
                }),
              ]}
            >
              ME
            </Text>
            <Text
              style={[
                styles.globalText,
                tw.style("text-lg text-[#60B876]", {
                  lineHeight: dynamicFontSize(24),
                }),
              ]}
            >
              สมัครเป็นคนขับ
            </Text>
          </View>
</View>


          <View style={tw`flex-1`}>
            <Text style={[styles.globalText, tw`text-lg mb-2`]}>
              เบอร์โทรศัพท์
            </Text>
            <TextInput
              placeholder="เบอร์โทรศัพท์"
              style={[styles.input, tw`mb-4`]}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
            <Text style={[styles.globalText, tw`text-lg mb-2`]}>
              เลือกจังหวัด
            </Text>
            <View style={[styles.pickerContainer, tw`mb-4`]}>
              <RNPickerSelect
                onValueChange={(value) => setSelectedProvince(value)}
                items={provinces}
                placeholder={{ label: "กรุณาเลือกจังหวัด", value: null }}
                useNativeAndroidPickerStyle={false}
                style={{
                  inputIOS: styles.pickerText,
                  inputAndroid: styles.pickerText,
                  placeholder: styles.placeholderText,
                }}
              />
            </View>
            <Text style={[styles.globalText, tw`text-lg mb-2`]}>
              เลือกประเภทรถ
            </Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={(value) => setSelectedVehicleType(value)}
                items={vehicleTypes}
                placeholder={{ label: "กรุณาเลือกประเภทรถ", value: null }}
                useNativeAndroidPickerStyle={false}
                style={{
                  inputIOS: styles.pickerText,
                  inputAndroid: styles.pickerText,
                  placeholder: styles.placeholderText,
                }}
              />
            </View>
            <TouchableOpacity
              style={tw`flex-row items-center mt-4`}
              onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            >
              <View
                style={tw`w-6 h-6 border-2 border-gray-300 rounded mr-2 ${
                  isTermsAccepted ? "bg-green-500" : "bg-white"
                }`}
              />
              <Text style={[styles.globalText]}>ยอมรับเงื่อนไข SLIDEME</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {/* Fixed Next Button */}
      </KeyboardAvoidingView>
        <SubmitButton
          onPress={handleRegisterPress}
          title="สมัครเป็นคนขับ"
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
  input: {
    borderWidth: 2,
    borderColor: "#d1d1d1",
    borderRadius: 8,
    padding: 12,
    fontFamily: "Mitr-Regular",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#d1d1d1",
    borderRadius: 8,
    justifyContent: "center",
    height: 48,
  },
  pickerText: {
    fontFamily: "Mitr-Regular",
    padding: 12,
    color: "black",
  },
  placeholderText: {
    fontFamily: "Mitr-Regular",
    color: "gray",
  },
});

export default FirstRegister;
