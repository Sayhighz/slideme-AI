import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { getRequest } from "../../lib/axios";
import JobCard from "../../components/JobScreen/JobCard";
import FilterModal from "../../components/JobScreen/FilterModal";
import SortModal from "../../components/JobScreen/SortModal";
import { calculateDistance } from "../../components/JobScreen/DistanceCalculator";

export default function JobsScreen({ route }) {
  const navigation = useNavigation();
  const { driver_id } = route.params || {};
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDistance, setFilterDistance] = useState(10);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState("latest");
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequest(`request/getRequests?driver_id=${driver_id}`);
        if (data && data.Status && Array.isArray(data.Result)) {
          setRequests(data.Result);
        } else {
          console.warn("รูปแบบข้อมูลจาก API ไม่ถูกต้อง:", data);
          setRequests([]);
        }
      } catch (error) {
        console.error("ข้อผิดพลาดในการดึงข้อมูลงาน:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    const intervalId = setInterval(() => {
      fetchRequests();
    }, 5000); 

    return () => clearInterval(intervalId); 
  }, [driver_id]);

  const filteredRequests = requests.filter((request) => {
    const distance = calculateDistance(
      parseFloat(request.pickup_lat),
      parseFloat(request.pickup_long),
      parseFloat(request.dropoff_lat),
      parseFloat(request.dropoff_long)
    );
    return distance <= filterDistance;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortCriteria === "latest") return new Date(b.booking_time) - new Date(a.booking_time);
    if (sortCriteria === "oldest") return new Date(a.booking_time) - new Date(b.booking_time);
    if (sortCriteria === "shortest") {
      return calculateDistance(a.pickup_lat, a.pickup_long, a.dropoff_lat, a.dropoff_long) -
             calculateDistance(b.pickup_lat, b.pickup_long, b.dropoff_lat, b.dropoff_long);
    }
    if (sortCriteria === "longest") {
      return calculateDistance(b.pickup_lat, b.pickup_long, b.dropoff_lat, b.dropoff_long) -
             calculateDistance(a.pickup_lat, a.pickup_long, a.dropoff_lat, a.dropoff_long);
    }
    return 0;
  });

  return (
    <View style={tw`flex-1 bg-gray-100`}>
            {/* Header Section */}
            <View style={tw`bg-[#60B876] p-4 pt-13 flex-row items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.globalText,tw`text-2xl text-white ml-4`]}>
          งานวันนี้
        </Text>
      </View>

      <View style={tw`flex-row justify-between items-center bg-gray-200 p-2`}>
        <Text style={[styles.globalText, tw`text-gray-700 ml-4`]}>ระยะห่างจากต้นทาง: {filterDistance} กิโลเมตร</Text>
        <TouchableOpacity style={tw`p-2 bg-[#60B876] rounded-full`} onPress={() => setShowFilterModal(true)}>
          <Icon name="filter" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={tw`p-2 bg-blue-500 rounded-full ml-2`} onPress={() => setShowSortModal(true)}>
          <Icon name="sort" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`p-4`}>
        {loading ? (
          <ActivityIndicator size="large" color="#60B876" />
        ) : sortedRequests.length > 0 ? (
          sortedRequests.map((request) => (
            <JobCard
              key={request.request_id}
              requestId={request.request_id}
              distance={calculateDistance(request.pickup_lat, request.pickup_long, request.dropoff_lat, request.dropoff_long)}
              origin={request.location_from}
              destination={request.location_to}
              type={request.vehicle_type}
              time={request.booking_time ? new Date(request.booking_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "ไม่ระบุ"}
              message={request.customer_message}
            />
          ))
        ) : (
          <Text style={[styles.globalText, tw`text-center text-gray-500 mt-4`]}>ไม่มีงานในระยะที่เลือก</Text>
        )}
      </ScrollView>

      <FilterModal visible={showFilterModal} setFilterDistance={setFilterDistance} filterDistance={filterDistance} onClose={() => setShowFilterModal(false)} />
      <SortModal visible={showSortModal} setSortCriteria={setSortCriteria} sortCriteria={sortCriteria} onClose={() => setShowSortModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular", // ใช้ฟอนต์ Mitr
  },
});


