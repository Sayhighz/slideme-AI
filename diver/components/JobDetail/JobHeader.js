import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

const JobHeader = ({ distance, onBack }) => {
  return (
    <View style={tw`flex-row items-center my-9`}>
      <TouchableOpacity onPress={onBack} style={tw`mr-2`}>
        <Icon name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text style={[styles.globalText, tw`text-xl text-gray-800`]}>
        ประมาณ {distance} KM
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default JobHeader;
