import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS } from "../../constants";

const JobHeader = ({ distance, onBack }) => {
  return (
    <View style={tw`flex-row items-center my-9`}>
      <TouchableOpacity onPress={onBack} style={tw`mr-2`}>
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text 
        style={[
          tw`text-xl text-gray-800`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        ประมาณ {distance} กม.
      </Text>
    </View>
  );
};

export default JobHeader;