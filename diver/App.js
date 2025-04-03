// Driver
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useFonts } from "expo-font";
import { ActivityIndicator, View, Text, Alert } from "react-native";

// Import screens and components
import HomeScreen from "./screens/HomeScreen/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen/HistoryScreen";
import ProfileScreen from "./screens/Profile/ProfileScreen";
import PersonalInfoScreen from "./screens/Profile/PersonalInfoScreen";
import EditInfoScreen from "./screens/Profile/EditInfoScreen";
import JobsScreen from "./screens/Job/JobsScreen";
import JobDetail from "./screens/Job/JobDetail";
import JobWorking_Pickup_Screen from "./screens/Job/JobWorking_Pickup_Screen";
import JobWorking_Dropoff_Screen from "./screens/Job/JobWorking_Dropoff_Screen";
import NotificationRequest from "./screens/NotificationRequest";
import CarUploadPickUpConfirmation from "./screens/Job/CarUploadPickUpConfirmation";
import CarUploadDropOffConfirmation from "./screens/Job/CarUploadDropOffConfirmation";
import DriverLocation from "./screens/DriverLocation";
import HomeLogin from "./screens/LoginDriver/HomeLogin";
import FirstRegister from "./screens/LoginDriver/FirstRegister";
import SecondRegister from "./screens/LoginDriver/SecondRegister";
import ThirdRegister from "./screens/LoginDriver/ThirdRegister";
import FourthRegister from "./screens/LoginDriver/FourthRegister";
import FifthRegister from "./screens/LoginDriver/FifthRegister";
import SixRegister from "./screens/LoginDriver/SixRegister";
import ChatScreen from "./screens/chat/ChatScreen";

// Initialize Stack and Tab Navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Home Stack Navigator
 * Handles navigation for Home and Job-related screens.
 */
function HomeStackNavigator({ userData }) {
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
        component={JobDetail}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobWorking_Pickup"
        component={JobWorking_Pickup_Screen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="CarUploadPickUpConfirmation"
        component={CarUploadPickUpConfirmation}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="JobWorking_Dropoff"
        component={JobWorking_Dropoff_Screen}
        initialParams={{ userData }}
      />
      <Stack.Screen
        name="CarUploadDropOffConfirmation"
        component={CarUploadDropOffConfirmation}
        initialParams={{ userData }}
      />
    </Stack.Navigator>
  );
}

/**
 * Profile Stack Navigator
 * Handles navigation for Profile and Edit-related screens.
 */
function ProfileStackNavigator({ userData, handleLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileMain"
        options={{ headerShown: false }}
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

/**
 * Authentication Stack Navigator
 * Handles navigation for Login and Registration screens.
 */
function AuthNavigator({ handleLogin }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeLogin">
        {(props) => <HomeLogin {...props} onLogin={handleLogin} />}
      </Stack.Screen>
      <Stack.Screen name="FirstRegister" component={FirstRegister} />
      <Stack.Screen name="SecondRegister" component={SecondRegister} />
      <Stack.Screen name="ThirdRegister" component={ThirdRegister} />
      <Stack.Screen name="FourthRegister" component={FourthRegister} />
      <Stack.Screen name="FifthRegister" component={FifthRegister} />
      <Stack.Screen name="SixRegister" component={SixRegister} />
    </Stack.Navigator>
  );
}

/**
 * Main Application Component
 */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDataNa, setUserDataNa] = useState({
    profile_picture: "123",
    first_name: "123",
    last_name: "123",
    driver_id: 10,
    average_rating: 0,
  });

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    "Mitr-Regular": require("./assets/fonts/Mitr-Regular.ttf"),
  });

  // Show loading spinner if fonts are not yet loaded
  if (!fontsLoaded) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#60B876" />
      </View>
    );
  }

  // Handle user login action
  const handleLogin = (user) => {
    // Alert.alert("สำเร็จ", "เข้าสู่ระบบสำเร็จ");
    setUserDataNa({
      // profile_picture:user.profile_picture || "driver_profile.jpeg",
      first_name: "sadsad",
      last_name:  "asdasd",
      driver_id: user.driver_id,
      average_rating:  3,
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserDataNa({
      profile_picture: "",
      first_name: "",
      last_name: "",
      driver_id: null,
      average_rating: 0,
    });
  };

  // Mock user data for demonstration purposes
  // const userDataNa = {
  //   profile_picture: "photos-1732037296004-612856125.jpeg", // เอาจาก table users
  //   first_name: "John", // เอาจาก table users
  //   last_name: "Doe", // เอาจาก table users
  //   driver_id: 6, // เอาจาก table users
  // };

  // Render Authentication Navigator if the user is not logged in
  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <AuthNavigator handleLogin={handleLogin} />
      </NavigationContainer>
    );
  }

  // Render Main App Navigation
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <DriverLocation driver_id={userDataNa.driver_id} />
        <Tab.Navigator
          screenOptions={({ route, navigation }) => {
            const hiddenScreens = [
              "JobsScreen",
              "JobDetail",
              "JobWorking_Pickup",
              "CarUploadPickUpConfirmation",
              "JobWorking_Dropoff",
              "CarUploadDropOffConfirmation",
              "PersonalInfo",
              "EditInfo",
            ];

            // Check if any of the hidden screens is currently active
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
            {() => <HomeStackNavigator userData={userDataNa} />}
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
            {() => <HistoryScreen userData={userDataNa} />}
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
                userData={userDataNa}
                handleLogout={handleLogout}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}

// Global styles
const styles = {
  globalText: {
    fontFamily: "Mitr-Regular",
  },
};
