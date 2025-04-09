// components/OffersList.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Animated, 
  Dimensions,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';
import { formatNumberWithCommas, truncateText } from '../../utils/formatters';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const OffersList = ({ driverId, navigation, refreshControl }) => {
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerAnimationValue = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef([]);
  
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${API_ENDPOINTS.JOBS.GET_OFFERS}?driver_id=${driverId}`);
      if (data.Status && Array.isArray(data.Result)) {
        setOffersData(data.Result);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
      
      // Start header animation
      Animated.timing(headerAnimationValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    fetchOffers();
    
    // Close all swipeables when navigating away
    const unsubscribe = navigation.addListener('blur', () => {
      swipeableRefs.current.forEach(ref => {
        if (ref && ref.close) {
          ref.close();
        }
      });
    });
    
    return unsubscribe;
  }, [driverId, navigation]);

  const onRefresh = React.useCallback(() => {
    fetchOffers();
  }, [driverId]);

  const getFormattedStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <View style={tw`flex-row items-center bg-yellow-100 px-2 py-1 rounded-full`}>
            <Icon name="clock-outline" size={12} color="#f59e0b" style={tw`mr-1`} />
            <Text style={[tw`text-yellow-600 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
              รออนุมัติ
            </Text>
          </View>
        );
      case "accepted":
        return (
          <View style={tw`flex-row items-center bg-green-100 px-2 py-1 rounded-full`}>
            <Icon name="check-circle-outline" size={12} color="#10b981" style={tw`mr-1`} />
            <Text style={[tw`text-green-600 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
              กำลังทำงาน
            </Text>
          </View>
        );
      default:
        return (
          <View style={tw`flex-row items-center bg-gray-100 px-2 py-1 rounded-full`}>
            <Icon name="help-circle-outline" size={12} color="#6b7280" style={tw`mr-1`} />
            <Text style={[tw`text-gray-600 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
              {status}
            </Text>
          </View>
        );
    }
  };

  const handlePress = (item) => {
    // Trigger haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (item.offer_status === "accepted") {
      navigation.navigate("JobWorkingPickup", { request_id: item.request_id });
    } else {
      // Maybe navigate to offer details or show modal
    }
  };
  
  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    // Different actions based on status
    if (item.offer_status === "accepted") {
      return (
        <View style={tw`flex-row`}>
          <TouchableOpacity 
            style={tw`bg-blue-500 justify-center items-center w-20`}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              navigation.navigate("JobWorkingPickup", { request_id: item.request_id });
            }}
          >
            <Animated.View
              style={[
                { transform: [{ translateX: trans }] }
              ]}
            >
              <Icon name="navigation" size={22} color="white" />
              <Text style={[tw`text-white text-xs mt-1`, { fontFamily: 'Mitr-Regular' }]}>
                นำทาง
              </Text>
            </Animated.View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={tw`bg-green-500 justify-center items-center w-20`}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              navigation.navigate("JobDetails", { offer_id: item.offer_id });
            }}
          >
            <Animated.View
              style={[
                { transform: [{ translateX: trans }] }
              ]}
            >
              <Icon name="information-outline" size={22} color="white" />
              <Text style={[tw`text-white text-xs mt-1`, { fontFamily: 'Mitr-Regular' }]}>
                รายละเอียด
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <TouchableOpacity 
          style={tw`bg-blue-500 justify-center items-center w-20`}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            navigation.navigate("OfferDetails", { offer_id: item.offer_id });
          }}
        >
          <Animated.View
            style={[
              { transform: [{ translateX: trans }] }
            ]}
          >
            <Icon name="eye-outline" size={22} color="white" />
            <Text style={[tw`text-white text-xs mt-1`, { fontFamily: 'Mitr-Regular' }]}>
              ดูรายละเอียด
            </Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }
  };

  const renderItem = ({ item, index }) => {
    // Save swipeable ref for later closing
    const saveSwipeableRef = (ref) => {
      if (ref && !swipeableRefs.current.includes(ref)) {
        swipeableRefs.current[index] = ref;
      }
    };

    return (
      <Animated.View
        style={[
          tw`mx-3 mb-3`,
          {
            opacity: 1,
            transform: [{ 
              translateY: 0
            }]
          }
        ]}
      >
        <Swipeable
          ref={saveSwipeableRef}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
          onSwipeableOpen={() => {
            // Close all other swipeables
            swipeableRefs.current.forEach((ref, idx) => {
              if (ref && ref.close && idx !== index) {
                ref.close();
              }
            });
            
            // Haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <TouchableOpacity 
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                item.offer_status === "accepted" 
                  ? ['#eef9f2', '#e6f7ee'] 
                  : ['#ffffff', '#f9f9f9']
              }
              style={[
                tw`p-4 rounded-xl shadow-md border border-gray-100`,
                item.offer_status === "accepted" && tw`border-l-4 border-l-green-500`
              ]}
            >
              <View style={tw`flex-row justify-between items-center`}>
                {/* Location details */}
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <View style={tw`bg-blue-100 rounded-full p-1 mr-2`}>
                      <Icon name="map-marker-radius" size={14} color="#3b82f6" />
                    </View>
                    <Text style={[tw`text-sm text-gray-800`, { fontFamily: 'Mitr-Regular' }]}>
                      {truncateText(item.location_from, 25)}
                    </Text>
                  </View>
                  
                  <View style={tw`flex-row items-center ml-2`}>
                    <View style={tw`border-l-2 border-dashed border-gray-300 h-5 ml-1`} />
                  </View>
                  
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`bg-green-100 rounded-full p-1 mr-2`}>
                      <Icon name="map-marker" size={14} color="#10b981" />
                    </View>
                    <Text style={[tw`text-sm text-gray-800`, { fontFamily: 'Mitr-Regular' }]}>
                      {truncateText(item.location_to, 25)}
                    </Text>
                  </View>
                </View>
                
                {/* Status and price */}
                <View style={tw`items-end ml-2`}>
                  {getFormattedStatus(item.offer_status)}
                  
                  <View style={tw`mt-2 items-end`}>
                    <Text style={[tw`text-xs text-gray-500`, { fontFamily: 'Mitr-Regular' }]}>
                      ราคาเสนอ
                    </Text>
                    <Text 
                      style={[
                        tw`text-blue-600 font-bold text-lg mt-1`, 
                        { fontFamily: 'Mitr-Regular' }
                      ]}
                    >
                      {item.offered_price
                        ? `฿${formatNumberWithCommas(item.offered_price)}`
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Swipe hint indicator */}
              <View style={tw`absolute -right-2 top-1/2 mt-2`}>
                <View style={tw`bg-gray-200 rounded-full p-1`}>
                  <Feather name="chevrons-left" size={16} color="#60B876" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <View style={tw`flex-1`}>
      <Animated.View
        style={[
          tw`w-full mx-auto px-4`,
          {
            opacity: headerAnimationValue,
            transform: [
              { 
                translateY: headerAnimationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }
            ]
          }
        ]}
      >
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text 
            style={[
              tw`text-gray-800 text-lg font-medium`, 
              { fontFamily: 'Mitr-Regular' }
            ]}
          >
            รายการเสนอราคา
          </Text>
          
          <TouchableOpacity style={tw`p-1`}>
            <Text style={[tw`text-[#60B876] text-sm`, { fontFamily: 'Mitr-Regular' }]}>
              ดูทั้งหมด
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {loading ? (
        <View style={tw`items-center justify-center py-6`}>
          <ActivityIndicator size="large" color="#60B876" />
          <Text style={[tw`text-gray-500 mt-2`, { fontFamily: 'Mitr-Regular' }]}>
            กำลังโหลดข้อมูล...
          </Text>
        </View>
      ) : offersData.length === 0 ? (
        <View style={tw`items-center justify-center bg-gray-50 rounded-xl mx-4 py-10 my-2`}>
          <Icon name="clipboard-text-outline" size={48} color="#d1d5db" />
          <Text style={[tw`text-gray-400 mt-2 text-center`, { fontFamily: 'Mitr-Regular' }]}>
            ไม่มีข้อมูลเสนอราคา
          </Text>
          <TouchableOpacity 
            style={tw`mt-4 bg-[#60B876] px-4 py-2 rounded-full`}
            onPress={() => navigation.navigate('JobsScreen', { driver_id: driverId })}
          >
            <Text style={[tw`text-white`, { fontFamily: 'Mitr-Regular' }]}>
              ไปหน้าค้นหางาน
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offersData}
          keyExtractor={(item) => item.offer_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={tw`pt-1 pb-2`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          refreshControl={refreshControl}
        />
      )}
    </View>
  );
};

export default OffersList;