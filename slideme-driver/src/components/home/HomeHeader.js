// components/HomeHeader.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGE_URL } from '../../config';
import { useDriverScore } from '../../utils/hooks';
import LottieView from 'lottie-react-native';

const HomeHeader = ({ userData }) => {
  const { driverScore, isLoading } = useDriverScore(userData?.driver_id);
  
  // Animation references
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  
  useEffect(() => {
    // Start profile highlight animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Rotate animation for status icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    // Star rating animation
    Animated.timing(starAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Play Lottie animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);
  
  // Create interpolated animations
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const starScale = starAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1]
  });

  return (
    <View style={tw`mt-6 px-4 w-full`}>
      <View style={tw`flex-row items-center`}>
        {/* Profile picture with animated border */}
        <Animated.View 
          style={[
            tw`rounded-full border-2 border-green-400`,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#60B876', '#3C9D57', '#278A3A']}
            style={tw`p-0.5 rounded-full`}
          >
            <View style={tw`p-0.5 bg-white rounded-full`}>
              <Image
                source={{
                  uri: userData?.profile_picture 
                    ? `${IMAGE_URL}${userData.profile_picture}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.first_name || "User")}&background=60B876&color=fff`,
                }}
                style={tw`w-20 h-20 rounded-full`}
              />
              
              {/* Online status indicator */}
              <Animated.View 
                style={[
                  tw`absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white`,
                  { transform: [{ rotate: rotation }] }
                ]}
              >
                <View style={tw`w-2 h-2 rounded-full bg-white`} />
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* User info */}
        <View style={tw`ml-4 flex-1`}>
          <View style={tw`flex-row items-center`}>
            <LottieView
              ref={lottieRef}
              source={require('../../assets/animations/wave-hand.json')}
              style={tw`w-6 h-6 mr-1`}
              autoPlay
              loop
            />
            <Text style={[tw`text-sm text-gray-500`, { fontFamily: 'Mitr-Regular' }]}>
              สวัสดี!
            </Text>
          </View>
          
          <Text 
            style={[
              tw`text-2xl text-gray-800`, 
              { fontFamily: 'Mitr-Regular' }
            ]}
          >
            {`${userData?.first_name || "ไม่พบข้อมูล"} ${userData?.last_name || ""}`}
          </Text>
          
          {/* Star rating with animation */}
          <View style={tw`flex-row items-center mt-1`}>
            <Animated.View 
              style={{ 
                transform: [{ scale: starScale }],
              }}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={tw`rounded-full p-1`}
              >
                <Icon 
                  name="star" 
                  size={20} 
                  color="white" 
                />
              </LinearGradient>
            </Animated.View>
            
            <Text 
              style={[
                tw`text-lg text-gray-700 ml-1`, 
                { fontFamily: 'Mitr-Regular' }
              ]}
            >
              {isLoading ? "กำลังโหลด..." : (driverScore ? driverScore : "0.0")}
            </Text>
          </View>
        </View>
        
        {/* Notification and settings buttons */}
        <View style={tw`flex-row`}>
          <TouchableOpacity style={tw`p-2 mr-2`}>
            <View style={tw`relative`}>
              <Icon name="notifications" size={26} color="#60B876" />
              <View style={tw`absolute top-0 right-0 bg-red-500 rounded-full w-3 h-3`} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={tw`p-2`}>
            <FontAwesome name="sliders" size={24} color="#60B876" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeHeader;