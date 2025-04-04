import React from "react";
import { View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS } from "../../constants";

const JobInfo = ({ origin, destination, message }) => {
  return (
    <View style={tw`p-4 bg-white mt-4 rounded-lg shadow`}>
      <View style={tw`mb-2`}>
        <Text 
          style={[
            tw`text-gray-800`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          <Icon name="map-marker" size={20} color="green" /> {origin}
        </Text>
      </View>
      <View style={tw`mt-4`}>
        <Text 
          style={[
            tw`text-gray-800`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          <Icon name="map-marker" size={20} color="red" /> {destination}
        </Text>
      </View>
      {message && (
        <Text 
          style={[
            tw`text-gray-800 mt-4`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ข้อความลูกค้า: {message || "ไม่มีข้อความ"}
        </Text>
      )}
    </View>
  );
};

export default JobInfo;