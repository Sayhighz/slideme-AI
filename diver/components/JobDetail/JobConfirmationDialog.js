import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";

const JobConfirmationDialog = ({ visible, message, onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white p-6 rounded-lg w-4/5`}>
          <Text style={[styles.globalText, tw`text-lg text-center mb-4`]}>ยืนยันการเสนอราคา</Text>
          <Text style={[styles.globalText, tw`text-gray-700 text-center mb-4`]}>{message}</Text>
          <TouchableOpacity
            style={tw`bg-green-500 p-3 rounded-lg mb-2 items-center`}
            onPress={onConfirm}
          >
            <Text style={[styles.globalText, tw`text-white text-lg`]}>ยืนยัน</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-gray-300 p-3 rounded-lg items-center`}
            onPress={onCancel}
          >
            <Text style={[styles.globalText, tw`text-black text-lg`]}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default JobConfirmationDialog;
