import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import tw from "twrnc";

const SubmitButton = ({ onPress, title, disabled }) => {
  return (
    <View style={tw`absolute bottom-0 w-full p-4 pb-8 bg-white border border-gray-300 shadow-lg`}>
      <TouchableOpacity
        style={[tw`items-center justify-center w-full h-12 bg-[#60B876] rounded`,disabled ? tw`bg-gray-400` : tw`bg-[#60B876]`]}
        onPress={onPress}
        disabled={disabled || false}
      >
        <Text style={[styles.customFont, tw`text-white text-xl font-semibold`]}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  customFont: {
    fontFamily: "Mitr-Regular",
  },
};

export default SubmitButton;
