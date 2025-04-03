import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { UserContext } from "../../UserContext";
import { IP_ADDRESS } from "../../config";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

const UserProfile = ({ navigation, onLogout }) => {
  const { userData, setUserData } = useContext(UserContext);
  const [firstName, setFirstName] = useState(userData.first_name || "");
  const [lastName, setLastName] = useState(userData.last_name || "");
  const [email, setEmail] = useState(userData.email || "");
  const [profileBgColor, setProfileBgColor] = useState("");

  useEffect(() => {
    
  },[firstName, lastName, email]);
  useEffect(() => {
    const randomColor = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#A133FF",
      "#FF8C33",
    ][Math.floor(Math.random() * 6)];
    setProfileBgColor(randomColor);
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/auth/edit_profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            user_id: userData.user_id,
          }),
        }
      );
      if (!response.ok) {
        Alert.alert("Error", `HTTP Error: ${response.status}`);
        return;
      }
      const result = await response.json();
      if (result.Status) {
        setUserData({
          ...userData,
          first_name: firstName,
          last_name: lastName,
          email,
        });
        Alert.alert("Success", "บันทึกข้อมูลสำเร็จ");
      } else {
        Alert.alert("Error", result.Error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <>
      <HeaderWithBackButton showBackButton={false} title="ข้อมูลส่วนตัว" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={tw`flex-1 bg-gray-100`}>
          {/* Profile Picture and User Info */}
          <View style={tw`flex-row items-center mx-5`}>
            {/* Profile Picture */}
            <TouchableOpacity
              style={[
                tw`w-32 h-32 rounded-full items-center justify-center mr-4`,
                { backgroundColor: profileBgColor },
              ]}
              onPress={() => {
                // Optionally change color on press
                const newColor =
                  ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#FF8C33"][
                    Math.floor(Math.random() * 6)
                  ];
                setProfileBgColor(newColor);
                
              }}
            >
              <Ionicons name="person" size={70} color="white" />
            </TouchableOpacity>

            {/* User Info */}
            <View>
              <View style={tw`flex-row items-center mb-2`}>
                <Text style={[tw`text-black text-lg mr-1`, { fontFamily: "Mitr-Regular" }]}>
                  {userData.first_name ? userData.first_name : userData.phone_number }
                </Text>
                <Text style={[tw`text-black text-lg`, { fontFamily: "Mitr-Regular" }]}>
                  {userData.last_name || ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={tw`mx-5 mt-6`}>
            <TouchableOpacity
              style={[tw`py-3 rounded-lg mb-3`, { backgroundColor: "#60B876" }]}
              onPress={() => navigation.navigate("editProfile")}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="create" size={24} color="white" />
                <Text style={[tw`text-white text-left ml-2`, { fontFamily: "Mitr-Regular" }]}>
                  แก้ไขข้อมูลผู้ใช้
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tw`py-3 rounded-lg mb-3`, { backgroundColor: "#60B876" }]}
              onPress={() => navigation.navigate("Bookmarklist")}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="heart" size={24} color="white" />
                <Text style={[tw`text-white text-left ml-2`, { fontFamily: "Mitr-Regular" }]}>
                  เพิ่มรายการโปรด
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tw`py-3 rounded-lg mb-3`, { backgroundColor: "#60B876" }]}
              onPress={() => navigation.navigate("PaymentMethodsStack")}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="card" size={24} color="white" />
                <Text style={[tw`text-white text-left ml-2`, { fontFamily: "Mitr-Regular" }]}>
                  ช่องทางการชำระเงิน
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tw`py-3 rounded-lg mb-3 mt-40 bg-gray-400`]}
              onPress={onLogout}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="log-out" size={24} color="white" />
                <Text style={[tw`text-white text-left ml-2`, { fontFamily: "Mitr-Regular" }]}>
                  ออกจากระบบ
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
};

export default UserProfile;
