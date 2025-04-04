import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS } from "../../constants";

const HeaderWithBackButton = ({ showBackButton, title, onPress }) => {
  return (
    <View style={tw`flex-row items-center p-4 bg-white shadow-md border border-gray-300`}>
      <View style={tw`flex-row items-center mt-10`}>
        {showBackButton && (
          <TouchableOpacity onPress={onPress}>
            <Icon name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
        )}
        <Text 
          style={[
            tw`text-2xl ml-4`, 
            { fontFamily: FONTS.FAMILY.REGULAR, flex: 1 }
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};

export default HeaderWithBackButton;