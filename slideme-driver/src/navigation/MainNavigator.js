import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import JobsScreen from '../screens/job/JobsScreen';
import JobDetailScreen from '../screens/job/JobDetailScreen';
import JobWorkingPickupScreen from '../screens/job/JobWorkingPickupScreen';
import JobWorkingDropoffScreen from '../screens/job/JobWorkingDropoffScreen';
import CarUploadPickUpConfirmationScreen from '../screens/job/CarUploadPickUpConfirmationScreen';
import CarUploadDropOffConfirmationScreen from '../screens/job/CarUploadDropOffConfirmationScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PersonalInfoScreen from '../screens/profile/PersonalInfoScreen';
import EditInfoScreen from '../screens/profile/EditInfoScreen';
import ChatScreen from '../screens/chat/ChatScreen';

// Components
import DriverLocationTracker from '../components/common/DriverLocationTracker';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator สำหรับหน้า Home
const HomeStackNavigator = ({ userData }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
}

// Stack Navigator สำหรับหน้า Profile
const ProfileStackNavigator = ({ userData, handleLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
}

const MainNavigator = ({ userData }) => {
  const handleLogout = () => {
    // ลบข้อมูลผู้ใช้จาก AsyncStorage ที่ auth service
    import('../services/auth').then(({ logout }) => {
      logout();
      // เนื่องจาก checkAuth จะตรวจสอบใหม่ที่ AppNavigator จึงควรให้ reload app
      // โดยตรงหรือใช้ context API เพื่อจัดการสถานะการล็อกอินแทน
    });
  };

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
            tabBarStyle: [
              shouldHideTabBar ? { display: "none" } : {},
              tw`bg-white border-t border-gray-300 shadow-md h-21`,
            ],
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === "HomeTab") {
                iconName = "home";
              } else if (route.name === "History") {
                iconName = "history";
              } else if (route.name === "ProfileTab") {
                iconName = "account";
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: "#60B876",
            tabBarInactiveTintColor: "gray",
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
                  { fontFamily: "Mitr-Regular", fontSize: 12, color },
                  focused ? tw`text-green-500` : tw`text-gray-400`,
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
                  { fontFamily: "Mitr-Regular", fontSize: 12, color },
                  focused ? tw`text-green-500` : tw`text-gray-400`,
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
                  { fontFamily: "Mitr-Regular", fontSize: 12, color },
                  focused ? tw`text-green-500` : tw`text-gray-400`,
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