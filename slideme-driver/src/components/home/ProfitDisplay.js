// components/ProfitDisplay.js
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrency } from '../../utils/formatters';
import { useTodayProfit } from '../../utils/hooks';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LottieView from 'lottie-react-native';

const ProfitDisplay = ({ driverId }) => {
  const { profitToday, tripsToday, isLoading, refetch } = useTodayProfit(driverId);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const moneyAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Special animation for the money counter
    Animated.timing(moneyAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    // Play Lottie animation if available
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, [profitToday]);
  
  // Card shadow style based on platform
  const cardShadow = tw`shadow-lg bg-white rounded-xl`;
  
  return (
    <Animated.View
      style={[
        tw`w-11/12 mx-auto mt-4`,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        }
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#f9fdf9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-xl overflow-hidden`,
          cardShadow
        ]}
      >
        <View style={tw`p-5`}>
          {/* Main profit section */}
          <View style={tw`flex-row items-center justify-between`}>
            {/* Today's profit info */}
            <View style={tw`flex-1`}>
              <Text 
                style={[
                  tw`text-gray-500 text-sm mb-1`, 
                  { fontFamily: 'Mitr-Regular' }
                ]}
              >
                รายได้วันนี้
              </Text>
              
              {isLoading ? (
                <Text 
                  style={[
                    tw`text-gray-400 text-lg`, 
                    { fontFamily: 'Mitr-Regular' }
                  ]}
                >
                  กำลังโหลด...
                </Text>
              ) : (
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: moneyAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.7, 1.1, 1]
                        })
                      }
                    ]
                  }}
                >
                  <Text 
                    style={[
                      tw`text-3xl font-bold text-[#60B876]`, 
                      { fontFamily: 'Mitr-Regular' }
                    ]}
                  >
                    {formatCurrency(profitToday)}
                  </Text>
                </Animated.View>
              )}
            </View>
            
            {/* Money animation icon */}
            <View style={tw`w-16 h-16 justify-center items-center`}>
              <LottieView
                ref={lottieRef}
                source={require('../../assets/animations/money-animation.json')}
                style={tw`w-full h-full`}
                autoPlay
                loop
              />
            </View>
          </View>
          
          {/* Additional stats section */}
          <View style={tw`flex-row mt-3 pt-3 border-t border-gray-100`}>
            {/* Trips today */}
            <View style={tw`flex-1 flex-row items-center`}>
              <View style={tw`bg-blue-100 rounded-full p-2 mr-2`}>
                <Icon name="car" size={18} color="#3b82f6" />
              </View>
              <View>
                <Text 
                  style={[
                    tw`text-xs text-gray-500`, 
                    { fontFamily: 'Mitr-Regular' }
                  ]}
                >
                  จำนวนงาน
                </Text>
                <Text 
                  style={[
                    tw`text-sm font-bold text-gray-700`, 
                    { fontFamily: 'Mitr-Regular' }
                  ]}
                >
                  {isLoading ? "..." : (tripsToday || 0)} งาน
                </Text>
              </View>
            </View>
            
            {/* Average per trip */}
            <View style={tw`flex-1 flex-row items-center`}>
              <View style={tw`bg-green-100 rounded-full p-2 mr-2`}>
                <FontAwesome5 name="money-bill-wave" size={16} color="#60B876" />
              </View>
              <View>
                <Text 
                  style={[
                    tw`text-xs text-gray-500`, 
                    { fontFamily: 'Mitr-Regular' }
                  ]}
                >
                  เฉลี่ย/งาน
                </Text>
                <Text 
                  style={[
                    tw`text-sm font-bold text-gray-700`, 
                    { fontFamily: 'Mitr-Regular' }
                  ]}
                >
                  {isLoading || !tripsToday ? "฿0" : 
                    formatCurrency(profitToday / tripsToday)}
                </Text>
              </View>
            </View>
            
            {/* Refresh button */}
            <TouchableOpacity 
              style={tw`bg-gray-100 p-2 rounded-full`}
              onPress={refetch}
            >
              <Icon name="refresh" size={20} color="#60B876" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default ProfitDisplay;