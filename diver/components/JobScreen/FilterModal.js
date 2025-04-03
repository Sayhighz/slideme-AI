import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import tw from "twrnc";

export default function FilterModal({ visible, setFilterDistance, filterDistance, onClose }) {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-3/4 p-4 rounded-lg`}>
          <Text style={[styles.globalText, tw`text-lg text-center mb-4`]}>เลือกระยะทาง</Text>
          {[10, 20, 30].map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[tw`p-2 rounded-lg mb-2`, filterDistance === distance ? tw`bg-[#60B876]` : tw`bg-gray-200`]}
              onPress={() => {
                setFilterDistance(distance);
                onClose();
              }}
            >
              <Text style={[styles.globalText, tw`text-center ${filterDistance === distance ? "text-white" : "text-black"}`]}>
                {distance} กิโลเมตร
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
    fontFamily: "Mitr-Regular", // ใช้ฟอนต์ Mitr-Regular หรือฟอนต์ที่คุณตั้งค่าไว้ในโปรเจกต์
  },
});
