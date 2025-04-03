import React from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import JobHistoryItem from "./JobHistoryItem";
import tw from "twrnc";

export default function JobHistoryList({ jobHistory, onSelectJob }) {
  return jobHistory.length > 0 ? (
    <FlatList
      data={jobHistory}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <JobHistoryItem job={item} onPress={() => onSelectJob(item)} />
      )}
    />
  ) : (
    <View style={tw`flex-1 justify-center items-center mt-10`}>
      <Text style={[styles.globalText, tw`text-gray-500 text-lg`]}>
        ไม่มีประวัติการทำงาน
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
