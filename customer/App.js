import React, { useState, useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";

import { UserContext } from "../customer/UserContext";
import { UserProvider } from "./UserContext";
import {
  BorderlessButton,
  gestureHandlerRootHOC,
} from "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Home from "./pages/homePage/Home";
import MapDetail from "./pages/Mapdetail/Mapdetail";
import Order from "./pages/detailOrder/Order";
import Loginpage from "./pages/LoginPage/Loginpage";
import HistoryPage from "./pages/historyPage/History";
import PaymentMethodsListScreen from "./pages/PaymentMethod/PaymentMethodsListScreen";
import AddPaymentMethod from "./pages/PaymentMethod/AddPaymentMethod";
import MessageBoxScreen from "./pages/MessageBoxScreen/MessageBoxScreen";
import UserProfile from "./pages/userProfile/userProfile";
import MapPage from "./pages/MapPage/MapPage";
import PaymentPage from "./pages/paymentPage/PaymentPage";
import ViewOrder from "./pages/viewOrder/ViewOrder";
import Rating from "./pages/Rating/Rating";
import tw from "twrnc";
import PhoneVerify from "./pages/PhoneVerify/PhoneVerify";
import InfoCustomer from "./pages/InfoCustomer/InfoCustomer";
import EditProfile from "./pages/editProfile/editProfile";
import AddressPage from "./pages/addressPage/addressPage";
import ChooseOffer from "./pages/chooseOffer/ChooseOffer";
import Addmap from "./pages/addressPage/bookmap/Bookmap";
import Bookmarklist from "./pages/addressPage/Bookmarklist";
import ChatScreen from "./pages/chat/ChatScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();



function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#3DE183" },
        headerTintColor: "black",
        headerTitleStyle: { fontFamily: "Mitr-Regular", fontSize: 18 },
        borderBottomWidth: 0,
        shadowOpacity: 0,
      }}
    >
      <Stack.Screen
        name="HomePage"
        component={Home}
        options={{ headerShown: false }}
        style={{ flex: 1 }}
      />
      <Stack.Screen
        name="Mapdetail"
        component={MapDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MapPage"
        component={MapPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Order" component={Order}  options={{ headerShown: false }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="ChooseOffer" component={ChooseOffer} options={{ headerShown: false }}/>
      <Stack.Screen name="payment" component={PaymentPage}  options={{ headerShown: false }}/>
      <Stack.Screen name="AddMethod" component={AddPaymentMethod} options={{ headerShown: false }}/>
      <Stack.Screen name="viewOrder" component={ViewOrder} options={{ headerShown: false }}/>
      <Stack.Screen name="Rating" component={Rating} options={{ headerShown: false }}/>

    </Stack.Navigator>
  );
}

function PaymentMethodsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#3DE183" },
        headerTintColor: "black",
        headerTitleStyle: { fontFamily: "Mitr-Regular", fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="PaymentMethodsList"
        component={PaymentMethodsListScreen}
        options={{ title: "วิธีการชำระเงิน" , headerShown: false}}
      />
      <Stack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethod}
        options={{ title: "เพิ่มวิธีการชำระเงิน" , headerShown: false}}
      />
    </Stack.Navigator>
  );
}

const UserProfileTab = ({ onLogout }) => {
  return <UserProfileStack onLogout={onLogout} />;
};

function UserProfileStack({ onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#3DE183" },
        headerTintColor: "black",
        headerTitleStyle: { fontFamily: "Mitr-Regular", fontSize: 18 },
        borderBottomWidth: 0,
        shadowOpacity: 0,
      }}
    >
      <Stack.Screen name="UserProfile" options={{ title: "โปรไฟล์ผู้ใช้", headerShown: false }}>
        {(props) => <UserProfile {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="PaymentMethodsStack"
        component={PaymentMethodsStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="userHistoryPage"
        component={HistoryPage}
        options={{ title: "กลับ", headerShown: false }}
      />
      <Stack.Screen
        name="editProfile"
        component={EditProfile}
        options={{ title: "แก้ไขข้อมูล", headerShown: false }}
      />
      <Stack.Screen
        name="addressPage"
        component={AddressPage}
        options={{ title: "แก้ไขข้อมูลที่อยู่", headerShown: false }}
      />
      <Stack.Screen
        name="addMapFav"
        component={Addmap}
        options={{ title: "เพิ่มบุ๊คมาร์ก", headerShown: false }}
      />
      <Stack.Screen
        name="Bookmarklist"
        component={Bookmarklist}
        options={{ title: "Bookmark", headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AuthStack({ onLogin }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {() => <Loginpage onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="PhoneVerify" options={{ headerShown: false }}>
        {() => <PhoneVerify onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="InfoCustomer" options={{ headerShown: false }}>
        {() => <InfoCustomer onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { clearUserData } = useContext(UserContext);

  const [fontsLoaded] = useFonts({
    "Mitr-Regular": require("./assets/fonts/Mitr-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View>
        <ActivityIndicator size="large" color="#60B876" />
      </View>
    );
  }
  const handleLogout = () => {
    clearUserData(); // Clear user data
    setIsLoggedIn(false); // Set login state to false
    console.log("User logged out successfully"); // Debugging log
  };
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const hiddenScreens = [
    "Order",
    "ChatScreen",
    "ChooseOffer",
    // "ViewOrder",
    "PaymentPage",
    // "Rating",
    "PaymentMethodsStack",
    "editProfile",
    "Bookmarklist",
  ];
  
  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Tab.Navigator
          screenOptions={({ route, navigation }) => {
            const shouldHideTabBar = navigation
              .getState()
              .routes.some((r) => {
                const isHidden = r.state?.routes
                  ? r.state.routes.some((sr) => hiddenScreens.includes(sr.name))
                  : hiddenScreens.includes(r.name);
  
                return isHidden;
              });
  
            return {
              headerShown: false,
              tabBarStyle: [
                shouldHideTabBar ? { display: "none" } : {},
                tw`bg-white border-t border-gray-300 shadow-md`, 
              ],
              tabBarIcon: ({ color, size }) => {
                let iconName;
                switch (route.name) {
                  case "Home":
                    iconName = "home";
                    break;
                  case "ประวัติการใช้บริการ":
                    iconName = "history";
                    break;
                  case "กล่องข้อความ":
                    iconName = "email";
                    break;
                  case "โปรไฟล์ผู้ใช้":
                    iconName = "account";
                    break;
                  default:
                    iconName = "circle";
                }
                return <Icon name={iconName} size={size} color={color}/>;
              },
              tabBarActiveTintColor: "#60B876",
              tabBarInactiveTintColor: "#555D65",
              tabBarLabelStyle: { fontFamily: "Mitr-Regular", fontSize: 14 },
            };
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{ headerShown: false, title: "หน้าหลัก" }}
          />
          <Tab.Screen
            name="ประวัติการใช้บริการ"
            component={HistoryPage}
            options={{ headerShown: false, title: "ประวัติการใช้บริการ" }}
          />
          <Tab.Screen
            name="กล่องข้อความ"
            component={MessageBoxScreen}
            options={{ headerShown: false, title: "กล่องข้อความ" }}
          />
          <Tab.Screen name="โปรไฟล์ผู้ใช้" options={{ headerShown: false }}>
            {() => <UserProfileTab onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      ) : (
        <AuthStack onLogin={handleLogin} />
      )}
    </NavigationContainer>
  );  
};  

const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default gestureHandlerRootHOC(App);
