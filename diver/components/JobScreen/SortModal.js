import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import tw from "twrnc";

export default function SortModal({ visible, setSortCriteria, sortCriteria, onClose }) {
  const sortOptions = [
    { label: "ล่าสุด-เก่า", value: "latest" },
    { label: "เก่า-ล่าสุด", value: "oldest" },
    { label: "ระยะรับรถใกล้กับจุดส่งที่สุด", value: "shortest" },
    { label: "ระยะส่งรถไกลกับจุดรับที่สุด", value: "longest" },
  ];

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-3/4 p-4 rounded-lg`}>
          <Text style={[styles.globalText, tw`text-lg text-center mb-4`]}>เลือกการเรียงลำดับ</Text>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[tw`p-2 rounded-lg mb-2`, sortCriteria === option.value ? tw`bg-blue-500` : tw`bg-gray-200`]}
              onPress={() => {
                setSortCriteria(option.value);
                onClose();
              }}
            >
              <Text style={[styles.globalText, tw`text-center ${sortCriteria === option.value ? "text-white" : "text-black"}`]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={tw`mt-4 bg-red-500 p-2 rounded-lg`} onPress={onClose}>
            <Text style={[styles.globalText, tw`text-center text-white`]}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular", // ใช้ฟอนต์ Mitr-Regular หรือฟอนต์ที่ตั้งค่าไว้
  },
});
