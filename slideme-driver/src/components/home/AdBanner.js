// components/AdBanner.js
import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Platform 
} from 'react-native';
import Swiper from 'react-native-swiper';
import tw from 'twrnc';
import { IMAGE_URL } from '../../config';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const AdBanner = ({ ads = [] }) => {
  // If no ads provided, use default empty array to prevent errors
  const displayAds = ads.length > 0 ? ads : [
    { id: 1, image: 'default_ad1.png' },
    { id: 2, image: 'default_ad2.png' },
  ];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleAdPress = () => {
    // Trigger haptic feedback for iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animation for press effect
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Banner card shadow based on platform
  const bannerShadow = tw`rounded-xl overflow-hidden`;

  return (
    <Animated.View 
      style={[
        tw`w-11/12 mx-auto h-44 my-4`,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Add shadow wrapper */}
      <View style={[
        tw`w-full h-full rounded-xl shadow-lg`,
        Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 } : tw`shadow-black shadow-opacity-10 shadow-radius-5 elevation-3`
      ]}>
        <Swiper
          autoplay
          autoplayTimeout={4}
          showsPagination
          loop
          activeDotColor="#60B876"
          dotColor="rgba(255,255,255,0.8)"
          dotStyle={tw`w-2 h-2 rounded-full mx-1`}
          activeDotStyle={tw`w-3 h-3 rounded-full mx-1`}
          paginationStyle={tw`absolute bottom-2`}
        >
          {displayAds.map((ad) => (
            <TouchableOpacity 
              key={ad.id} 
              activeOpacity={0.95}
              onPress={handleAdPress}
              style={tw`w-full h-full`}
            >
              <View style={[bannerShadow, tw`w-full h-full`]}>
                <Image
                  source={{ uri: `${IMAGE_URL}${ad.image}` }}
                  style={tw`w-full h-full rounded-xl`}
                  resizeMode="cover"
                />
                
                {/* Add gradient overlay for text readability */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={tw`absolute bottom-0 left-0 right-0 h-16 rounded-b-xl`}
                />
                
                {/* Optional: Add a shine effect animation */}
                <Animated.View 
                  style={[
                    tw`absolute top-0 left-0 right-0 bottom-0 rounded-xl overflow-hidden`,
                    {
                      opacity: 0.1,
                      backgroundColor: 'white',
                      transform: [{
                        translateX: opacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-width, width],
                        }),
                      }],
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </Swiper>
      </View>
    </Animated.View>
  );
};

export default AdBanner;