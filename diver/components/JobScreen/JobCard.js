import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

export default function JobCard({ requestId, distance, origin, destination, type, time, message }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={tw`p-4 bg-white rounded-lg mb-4 shadow-lg`}
      onPress={() => navigation.navigate("JobDetail", { requestId, distance, origin, destination, type, message })}
    >
      <Text style={[styles.globalText, tw`text-gray-800 text-lg mb-4`]}>
        ระยะทางประมาณ {distance} กิโลเมตร
      </Text>

      <View style={tw`flex-row justify-between items-center mb-4`}>
        <View style={tw`flex-1 flex-row items-center`}>
          <Icon name="map-marker" size={20} color="green" />
          <Text style={[styles.globalText, tw`text-gray-600 ml-2 text-base`]}>
            {origin}
          </Text>
        </View>
        <View style={tw`flex-1 flex-row items-center justify-end`}>
          <Icon name="map-marker" size={20} color="red" />
          <Text style={[styles.globalText, tw`text-gray-600 ml-2 text-base`]}>
            {destination}
          </Text>
        </View>
      </View>

      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={[styles.globalText, tw`flex-1 text-gray-500 text-sm`]}>ประเภท: {type}</Text>
        <Text style={[styles.globalText, tw`flex-1 text-gray-500 text-sm text-right`]}>
          เวลาเริ่มงาน: {time || "ไม่ระบุ"}
        </Text>
      </View>

      {message && (
        <Text style={[styles.globalText, tw`text-gray-600`]}>ข้อความลูกค้า: {message}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular", // ใช้ฟอนต์ Mitr-Regular หรือฟอนต์ที่ตั้งค่าไว้
  },
});
