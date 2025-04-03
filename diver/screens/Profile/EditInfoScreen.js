import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { IP_ADDRESS } from "../../config";

export default function EditInfoScreen({ navigation, route }) {
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const { userData = {} } = route.params || {};

  // Format input to YYYY-MM-DD
  const formatDateString = (input) => {
    const cleaned = input.replace(/[^0-9]/g, ""); // Remove non-numeric characters
    let formatted = "";

    if (cleaned.length >= 5) {
      formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}`;
    } else if (cleaned.length >= 1) {
      formatted = cleaned.substring(0, 4);
    }

    if (cleaned.length >= 7) {
      formatted += `-${cleaned.substring(6, 8)}`;
    }

    return formatted;
  };

  // Handle input change and format date
  const handleInputChange = (input) => {
    const formatted = formatDateString(input);
    setLicenseExpiryDate(formatted);
  };

  // Validate date format
  const validateDateFormat = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD format
    return regex.test(date);
  };

  // Save updated license expiry date
  const handleSave = async () => {
    if (!validateDateFormat(licenseExpiryDate)) {
      Alert.alert("เกิดข้อผิดพลาด", "โปรดใส่วันที่ในรูปแบบที่ถูกต้อง (ปปปป-ดด-วว)");
      return;
    }

    if (!userData?.driver_id) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้");
      return;
    }

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/driver/edit_profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver_id: userData?.driver_id,
            id_expiry_date: licenseExpiryDate,
          }),
        }
      );

      const data = await response.json();

      if (data.Status) {
        Alert.alert("สำเร็จ", "แก้ไขข้อมูลสำเร็จ");
        navigation.goBack();
      } else {
        Alert.alert("เกิดข้อผิดพลาด", data.Error || "การแก้ไขข้อมูลล้มเหลว");
      }
    } catch (error) {
      console.error("Error updating data:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  return (
    <SafeAreaView
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
      ]}
    >
      {/* Header Section */}
      <View style={tw`flex-row items-center p-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} style={tw`text-gray-800`} />
        </TouchableOpacity>
        <Text style={[styles.globalText, tw`text-xl text-gray-800 ml-4`]}>
          แก้ไขข้อมูล
        </Text>
      </View>

      {/* Content Section */}
      <View style={tw`flex-1 px-4`}>
        {/* License Expiry Input */}
        <TextInput
          style={[
            tw`border border-gray-300 rounded p-3 mt-4`,
            styles.globalText,
          ]}
          placeholder="วันหมดอายุใบขับขี่ (ปปปป-ดด-วว)"
          value={licenseExpiryDate}
          onChangeText={handleInputChange}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {/* Confirm Button */}
      <View style={tw`px-4 py-4`}>
        <TouchableOpacity
          style={tw`w-full py-3 bg-[#60B876] rounded`}
          onPress={handleSave}
        >
          <Text style={[styles.globalText, tw`text-center text-base text-white`]}>
            ยืนยัน
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Font styles
const styles = {
  globalText: {
    fontFamily: "Mitr-Regular",
  },
};
