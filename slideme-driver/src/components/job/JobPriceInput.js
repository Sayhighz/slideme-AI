import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobPriceInput = ({ offeredPrice, onPriceChange, onConfirm, disabled = false }) => {
  return (
    <View>
      <Text 
        style={[
          tw`text-lg mt-6`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        กำหนดราคา
      </Text>
      <TextInput
        style={[
          tw`border border-gray-300 rounded p-2 mt-2`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
        placeholder="ราคาที่คุณต้องการ"
        keyboardType="numeric"
        value={offeredPrice}
        onChangeText={onPriceChange}
        editable={!disabled}
      />
      <TouchableOpacity
        style={tw`bg-[${COLORS.PRIMARY}] rounded p-2 mt-6 items-center ${disabled ? "opacity-50" : ""}`}
        onPress={onConfirm}
        disabled={disabled}
      >
        <Text 
          style={[
            tw`text-white text-lg`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ยื่นข้อเสนอ
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default JobPriceInput;