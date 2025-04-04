import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

// Import components
import JobHistoryList from '../../components/history/JobHistoryList';
import JobHistoryDetail from '../../components/history/JobHistoryDetail';
import HistoryFilterModal from '../../components/history/HistoryFilterModal';

export default function HistoryScreen({ userData }) {
  const [jobHistory, setJobHistory] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobHistory = useCallback(async () => {
    if (!userData?.driver_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let url = `${API_ENDPOINTS.DRIVER.EARNINGS.HISTORY}?driver_id=${userData.driver_id}`;
      
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await getRequest(url);
      
      if (response.Status && Array.isArray(response.earnings)) {
        setJobHistory(response.earnings);
        console.log("Job history fetched:", response.earnings);
      } else {
        console.warn("Invalid response format:", response);
        setJobHistory([]);
      }
    } catch (error) {
      console.error("Error fetching job history:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setJobHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData?.driver_id, selectedStatus]);

  // Fetch data when screen is focused or filter changes
  useFocusEffect(
    useCallback(() => {
      fetchJobHistory();
    }, [fetchJobHistory])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobHistory();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mt-9 px-4 py-4 border-b border-gray-200`}>
        <Text style={[tw`text-xl`, { fontFamily: "Mitr-Regular" }]}>
          ประวัติการทำงาน
        </Text>
        <TouchableOpacity 
          style={tw`p-3 bg-[#60B876] rounded`} 
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Job History List */}
      <JobHistoryList 
        jobHistory={jobHistory}
        onSelectJob={setSelectedJob}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Job Detail Modal */}
      <JobHistoryDetail 
        job={selectedJob} 
        visible={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />

      {/* Filter Modal */}
      <HistoryFilterModal 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSelect={setSelectedStatus}
        selectedFilter={selectedStatus}
      />
    </SafeAreaView>
  );
}