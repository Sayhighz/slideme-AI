import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { IP_ADDRESS } from "../../config";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function PersonalInfoScreen({ navigation, route }) {
  const { userData = {} } = route.params || {};
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverScore, setDriverScore] = useState(0); // Driver score

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return "ไม่พบข้อมูล";
    const formattedDate = new Date(date).toISOString().split("T")[0];
    return formattedDate;
  };

  useFocusEffect(
    React.useCallback(() => {
      const driverScore = async () => {
        try {
          const response = await fetch(
            `http://${IP_ADDRESS}:4000/driver/score?driver_id=${userData?.driver_id}`
          );
          const data = await response.json();
          if (data.Status && Array.isArray(data.Result) && data.Result.length > 0) {
            setDriverScore(data.Result[0].Score);
          } else {
            setDriverScore(0);
          }
        } catch (error) {
          console.error("Error fetching profit_today:", error);
          setDriverScore(0);
        }
      };
  
      driverScore();
    }, [userData?.driver_id])
  );

  // Fetch user information
  const fetchData = async () => {
    setLoading(true); // Start loading state
    setError(null); // Reset error state
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/driver/getinfo?driver_id=${userData?.driver_id}`
      );
      const data = await response.json();
      console.log(data,userData?.driver_id);
      if (data) {
        const user = data.Result[0];
        // Format date fields
        user.id_expiry_date = formatDate(user.id_expiry_date);
        setUserInfo(user);
      } else {
        setError("ไม่สามารถดึงข้อมูลได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchData);
    return unsubscribe; // Cleanup the listener on unmount
  }, [navigation]);

  // Display loading spinner
  if (loading) {
    return (
      <SafeAreaView
        style={[
          tw`flex-1 bg-white`,
          {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <ActivityIndicator size="large" color="#00ff00" style={tw`mt-10`} />
      </SafeAreaView>
    );
  }

  // Display error message
  if (error) {
    return (
      <SafeAreaView
        style={[
          tw`flex-1 bg-white`,
          {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={[styles.globalText, tw`text-red-500 text-lg`]}>
            {error}
          </Text>
          <TouchableOpacity
            style={tw`py-3 px-4 rounded bg-gray-200 mt-4`}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.globalText, tw`text-gray-700 text-base`]}>
              กลับ
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
      ]}
    >
      {/* Header */}
      <View style={tw`flex-row items-center p-4 border-b border-gray-200`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} style={tw`text-gray-800`} />
        </TouchableOpacity>
        <Text
          style={[styles.globalText, tw`text-xl text-gray-800 ml-4`]}
        >
          ข้อมูลส่วนตัว
        </Text>
      </View>

      {/* Profile Picture and Name */}
      <View style={tw`flex-row items-center mt-10 p-2 w-19/20 mx-auto`}>
        <Image
          source={{
            uri: `http://${IP_ADDRESS}:4000/upload/fetch_image?filename=${userData?.profile_picture}`,
          }}
          style={tw`w-24 h-24 rounded-full border-2 border-green-400`}
        />
                      <View style={tw`ml-4`}>
                <Text style={[styles.globalText, tw`text-sm text-gray-400`]}>
                  สวัสดี!
                </Text>
                <Text
                  style={[
                    styles.globalText,
                    tw`text-2xl text-[#60B876]`,
                  ]}
                >
                  {`${userData?.first_name || "ไม่พบข้อมูล"} ${
                    userData?.last_name || ""
                  }`}
                </Text>
                <View style={tw`flex-row items-center`}>
                  <MaterialIcons name="star" size={24} color="orange" style={tw`mr-1`}/>
                <Text style={[styles.globalText, tw`text-lg text-gray-700`]}>
                {driverScore ? driverScore.toFixed(1) : "0.0"}
                </Text>
                </View>
              </View>
      </View>

      {/* User Information */}
      <View style={tw`px-4`}>
        <Text
          style={[styles.globalText, tw`text-lg text-gray-800 mb-4`]}
        >
          ข้อมูลทั่วไป
        </Text>

        {/* License Plate */}
        <View style={tw`flex-row justify-between mb-3`}>
          <Text style={[styles.globalText, tw`text-base text-gray-600`]}>
            เลขทะเบียนพาหนะ
          </Text>
          <Text style={[styles.globalText, tw`text-base text-gray-800`]}>
            {userInfo?.license_plate || "ไม่พบข้อมูล"}
          </Text>
        </View>

        {/* License Expiry */}
        <View style={tw`flex-row justify-between mb-3`}>
          <Text style={[styles.globalText, tw`text-base text-gray-600`]}>
            วันหมดอายุใบขับขี่
          </Text>
          <Text style={[styles.globalText, tw`text-base text-gray-800`]}>
            {userInfo?.id_expiry_date || "ไม่พบข้อมูล"}
          </Text>
        </View>

        {/* Phone Number */}
        <View style={tw`flex-row justify-between mb-3`}>
          <Text style={[styles.globalText, tw`text-base text-gray-600`]}>
            หมายเลขโทรศัพท์
          </Text>
          <Text style={[styles.globalText, tw`text-base text-gray-800`]}>
            {userInfo?.phone_number || "ไม่พบข้อมูล"}
          </Text>
        </View>
      </View>

      {/* Edit Button */}
      <View style={tw`px-4 mt-8`}>
        <TouchableOpacity
          style={tw`py-3 rounded bg-[#60B876]`}
          onPress={() => navigation.navigate("EditInfo", { userData })}
        >
          <Text
            style={[
              styles.globalText,
              tw`text-center text-white text-base`,
            ]}
          >
            แก้ไขข้อมูล
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Font styles
const styles = {
  globalText: {
    fontFamily: "Mitr-Regular",
  },
};
