import React from "react";
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import tw from "twrnc";

const filterOptions = [
  { label: "ทั้งหมด", value: "all" },
  { label: "รับข้อเสนอ", value: "accepted" },
  { label: "สำเร็จ", value: "completed" },
  { label: "ยกเลิก", value: "cancelled" },
];

export default function FilterModal({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-4/5 bg-white rounded-lg`}>
          <Text style={[styles.globalText, tw`text-lg p-4 text-center`]}>เลือกประเภทการกรอง</Text>
          <FlatList
            data={filterOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity style={tw`p-4 border-b border-gray-200`} onPress={() => onSelect(item.value)}>
                <Text style={[styles.globalText, tw`text-center text-lg text-gray-800`]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={tw`p-4 bg-red-500 rounded-b-lg`} onPress={onClose}>
            <Text style={[styles.globalText, tw`text-white text-center`]}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
