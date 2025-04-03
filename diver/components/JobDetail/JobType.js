import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import tw from "twrnc";

const JobType = ({ type }) => {
  return (
    <View>
      <Text style={[styles.globalText, tw`text-lg mt-6`]}>ประเภทการขนส่ง</Text>
      <TextInput
        style={[styles.globalText, tw`border border-gray-300 rounded p-2 mt-2 bg-gray-100`]}
        value={type}
        editable={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default JobType;
