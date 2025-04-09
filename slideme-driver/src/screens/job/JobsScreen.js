import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

// Import services, utils and constants
import { getRequest } from "../../services/api";
import { calculateDistance } from "../../utils/helpers";
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from "../../constants";

// Import components
import JobCard from "../../components/job/JobCard";
import FilterModal from "../../components/job/FilterModal";
import SortModal from "../../components/job/SortModal";

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
        setLoading(true);
        const data = await getRequest(`${API_ENDPOINTS.JOBS.GET_AVAILABLE}?driver_id=${driver_id}`);
        if (data && data.Status && Array.isArray(data.Result)) {
          setRequests(data.Result);
        } else {
          console.warn("Data format from API is incorrect:", data);
          setRequests([]);
        }
      } catch (error) {
        console.error("Error fetching job requests:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    
    // Polling for new requests every 10 seconds
    const intervalId = setInterval(() => {
      fetchRequests();
    }, 10000); 

    return () => clearInterval(intervalId);
  }, [driver_id]);

  // Filter jobs by distance
  const filteredRequests = requests.filter((request) => {
    const distance = calculateDistance(
      parseFloat(request.pickup_lat),
      parseFloat(request.pickup_long),
      parseFloat(request.dropoff_lat),
      parseFloat(request.dropoff_long)
    );
    return distance <= filterDistance;
  });

  // Sort jobs based on criteria
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

  const handleJobPress = (job) => {
    // console.log("Selected job:", job);
    const jobDistance = calculateDistance(
      job.pickup_lat, job.pickup_long, job.dropoff_lat, job.dropoff_long
    );
    
    navigation.navigate("JobDetail", {
      requestId: job.request_id,
      distance: jobDistance,
      origin: job.location_from,
      destination: job.location_to,
      type: job.vehicletype_name,
      message: job.customer_message,
      userData: route.params
    });
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      {/* Header Section */}
      <View style={tw`bg-[${COLORS.PRIMARY}] p-4 pt-13 flex-row items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text 
          style={[
            tw`text-2xl text-white ml-4`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          งานวันนี้
        </Text>
      </View>

      {/* Filter and Sort Bar */}
      <View style={tw`flex-row justify-between items-center bg-gray-200 p-2`}>
        <Text 
          style={[
            tw`text-gray-700 ml-4`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ระยะห่างจากต้นทาง: {filterDistance} กิโลเมตร
        </Text>
        <TouchableOpacity 
          style={tw`p-2 bg-[${COLORS.PRIMARY}] rounded-full`} 
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`p-2 bg-blue-500 rounded-full ml-2`} 
          onPress={() => setShowSortModal(true)}
        >
          <Icon name="sort" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <ScrollView contentContainerStyle={tw`p-4`}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        ) : sortedRequests.length > 0 ? (
          sortedRequests.map((request) => {
            const distance = calculateDistance(
              request.pickup_lat, 
              request.pickup_long, 
              request.dropoff_lat, 
              request.dropoff_long
            );
            
            return (
              <JobCard
                key={request.request_id}
                job={{
                  ...request,
                  distance: distance.toFixed(1)
                }}
                onPress={handleJobPress}
              />
            );
          })
        ) : (
          <Text 
            style={[
              tw`text-center text-gray-500 mt-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ไม่มีงานในระยะที่เลือก
          </Text>
        )}
      </ScrollView>

      {/* Filter and Sort Modals - These components would need to be created separately */}
      {showFilterModal && (
        <FilterModal 
          visible={showFilterModal} 
          setFilterDistance={setFilterDistance} 
          filterDistance={filterDistance} 
          onClose={() => setShowFilterModal(false)} 
        />
      )}
      
      {showSortModal && (
        <SortModal 
          visible={showSortModal} 
          setSortCriteria={setSortCriteria} 
          sortCriteria={sortCriteria} 
          onClose={() => setShowSortModal(false)} 
        />
      )}
    </View>
  );
}