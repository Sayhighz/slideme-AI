import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const SubmitButton = ({ onPress, title, disabled = false }) => {
  return (
    <View style={tw`absolute bottom-0 w-full p-4 pb-8 bg-white border border-gray-300 shadow-lg`}>
      <TouchableOpacity
        style={[
          tw`items-center justify-center w-full h-12 rounded`,
          disabled ? tw`bg-gray-400` : tw`bg-[${COLORS.PRIMARY}]`
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text 
          style={[
            tw`text-white text-xl font-semibold`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SubmitButton;