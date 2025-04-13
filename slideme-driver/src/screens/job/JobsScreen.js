import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl,
  StatusBar,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Location from 'expo-location';

// Import services, utils and constants
import { getRequest } from "../../services/api";
import { calculateDistance } from "../../utils/helpers";
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from "../../constants";

// Import components
import JobCard from "../../components/job/JobCard";
import FilterModal from "../../components/job/FilterModal";
import SortModal from "../../components/job/SortModal";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function JobsScreen({ route }) {
  const navigation = useNavigation();
  const { userData } = route.params || {};
  
  // States
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [filterDistance, setFilterDistance] = useState(20);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState("latest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Animation values
  const [scrollY] = useState(new Animated.Value(0));
  const [listOpacity] = useState(new Animated.Value(0));

  // Create static styles that don't rely on string interpolation
  const staticStyles = {
    primaryBg: { backgroundColor: COLORS.PRIMARY },
    primaryButtonBg: { backgroundColor: COLORS.PRIMARY },
    whiteText: { color: 'white' },
    whiteTransBg: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    whiteTransBg30: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  };

  // Get current location first, then fetch jobs
  useEffect(() => {
    const setupLocation = async () => {
      try {
        setLocationLoading(true);
        
        // Get location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError("ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง");
          setLocationLoading(false);
          return;
        }
        
        // Get current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        console.error("Error getting current location:", error);
        setError("ไม่สามารถระบุตำแหน่งปัจจุบันได้");
      } finally {
        setLocationLoading(false);
      }
    };

    setupLocation();
  }, []);

  // Fetch jobs after we have location
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we have location or if locationLoading is complete
      if ((!locationLoading && currentLocation) || (!locationLoading && error)) {
        fetchRequests();
        
        // Polling for new requests every 45 seconds
        const intervalId = setInterval(() => {
          fetchRequests(false); // Silent refresh (no loading indicator)
        }, 45000); 

        // Animate the list in
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();

        return () => clearInterval(intervalId);
      }
    }, [userData?.driver_id, currentLocation, locationLoading, filterDistance])
  );

  const fetchRequests = async (showLoading = true) => {
    if (!userData?.driver_id) {
      setLoading(false);
      setRefreshing(false);
      setError("ไม่พบข้อมูลผู้ขับ");
      return;
    }

    try {
      if (showLoading && !refreshing) {
        setLoading(true);
      }
      
      // Build the API endpoint with all required parameters
      let url = `${API_ENDPOINTS.JOBS.GET_AVAILABLE}?driver_id=${userData.driver_id}`;
      
      // Add radius (filter distance)
      url += `&radius=${filterDistance}`;
      
      const data = await getRequest(url);
      
      if (data && data.Status && Array.isArray(data.Result)) {
        // Use LayoutAnimation for smooth list updates
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        setRequests(data.Result);
        setError(null);
        setLastUpdated(new Date());
      } else {
        console.warn("Data format from API is incorrect:", data);
        setRequests([]);
        setError("ไม่พบงานในรัศมีที่เลือก");
      }
    } catch (error) {
      console.error("Error fetching job requests:", error);
      setRequests([]);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests(false);
  }, [filterDistance, userData?.driver_id]);

  // Sort jobs based on criteria
  const sortedRequests = [...requests].sort((a, b) => {
    if (sortCriteria === "latest") return new Date(b.booking_time) - new Date(a.booking_time);
    if (sortCriteria === "oldest") return new Date(a.booking_time) - new Date(b.booking_time);
    if (sortCriteria === "shortest") {
      // Use API-provided distance if available, otherwise calculate
      const distanceA = a.distance || calculateDistance(a.pickup_lat, a.pickup_long, a.dropoff_lat, a.dropoff_long);
      const distanceB = b.distance || calculateDistance(b.pickup_lat, b.pickup_long, b.dropoff_lat, b.dropoff_long);
      return distanceA - distanceB;
    }
    if (sortCriteria === "longest") {
      // Use API-provided distance if available, otherwise calculate
      const distanceA = a.distance || calculateDistance(a.pickup_lat, a.pickup_long, a.dropoff_lat, a.dropoff_long);
      const distanceB = b.distance || calculateDistance(b.pickup_lat, b.pickup_long, b.dropoff_lat, b.dropoff_long);
      return distanceB - distanceA;
    }
    return 0;
  });

  const handleJobPress = (job) => {
    // Use the API-provided distance if available, otherwise calculate it
    const jobDistance = job.distance_text || 
      (job.distance ? `${job.distance} กม.` : 
      `${calculateDistance(job.pickup_lat, job.pickup_long, job.dropoff_lat, job.dropoff_long)} กม.`);
    
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

  // Calculate header shadow based on scroll position
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.15],
    extrapolate: 'clamp',
  });

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // difference in seconds
    
    if (diff < 60) {
      return `${diff} วินาทีที่แล้ว`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    } else {
      return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={tw`items-center justify-center py-12`}>
      <Icon name="map-search" size={80} color={COLORS.GRAY_400} />
      <Text 
        style={[
          tw`text-center text-gray-500 text-lg mt-6 mb-2`, 
          { fontFamily: FONTS.FAMILY.MEDIUM }
        ]}
      >
        ไม่พบงานในรัศมี {filterDistance} กิโลเมตร
      </Text>
      <Text 
        style={[
          tw`text-center text-gray-400 mb-6 px-6`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        ลองเปลี่ยนรัศมีการค้นหาหรือกลับมาตรวจสอบภายหลัง
      </Text>
      <TouchableOpacity 
        style={[
          tw`mt-2 px-6 py-3 rounded-xl`,
          staticStyles.primaryButtonBg,
          styles.emptyButton
        ]}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center`}>
          <Icon name="tune" size={16} color="white" />
          <Text style={[tw`ml-1`, staticStyles.whiteText, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
            เปลี่ยนรัศมีค้นหา
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render list header with filter info
  const renderListHeader = () => {
    if (loading && !refreshing) return null;
    
    return (
      <View style={tw`pb-2 pt-1`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            {sortedRequests.length} รายการ
          </Text>
          
          {lastUpdated && (
            <View style={tw`flex-row items-center`}>
              <Icon name="refresh" size={12} color={COLORS.GRAY_400} />
              <Text style={[tw`text-gray-400 text-xs ml-1`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                อัพเดตล่าสุด: {getLastUpdatedText()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      {/* Header Section */}
      <Animated.View 
        style={[
          tw`px-4 pt-12 pb-4`,
          staticStyles.primaryBg,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: headerShadowOpacity,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 10
          }
        ]}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          >
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          
          <Text 
            style={[
              tw`text-2xl mt-2`, 
              staticStyles.whiteText,
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
          >
            งานวันนี้
          </Text>
          
          <View style={tw`w-6`}></View>
        </View>

        {/* Filter Bar */}
        <View style={[tw`mt-4 flex-row items-center justify-between p-3 rounded-xl`, staticStyles.whiteTransBg]}>
          <View style={tw`flex-row items-center`}>
            <Icon name="map-marker-radius" size={20} color="white" />
            <Text 
              style={[
                tw`ml-2`, 
                staticStyles.whiteText,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              จุดรับรถในรัศมี {filterDistance} กม.
            </Text>
          </View>
          
          <View style={tw`flex-row`}>
            <TouchableOpacity 
              style={[tw`p-2 rounded-xl mr-2 flex-row items-center`, staticStyles.whiteTransBg30]} 
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="tune" size={18} color="white" />
              <Text style={[tw`ml-1`, staticStyles.whiteText, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                กรอง
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[tw`p-2 rounded-xl flex-row items-center`, staticStyles.whiteTransBg30]} 
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="sort" size={18} color="white" />
              <Text style={[tw`ml-1`, staticStyles.whiteText, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                เรียง
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Location status */}
      {locationLoading && (
        <View style={tw`bg-amber-500 px-4 py-2 items-center flex-row justify-center`}>
          <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
          <Text style={[tw`text-white`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            กำลังค้นหาตำแหน่งของคุณ...
          </Text>
        </View>
      )}

      {/* Job List */}
      <Animated.FlatList
        contentContainerStyle={tw`p-4 pb-10`}
        data={sortedRequests}
        keyExtractor={(item) => item.request_id.toString()}
        renderItem={({ item }) => (
          <JobCard
            job={{
              ...item,
              distance: item.distance_text || 
                       (item.distance && `${item.distance} กม.`) || 
                       `${calculateDistance(item.pickup_lat, item.pickup_long, item.dropoff_lat, item.dropoff_long)} กม.`
            }}
            onPress={handleJobPress}
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
        style={{ opacity: listOpacity }}
      />

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={tw`absolute inset-0 items-center justify-center bg-white`}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text 
            style={[
              tw`text-gray-600 mt-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            กำลังโหลดงานในพื้นที่ของคุณ...
          </Text>
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal 
        visible={showFilterModal} 
        setFilterDistance={setFilterDistance} 
        filterDistance={filterDistance} 
        onClose={() => setShowFilterModal(false)} 
      />
      
      {/* Sort Modal */}
      <SortModal 
        visible={showSortModal} 
        setSortCriteria={setSortCriteria} 
        sortCriteria={sortCriteria} 
        onClose={() => setShowSortModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyButton: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  }
});