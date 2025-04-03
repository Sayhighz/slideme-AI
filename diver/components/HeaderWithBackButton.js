import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw, { style } from "twrnc";

const HeaderWithBackButton = ({ showBackButton, title, onPress }) => {
  return (
    <View style={tw`flex-row items-center p-4 bg-white shadow-md border border-gray-300`}>
        <View style={tw`flex-row items-center mt-10`}>
      {showBackButton && (
        <TouchableOpacity onPress={onPress}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={[styles.customFont,tw`text-2xl ml-4'`, { flex: 1 }]}>
        {title}
      </Text>
      </View>
    </View>
  );
};

const styles = {
  customFont: {
    fontFamily: "Mitr-Regular",
  },
};

export default HeaderWithBackButton;
