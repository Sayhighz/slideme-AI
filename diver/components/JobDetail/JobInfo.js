import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

const JobInfo = ({ origin, destination, message }) => {
  return (
    <View style={tw`p-4 bg-white mt-4 rounded-lg shadow`}>
      <View style={tw`mb-2`}>
        <Text style={[styles.globalText, tw`text-gray-800`]}>
          <Icon name="map-marker" size={20} color="green" /> {origin}
        </Text>
      </View>
      <View style={tw`mt-4`}>
        <Text style={[styles.globalText, tw`text-gray-800`]}>
          <Icon name="map-marker" size={20} color="red" /> {destination}
        </Text>
      </View>
      <Text style={[styles.globalText, tw`text-gray-800 mt-4`]}>
        ข้อความลูกค้า: {message || "ไม่มีข้อความ"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default JobInfo;
