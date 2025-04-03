import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { IP_ADDRESS } from "../../config";
import JobHistoryList from "../../components/HistoryScreen/JobHistoryList";
import JobHistoryDetail from "../../components/HistoryScreen/JobHistoryDetail";
import FilterModal from "../../components/HistoryScreen/FilterModal";

export default function HistoryScreen({ userData }) {
  const [jobHistory, setJobHistory] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchJobHistory = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:4000/driver/getHistory?driver_id=${userData?.driver_id}`);
      const data = await response.json();
      if (data.Status) {
        setJobHistory(data.Result);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobHistory();
    }, [])
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row justify-between items-center mt-9 px-4 py-4`}>
        <Text style={[styles.globalText, tw`text-xl`]}>ประวัติการทำงาน</Text>
        <TouchableOpacity style={tw`p-3 bg-[#60B876] rounded`} onPress={() => setFilterModalVisible(true)}>
          <Icon name="filter-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <JobHistoryList jobHistory={jobHistory} onSelectJob={setSelectedJob} />
      <JobHistoryDetail job={selectedJob} visible={!!selectedJob} onClose={() => setSelectedJob(null)} />
      <FilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onSelect={setSelectedStatus} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
