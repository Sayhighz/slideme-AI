import React from "react";
import { View, Text, TextInput } from "react-native";
import tw from "twrnc";
import { FONTS } from "../../constants";

const JobType = ({ type }) => {
  return (
    <View>
      <Text 
        style={[
          tw`text-lg mt-6`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        ประเภทการขนส่ง
      </Text>
      <TextInput
        style={[
          tw`border border-gray-300 rounded p-2 mt-2 bg-gray-100`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
        value={type}
        editable={false}
      />
    </View>
  );
};

export default JobType;