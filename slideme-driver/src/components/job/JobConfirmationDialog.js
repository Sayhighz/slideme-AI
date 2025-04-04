import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobConfirmationDialog = ({ visible, message, onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white p-6 rounded-lg w-4/5`}>
          <Text 
            style={[
              tw`text-lg text-center mb-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ยืนยันการเสนอราคา
          </Text>
          <Text 
            style={[
              tw`text-gray-700 text-center mb-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {message}
          </Text>
          <TouchableOpacity
            style={tw`bg-green-500 p-3 rounded-lg mb-2 items-center`}
            onPress={onConfirm}
          >
            <Text 
              style={[
                tw`text-white text-lg`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              ยืนยัน
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-gray-300 p-3 rounded-lg items-center`}
            onPress={onCancel}
          >
            <Text 
              style={[
                tw`text-black text-lg`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              ยกเลิก
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default JobConfirmationDialog;