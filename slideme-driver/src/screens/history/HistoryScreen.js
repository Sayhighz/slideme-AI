import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';

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
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    totalPages: 1,
    total: 0
  });
  const [hasMoreData, setHasMoreData] = useState(true);

  const fetchJobHistory = useCallback(async (isLoadMore = false) => {
    if (!userData?.driver_id) {
      setLoading(false);
      return;
    }

    try {
      if (!isLoadMore) {
        setLoading(true);
      }
      
      // Determine offset for pagination
      const offset = isLoadMore ? pagination.offset + pagination.limit : 0;
      
      // Build URL with appropriate parameters
      let url = `${API_ENDPOINTS.JOBS.GET_REQUEST_HISTORY}/${userData.driver_id}?limit=${pagination.limit}&offset=${offset}`;
      
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await getRequest(url);
      
      if (response.Status) {
        // Update job history data
        if (isLoadMore) {
          setJobHistory(prev => [...prev, ...response.Result]);
        } else {
          setJobHistory(response.Result || []);
        }
        
        // Update pagination info
        setPagination({
          limit: response.Pagination?.limit || pagination.limit,
          offset: response.Pagination?.offset || offset,
          totalPages: response.Pagination?.totalPages || 1,
          total: response.Total || 0
        });
        
        // Check if there's more data to load
        setHasMoreData((response.Result?.length || 0) > 0 && 
                      (response.Pagination?.offset + response.Result?.length) < response.Total);
                      
        console.log("Job history fetched:", response.Result);
      } else {
        console.warn("Invalid response:", response);
        if (!isLoadMore) {
          setJobHistory([]);
        }
      }
    } catch (error) {
      console.error("Error fetching job history:", error);
      if (!isLoadMore) {
        Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่ภายหลัง");
        setJobHistory([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData?.driver_id, selectedStatus, pagination.limit, pagination.offset]);

  // Fetch data when screen is focused or filter changes
  useFocusEffect(
    useCallback(() => {
      fetchJobHistory();
    }, [fetchJobHistory])
  );

  // Reset pagination when filter changes
  useEffect(() => {
    setPagination({
      limit: 20,
      offset: 0,
      totalPages: 1,
      total: 0
    });
    setHasMoreData(true);
  }, [selectedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPagination({
      ...pagination,
      offset: 0
    });
    fetchJobHistory();
  };

  const handleLoadMore = () => {
    if (hasMoreData && !loading && !refreshing) {
      fetchJobHistory(true);
    }
  };

  const handleFilterChange = (status) => {
    setSelectedStatus(status);
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar backgroundColor={COLORS.WHITE} barStyle="dark-content" />
      
      {/* Header */}
      <View style={tw`flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200 shadow-sm`}>
        <Text style={[tw`text-xl text-gray-800`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
          ประวัติการทำงาน
        </Text>
        <TouchableOpacity 
          style={tw`p-2 rounded-full ${selectedStatus !== 'all' ? 'bg-green-100' : 'bg-gray-100'}`}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon 
            name="filter-variant" 
            size={24} 
            color={selectedStatus !== 'all' ? COLORS.PRIMARY : COLORS.GRAY_600} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={tw`flex-row px-4 py-2 bg-white border-b border-gray-200`}>
        <TouchableOpacity 
          style={tw`mr-2 px-3 py-1 rounded-full ${selectedStatus === 'all' ? 'bg-green-500' : 'bg-gray-200'}`}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[
            tw`${selectedStatus === 'all' ? 'text-white' : 'text-gray-700'}`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}>
            ทั้งหมด
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`mr-2 px-3 py-1 rounded-full ${selectedStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}
          onPress={() => handleFilterChange('completed')}
        >
          <Text style={[
            tw`${selectedStatus === 'completed' ? 'text-white' : 'text-gray-700'}`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}>
            เสร็จสิ้น
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`px-3 py-1 rounded-full ${selectedStatus === 'cancelled' ? 'bg-green-500' : 'bg-gray-200'}`}
          onPress={() => handleFilterChange('cancelled')}
        >
          <Text style={[
            tw`${selectedStatus === 'cancelled' ? 'text-white' : 'text-gray-700'}`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}>
            ยกเลิก
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job History List */}
      <JobHistoryList 
        jobHistory={jobHistory}
        onSelectJob={setSelectedJob}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLoadMore={handleLoadMore}
        hasMoreData={hasMoreData}
        selectedStatus={selectedStatus}
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
        onSelect={handleFilterChange}
        selectedFilter={selectedStatus}
      />
    </SafeAreaView>
  );
}