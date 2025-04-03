import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { IP_ADDRESS } from "../../config"; // ปรับ path ตามโครงสร้างโปรเจคของคุณ

export default function Header({ userData, driverScore }) {
  return (
    <View style={tw`flex-row items-center mt-10 p-2 w-19/20 mx-auto`}>
      <Image
        source={{
          uri: `http://${IP_ADDRESS}:4000/auth/fetch_image?filename=`,
        }}
        style={tw`w-24 h-24 rounded-full border-2 border-green-400`}
      />
      <View style={tw`ml-4`}>
        <Text style={[styles.globalText, tw`text-sm text-gray-400`]}>
          สวัสดี!
        </Text>
        <Text style={[styles.globalText, tw`text-2xl text-[#60B876]`]}>
          {`${userData?.first_name || "ไม่พบข้อมูล"} ${userData?.last_name || ""}`}
        </Text>
        <View style={tw`flex-row items-center`}>
          <MaterialIcons
            name="star"
            size={24}
            color="orange"
            style={tw`mr-1`}
          />
          <Text style={[styles.globalText, tw`text-lg text-gray-700`]}>
            {"0.0"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
