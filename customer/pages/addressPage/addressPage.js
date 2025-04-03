import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  SafeAreaView,
  Dimensions,
  Alert,
  StyleSheet,
} from "react-native";
import tw, { style } from "twrnc"; // Assuming you have installed tailwind-rn using `npm install tailwind-rn` or equivalent
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { Menu, TextInput, Provider } from "react-native-paper";
import { Provider as PaperProvider } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import bookmap from "./bookmap/Bookmap";
import { IP_ADDRESS } from "../../config";
import { UserContext } from "../../UserContext";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";
import SubmitButton from "../../components/SubmitButton";

const AddressPage = ({ navigation }) => {
  // const [houseNumber, setHouseNumber] = useState('')
  // const [street, setStreet] = useState('')
  // const [subdistrict, setSubdistrict] = useState('')
  // const [district, setDistrict] = useState('')
  // const [province, setProvince] = useState('')
  // const [postalCode, setPostalCode] = useState('')
  const [nameBookMark, setNameBookMark] = useState("");
  const [category, setCategory] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const { width, height } = Dimensions.get("window");
  const responsiveWidth = width * 0.9;
  const responsiveHeight = height * 0.2;

  const { userData } = useContext(UserContext);

  const route = useRoute();
  const address = route.params?.address_id || "ไม่ระบุ";
  const vehicle_type = route.params?.category || "ประเภทของรถสไลด์";
  const save_name = route.params?.nameBookMark || "ไม่ระบุ";
  const origin_lat = route.params?.origin_lat || "ไม่ระบุ";
  const origin_long = route.params?.origin_long || "ไม่ระบุ";
  const destination_lat = route.params?.destination_lat || "ไม่ระบุ";
  const destination_long = route.params?.destination_long || "ไม่ระบุ";
  const confirmOrigin = route.params?.confirmOrigin || "ไม่ระบุ";
  const confirmDestination = route.params?.confirmDestination || "ไม่ระบุ";

  useEffect(() => {
    console.log(save_name);
  }, [save_name, confirmOrigin, confirmDestination, category]);
  const handleSave = async () => {
    if (!nameBookMark || !confirmOrigin || !confirmDestination || !category) {
      Alert.alert("Error", "Please fill all the required fields.");
      return;
    }

    const payload = {
      user_id: userData.user_id, // Replace with the actual user ID
      save_name: nameBookMark,
      location_from: confirmOrigin,
      pickup_lat: origin_lat, // Replace with actual lat/lng
      pickup_long: origin_long,
      location_to: confirmDestination,
      dropoff_lat: destination_lat,
      dropoff_long: destination_long,
      vahicle_type: category,
      address_id: address,
    };

    if (save_name !== "ไม่ระบุ") {
      try {
        const response = await fetch(
          `http://${IP_ADDRESS}:4000/customer/edit_address`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();
        console.log(payload);

        if (response.ok && data.Status) {
          Alert.alert("Success", "Bookmark Edit successfully!", [
            { text: "OK", onPress: () => navigation.navigate("Bookmarklist") },
          ]);
          // navigation.navigate("Bookmarklist");
        } else {
          Alert.alert("Error", data.Error || "Failed to add bookmark.");
        }
      } catch (error) {
        Alert.alert("Error", error.message || "An error occurred.");
      }
    } else {
      try {
        const response = await fetch(
          `http://${IP_ADDRESS}:4000/customer/add_bookmark`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();

        if (response.ok && data.Status) {
          Alert.alert("Success", "Bookmark added successfully!");
          navigation.navigate("Bookmarklist");
        } else {
          Alert.alert("Error", data.Error || "Failed to add bookmark.");
        }
      } catch (error) {
        Alert.alert("Error", error.message || "An error occurred.");
      }
    }
  };

  const categoryOptions = [
    { label: "Mini Slide Car", value: "mini" },
    { label: "Standard Slide Car", value: "standard" },
    { label: "Heavy Duty Slide Car", value: "heavy" },
    { label: "Special Slide Car", value: "special" },
  ];

  const selectCategory = (label) => {
    setCategory(label);
    setMenuVisible(false); // Close the menu after selecting a category
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  return (
    <>
      <HeaderWithBackButton
        showBackButton={true}
        title="รายการโปรด"
        onPress={() => navigation.goBack()}
      />
      <SafeAreaView
        style={[
          tw`flex-1 bg-white items-center justify-between `,
          { height: height },
        ]}
      >
        <PaperProvider>
          <View style={tw` bg-white `}>
            <Text style={[styles.globalText, tw`mt-2 mb-1 ml-3 text-sm text-gray-600`]}>
              ชื่อรายการโปรด
            </Text>
            <TextInput
              style={[
                styles.globalText,
                tw`w-full h-12 border border-gray-300 shadow-md bg-white rounded-lg px-3 mb-3`,
              ]}
              placeholder={save_name}
              mode="outlined"
              value={nameBookMark}
              onChangeText={setNameBookMark}
              maxLength={20}
            />

<Text style={[styles.globalText, tw`mt-2 mb-1 ml-3 text-sm text-gray-600`]}>
              จุดรับส่ง
            </Text>
            <TouchableOpacity
              style={[
                { width: responsiveWidth, height: height * 0.12 },
                tw`p-2 mb-4 mt-1 justify-around bg-white rounded-lg border border-gray-300 shadow-md`,
              ]}
              onPress={() =>
                navigation.navigate("addMapFav", {
                  save_name,
                  category,
                  address,
                })
              }
              // onPress={() => navigation.navigate("Mapdetail")}
            >
              <View style={[tw`flex-row px-4 items-center`]}>
          <MaterialIcons name="place" size={24} color="red" />
          <Text style={[styles.globalText, tw`text-black ml-2`]}>ต้นทาง </Text>
          <Text style={[styles.globalText, tw`text-gray-500 ml-1`]}
          >
            {truncateText(confirmOrigin) || "โปรดระบุต้นทาง"}
          </Text>
        </View>

        {/* Divider Line */}
        <View style={tw`border-t border-gray-300 my-2`} />

        {/* Destination Row */}
        <View style={[tw`flex-row px-4 items-center `]}>
          <MaterialIcons name="place" size={24} color="green" />
          <Text style={[styles.globalText, tw`text-black ml-2`]}>ปลายทาง </Text>
          <Text style={[styles.globalText, tw`text-gray-500 ml-1` ]
            
          }
         
          >
            {truncateText(confirmDestination) || "โปรดระบุปลายทาง"}
          </Text>
        </View>
            </TouchableOpacity>

            <View style={[tw`w-full items-center mt-2`]}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                mode="elevated"
                anchor={
                  <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={[
                      { width: responsiveWidth, height: height * 0.12 },
                      tw`flex-col items-center justify-center bg-white p-4 rounded-lg border border-gray-300 shadow-md mb-4`,
                    ]}
                  >
                    <FontAwesome5
                      name="car"
                      size={25}
                      color="black"
                      style={tw`mb-2`}
                    />
                    <Text style={[styles.globalText, tw`text-lg`]}>
                      {category ? category : vehicle_type}
                    </Text>
                  </TouchableOpacity>
                }
                style={[
                  tw`flex-1 items-center justify-center left-30 right-15`,
                  ,
                ]}
              >
                {categoryOptions.map((option) => (
                  <Menu.Item
                    key={option.value}
                    onPress={() => selectCategory(option.label)}
                    title={option.label}
                    style={tw`bg-white`}
                  />
                ))}
              </Menu>
            </View>

            <View
              style={[
                tw`flex items-center justify-end  `,
                { height: height * 0.331 },
              ]}
            >
            </View>
          </View>
        </PaperProvider>
                <SubmitButton
                  onPress={handleSave}
                  title="บันทึก"
                />
      </SafeAreaView>
    </>
  );
};
const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
export default AddressPage;
