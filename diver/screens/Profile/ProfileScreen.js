import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useState } from "react";
import tw from "twrnc";
import { IP_ADDRESS } from "../../config";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation, userData, onLogout }) {
  const [driverScore, setDriverScore] = useState(0); // Driver score

  const handleLogout = () => {
    Alert.alert("ยืนยันการออกจากระบบ", "คุณแน่ใจว่าต้องการออกจากระบบหรือไม่?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ยืนยัน",
        onPress: () => {
          if (typeof onLogout === "function") {
            onLogout();
          }
        },
      },
    ]);
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

  return (
    <SafeAreaView
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
      ]}
    >
      {/* Profile Row Container */}
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

      {/* Options Section */}
      <View style={tw`flex-1 w-full bg-white mt-4`}>
        {/* Personal Info Section */}
        <TouchableOpacity
          style={tw`border-b border-gray-200 p-4`}
          onPress={() => navigation.navigate("PersonalInfo", { userData })}
        >
          <Text style={[styles.globalText, tw`text-lg text-gray-600`]}>
            ข้อมูลส่วนตัว
          </Text>
        </TouchableOpacity>
        {/* Edit Info Section */}
        <TouchableOpacity
          style={tw`border-b border-gray-200 p-4`}
          onPress={() => navigation.navigate("EditInfo", { userData })}
        >
          <Text style={[styles.globalText, tw`text-lg text-gray-600`]}>
            แก้ไขข้อมูล
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={tw`p-4`}>
        <TouchableOpacity
          style={tw`w-full py-3 rounded bg-[#60B876]`}
          onPress={handleLogout}
        >
          <Text
            style={[
              styles.globalText,
              tw`text-center text-white text-base`,
            ]}
          >
            ออกจากระบบ
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles for global font integration
const styles = {
  globalText: {
    fontFamily: "Mitr-Regular",
  },
};
