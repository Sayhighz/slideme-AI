// HomeScreen.js
import React, { useRef, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  TouchableOpacity, 
  Text, 
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

// Import Components
import HomeHeader from '../../components/home/HomeHeader.js';
import ProfitDisplay from '../../components/home/ProfitDisplay.js';
import OffersList from '../../components/home/OffersList.js';
import AdBanner from '../../components/home/AdBanner.js';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userData = {} } = route.params || {};
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  // References for components
  const lottieRef = useRef(null);

  // Notice array for ad banners 
  const notices = [
    { id: 1, image: 'ads1.png' },
    { id: 2, image: 'ads2.png' },
    { id: 3, image: 'ads3.png' },
  ];

  useEffect(() => {
    // Animation sequence
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Play Lottie animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh with slight delay
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleJobSearch = () => {
    // Trigger haptic feedback for button press
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (userData?.driver_id) {
      // Animate the button press
      Animated.sequence([
        Animated.timing(buttonAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.navigate('JobsScreen', { driver_id: userData.driver_id });
      });
    } else {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
    }
  };

  return (
    <SafeAreaView style={[
      tw`flex-1 bg-white`,
      { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-24`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#60B876']}
            tintColor="#60B876"
          />
        }
      >
        {/* Header with animation */}
        <Animated.View 
          style={[
            tw`w-full`,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateY }] 
            }
          ]}
        >
          <HomeHeader userData={userData} />
        </Animated.View>

        {/* Profit Display with animation */}
        <Animated.View 
          style={[
            tw`w-full`,
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: translateY },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          <ProfitDisplay driverId={userData?.driver_id} />
        </Animated.View>

        {/* Offers List with animation */}
        <Animated.View 
          style={[
            tw`w-full mt-2`,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateY }] 
            }
          ]}
        >
          <OffersList 
            driverId={userData?.driver_id} 
            navigation={navigation} 
          />
        </Animated.View>

        {/* Ad Banner with animation */}
        <Animated.View 
          style={[
            tw`w-full mt-4`,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateY }] 
            }
          ]}
        >
          <AdBanner ads={notices} />
        </Animated.View>
      </ScrollView>

      {/* Job Search Button with animation and gradient */}
      <Animated.View 
        style={[
          tw`absolute w-full items-center`,
          {
            bottom: Math.max(insets.bottom + 8, 16), // Ensure proper spacing on devices with or without home indicator
            opacity: buttonAnim,
            transform: [{ scale: buttonAnim }],
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleJobSearch}
          style={tw`w-10/12`}
        >
          <LinearGradient
            colors={['#60B876', '#3C9D57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`rounded-full px-4 py-3 items-center shadow-lg`}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <LottieView
                ref={lottieRef}
                source={require('../../assets/animations/search-animation.json')}
                style={tw`w-6 h-6 mr-2`}
                autoPlay
                loop
              />
              <Text style={[{ fontFamily: 'Mitr-Regular' }, tw`text-white text-lg font-medium`]}>
                ค้นหางาน
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HomeScreen;