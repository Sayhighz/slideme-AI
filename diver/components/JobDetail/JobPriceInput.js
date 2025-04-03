import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";

const JobPriceInput = ({ offeredPrice, onPriceChange, onConfirm }) => {
  return (
    <View>
      <Text style={[styles.globalText, tw`text-lg mt-6`]}>กำหนดราคา</Text>
      <TextInput
        style={[styles.globalText, tw`border border-gray-300 rounded p-2 mt-2`]}
        placeholder="ราคาที่คุณต้องการ"
        keyboardType="numeric"
        value={offeredPrice}
        onChangeText={onPriceChange}
      />
      <TouchableOpacity
        style={tw`bg-[#60B876] rounded p-2 mt-6 items-center`}
        onPress={onConfirm}
      >
        <Text style={[styles.globalText, tw`text-white text-lg`]}>ยื่นข้อเสนอ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default JobPriceInput;
