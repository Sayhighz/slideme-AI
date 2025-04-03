import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function JobHistoryItem({ job, onPress }) {
  return (
    <TouchableOpacity
      style={tw`p-4 mb-4 mx-3 bg-white rounded-lg shadow-md border border-gray-200 flex-row`}
      onPress={onPress}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Icon name="map-marker" size={20} color="green" />
          <Text style={[styles.globalText, tw`ml-2 text-gray-800`]}>{job.origin}</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Icon name="map-marker" size={20} color="red" />
          <Text style={[styles.globalText, tw`ml-2 text-gray-800`]}>{job.destination}</Text>
        </View>
      </View>
      <View style={tw`ml-4 justify-center`}>
        <Text style={styles.globalText}>รายได้: ฿{job.profit}</Text>
        <Text style={[styles.globalText, tw`text-gray-500`]}>{job.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
