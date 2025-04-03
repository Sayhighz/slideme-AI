// src/components/ConfirmationDialog.js
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";

/**
 * ConfirmationDialog Component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls the visibility of the modal
 * @param {string} props.title - Title of the dialog
 * @param {string} props.message - Message body of the dialog
 * @param {Function} props.onConfirm - Function to call when "OK" is pressed
 * @param {Function} props.onCancel - Function to call when "Cancel" is pressed
 */
const ConfirmationDialog = ({ visible, title, message, onConfirm, onCancel }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={tw`flex-1 bg-black/50 justify-center items-center`}>
        <View style={tw`w-4/5 bg-white rounded-lg p-5`}>
          <Text style={[styles.globalText,tw`text-lg mb-4 text-center`]}>
            {title}
          </Text>
          <Text style={[styles.globalText,tw`text-base mb-6 text-center text-gray-600`]}>{message}</Text>
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-300 rounded-md py-2 mr-2 items-center`}
              onPress={onCancel}
            >
              <Text style={[styles.globalText,tw`text-base text-black`]}>
                ยกเลิก
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-green-500 rounded-md py-2 ml-2 items-center`}
              onPress={onConfirm}
            >
              <Text style={[styles.globalText,tw`text-base text-white`]}>
                ตกลง
              </Text>
            </TouchableOpacity>
          </View>
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



export default ConfirmationDialog;
