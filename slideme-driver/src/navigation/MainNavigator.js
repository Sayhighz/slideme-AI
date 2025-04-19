import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import JobsScreen from '../screens/job/JobsScreen';
import JobDetailScreen from '../screens/job/JobDetailScreen';
import JobWorkingPickupScreen from '../screens/job/JobWorkingPickupScreen';
import JobWorkingDropoffScreen from '../screens/job/JobWorkingDropoffScreen';
import CarUploadPickUpConfirmationScreen from '../screens/job/CarUploadPickupConfirmationScreen';
import CarUploadDropOffConfirmationScreen from '../screens/job/CarUploadDropoffConfirmationScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PersonalInfoScreen from '../screens/profile/PersonalInfoScreen';
import EditInfoScreen from '../screens/profile/EditInfoScreen';
import ChatScreen from '../screens/chat/ChatScreen';

// Components
import DriverLocationTracker from '../components/common/DriverLocationTracker';

// Constants
import { COLORS, FONTS } from '../constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator สำหรับหน้า Home
const HomeStackNavigator = ({ userData }) => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobsScreen"
        component={JobsScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobWorkingPickup"
        component={JobWorkingPickupScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="CarUploadPickUpConfirmation"
        component={CarUploadPickUpConfirmationScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobWorkingDropoff"
        component={JobWorkingDropoffScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="CarUploadDropOffConfirmation"
        component={CarUploadDropOffConfirmationScreen}
        initialParams={{ userData }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator สำหรับหน้า Profile
const ProfileStackNavigator = ({ userData, handleLogout }) => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        children={(props) => (
          <ProfileScreen
            {...props}
            userData={userData}
            onLogout={handleLogout}
          />
        )}
      />
      <Stack.Screen
        name="PersonalInfo"
        component={PersonalInfoScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="EditInfo"
        component={EditInfoScreen}
        initialParams={{ userData }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = ({ userData }) => {
  const insets = useSafeAreaInsets();
  
  // หน้าจอที่ไม่ควรแสดง Tab Bar
  const hiddenScreens = [
    "JobsScreen",
    "JobDetail",
    "JobWorkingPickup",
    "CarUploadPickUpConfirmation",
    "JobWorkingDropoff",
    "CarUploadDropOffConfirmation",
    "PersonalInfo",
    "EditInfo",
    "ChatScreen"
  ];

  const handleLogout = async () => {
    try {
      const { logout } = await import('../services/auth');
      await logout();
      if (__DEV__) {
        const DevSettings = require('react-native').DevSettings;
        DevSettings.reload();
      }
      // Context API จะจัดการสถานะการล็อกอินที่ AppNavigator
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DriverLocationTracker driverId={userData?.driver_id} />
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          // ตรวจสอบว่าควรซ่อน tab bar หรือไม่
          const shouldHideTabBar = navigation
            .getState()
            .routes.some((r) =>
              r.state?.routes
                ? r.state.routes.some((sr) => hiddenScreens.includes(sr.name))
                : hiddenScreens.includes(r.name)
            );

          return {
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarStyle: [
              shouldHideTabBar ? { display: "none" } : {},
              tw`bg-white border-t border-gray-200`,
              {
                height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
                paddingTop: 10,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: -2,
                },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 5,
              }
            ],
            tabBarIcon: ({ color, size, focused }) => {
              let iconName;
              
              if (route.name === "HomeTab") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "History") {
                iconName = focused ? "history" : "history";
              } else if (route.name === "ProfileTab") {
                iconName = focused ? "account" : "account-outline";
              }
              
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.PRIMARY,
            tabBarInactiveTintColor: COLORS.GRAY_600,
          };
        }}
      >
        {/* Home Tab */}
        <Tab.Screen
          name="HomeTab"
          options={{
            title: "หน้าหลัก",
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={[
                  { 
                    fontFamily: FONTS.FAMILY.REGULAR, 
                    fontSize: 12, 
                    color,
                    marginBottom: Platform.OS === 'ios' ? 0 : 5
                  },
                  focused ? tw`font-medium` : tw`font-normal`,
                ]}
              >
                หน้าหลัก
              </Text>
            ),
          }}
        >
          {() => <HomeStackNavigator userData={userData} />}
        </Tab.Screen>

        {/* History Tab */}
        <Tab.Screen
          name="History"
          options={{
            title: "ประวัติรับงาน",
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={[
                  { 
                    fontFamily: FONTS.FAMILY.REGULAR, 
                    fontSize: 12, 
                    color,
                    marginBottom: Platform.OS === 'ios' ? 0 : 5
                  },
                  focused ? tw`font-medium` : tw`font-normal`,
                ]}
              >
                ประวัติรับงาน
              </Text>
            ),
          }}
        >
          {() => <HistoryScreen userData={userData} />}
        </Tab.Screen>

        {/* Profile Tab */}
        <Tab.Screen
          name="ProfileTab"
          options={{
            title: "โปรไฟล์",
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={[
                  { 
                    fontFamily: FONTS.FAMILY.REGULAR, 
                    fontSize: 12, 
                    color,
                    marginBottom: Platform.OS === 'ios' ? 0 : 5
                  },
                  focused ? tw`font-medium` : tw`font-normal`,
                ]}
              >
                โปรไฟล์
              </Text>
            ),
          }}
        >
          {() => (
            <ProfileStackNavigator
              userData={userData}
              handleLogout={handleLogout}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

export default MainNavigator;