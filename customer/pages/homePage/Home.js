import React, { useState, useContext } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Swiper from "react-native-swiper";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";
import { UserContext } from "../../UserContext";
import { IP_ADDRESS } from "../../config";

function Home({ navigation }) {
  const { width, height } = Dimensions.get("window");
  const responsiveWidth = width * 0.9;

  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(UserContext);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/customer/getuserbookmarks?user_id=${userData.user_id}`
      );
      const data = await response.json();
      if (data.Status) {
        setBookmarks(data.Result);
      } else {
        console.error(data.Error);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error.message);
    }
    setLoading(false);
  };

  const handleRequestFromBookmark = async (selectedBookmark) => {
    if (false) {
      alert("จากตําแหน่งต้องไม่เว้นว่าง, กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const requestData = {
      customer_id: userData.user_id,
      request_time: formatDateToMySQL(new Date()),
      pickup_lat: selectedBookmark.pickup_lat,
      pickup_long: selectedBookmark.pickup_long,
      location_from: selectedBookmark.location_from,
      dropoff_lat: selectedBookmark.dropoff_lat,
      dropoff_long: selectedBookmark.dropoff_long,
      location_to: selectedBookmark.location_to,
      vehicletype_id: 1,
      booking_time: formatDateToMySQL(new Date()),
      customer_message: null,
    };

    console.log("Request data:", requestData);

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/request/add_request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData && responseData.request_id) {
        Alert.alert(
          "Request submitted successfully!",
          "",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate(
                  "ChooseOffer",
                  {
                    request_id: responseData.request_id,
                  },
                  setModalVisible(false)
                );
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        alert("Request submitted, but no request ID was returned.");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request. Please try again.");
    }
  };

  const openModal = () => {
    setModalVisible(true);
    fetchBookmarks();
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const formatDateToMySQL = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  function truncateText(text, maxLength = 28) {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  const order_status = async () => {
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/customer/order_status/${userData.user_id}`
      );
      const data = await response.json();
      console.log("order_status:", data);
      if (data.Status) {
        navigation.navigate("viewOrder", {
          driverProfile: {
            chooseDriver: {
              request_id: data.Result.request_id,
              id: data.Result.accepted_driver_id,
              customer_id_request: userData.user_id,
            },
          },
        });
      } else if (data.Message === "No accepted records found for customer_id") {
        Alert.alert("ไม่มี Order ที่กำลังทำงานอยู่");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const route = useRoute();
  const ads = [
    {
      id: 1,
      image: `http://${IP_ADDRESS}:4000/upload/fetch_image?filename=ads1.png`,
    },
    {
      id: 2,
      image: `http://${IP_ADDRESS}:4000/upload/fetch_image?filename=ads2.png`,
    },
    {
      id: 3,
      image: `http://${IP_ADDRESS}:4000/upload/fetch_image?filename=ads3.png`,
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "left", "right"]}>
      <View style={[tw`flex-1 items-center justify-center `]}>
        <View style={tw`flex-1 w-full items-center mt-10`}>
          <Text
            style={[
              styles.globalText,
              tw`text-left text-sm mb-[-20px] flex-1 text-gray-500`,
            ]}
          >
            สวัสดี
          </Text>
          <Text
            style={[
              styles.globalText,
              tw`flex-1 text-2xl mt-2 mb-4 text-[#60B876]`,
            ]}
          >
            {userData?.first_name || userData?.phone_number}!
          </Text>

          <View style={tw`flex-5 justify-center shadow-xl`}>
            <TouchableOpacity
              style={tw``}
              onPress={() => navigation.navigate("Order")}
            >
              <LinearGradient
                colors={["#3DE183", "#60B876", "#6CA97C"]}
                style={[
                  tw`flex-1 rounded-lg border border-gray-300 shadow-sm flex-row items-center justify-center`,
                  {
                    width: responsiveWidth,
                    height: height * 0.23,
                    paddingHorizontal: 20,
                  },
                ]}
              >
                <MaterialIcons
                  name="car-repair"
                  size={80}
                  color="white"
                  style={tw`mr-3`}
                />
                <View>
                  <Text
                    style={[
                      styles.globalText,
                      tw`text-white text-xl font-light`,
                    ]}
                  >
                    เรียกบริการ
                  </Text>
                  <Text style={[styles.globalText, tw`text-white text-3xl`]}>
                    รถสไลด์
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View
            style={[
              tw`flex-row flex-6 justify-between mt-4`,
              { width: responsiveWidth },
            ]}
          >
            {/* ปุ่มติดตามสถานะ */}
            <TouchableOpacity
              style={[
                { width: width * 0.29, height: width * 0.29 }, // ลดความสูงลง 10%
                tw`rounded-lg items-center justify-center bg-white shadow-md`,
              ]}
              onPress={() => order_status()}
            >
              <MaterialIcons name="track-changes" size={40} color="#60B876" />
              <Text
                style={[styles.globalText, tw`text-base text-[#60B876] mt-2`]}
              >
                ติดตามสถานะ
              </Text>
            </TouchableOpacity>

            {/* ปุ่มติดต่อเรา */}
            <TouchableOpacity
              style={[
                { width: width * 0.29, height: width * 0.29 }, // ลดความสูงลง 10%
                tw`rounded-lg items-center justify-center bg-white shadow-md`,
              ]}
            >
              <MaterialIcons name="call" size={40} color="#60B876" />
              <Text
                style={[styles.globalText, tw`text-base text-[#60B876] mt-2`]}
              >
                ติดต่อเรา
              </Text>
            </TouchableOpacity>

            {/* ปุ่มเปิดรายการบันทึก พร้อมไอคอน */}
            <TouchableOpacity
              onPress={openModal}
              style={[
                { width: width * 0.29, height: width * 0.29 }, // ลดความสูงลง 10%
                tw`rounded-lg items-center justify-center bg-white shadow-md`,
              ]}
            >
              <MaterialIcons name="list" size={40} color="#60B876" />
              <Text
                style={[styles.globalText, tw`text-base text-[#60B876] mt-2`]}
              >
                รายการโปรด
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[tw`mb-15`, { width: responsiveWidth, height: height * 0.2 }]}
        >
          <Swiper
            autoplay
            showsPagination
            loop
            style={tw`rounded-lg `}
            activeDotColor="#60B876"
          >
            {(ads || []).map((ad) => (
              <View
                key={ad.id}
                style={[
                  { height: height * 0.17 },
                  tw`flex-1 items-center justify-center w-full `,
                ]}
              >
                <Image
                  source={{ uri: ad.image }}
                  style={{
                    width: responsiveWidth,
                    height: height * 0.2,
                    resizeMode: "cover",
                    borderRadius: 10,
                  }}
                />
              </View>
            ))}
          </Swiper>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal on back press
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              tw`rounded-lg `,
              { height: height * 0.7 },
            ]}
          >
            <View
              style={tw`flex bg-white rounded-lg border border-[#60B876] p-2 w-7/12 shadow-2xl bg-[#60B876]`}
            >
              <Text
                style={[
                  styles.modalText,
                  styles.globalText,
                  tw`text-xl  text-center text-white items-center`,
                ]}
              >
                รายการโปรด
              </Text>
            </View>
            {loading ? (
              <Text style={[styles.globalText, tw`text-center`]}>
                ไม่พบข้อมูล
              </Text>
            ) : (
              <FlatList
                data={bookmarks}
                keyExtractor={(item) => item.address_id.toString()}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.bookmarkItem,
                      tw`flex  justify-between mt-3 p-2 border border-gray-300 shadow-md rounded-lg `,
                      { width: width * 0.69 },
                    ]}
                  >
                    <TouchableOpacity
                      style={tw`flex justify-between`}
                      onPress={() => handleRequestFromBookmark(item)}
                    >
                      <Text
                        style={[
                          tw`text-base font-semibold text-center `,
                          styles.globalText,
                        ]}
                      >
                        {item.save_name}
                      </Text>

                      <View style={tw`flex-row items-center mb-2 p-1`}>
                        <MaterialIcons
                          name="directions-car"
                          size={21}
                          color="black"
                        />
                        <Text
                          style={[styles.globalText, tw`text-gray-500 ml-1`]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          : {item.vahicle_type}
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center mb-2 p-1`}>
                        <MaterialIcons
                          name="location-pin"
                          size={21}
                          color="red"
                        />
                        <Text
                          style={[styles.globalText, tw`text-gray-500 ml-1`]}
                          ellipsizeMode="tail"
                        >
                          : {truncateText(item.location_from)}
                        </Text>
                      </View>

                      <View
                        style={[
                          tw`flex-row items-center mb-2 p-1`,
                          { paddingRight: 10 },
                        ]}
                      >
                        <MaterialIcons
                          name="location-pin"
                          size={21}
                          color="green"
                        />
                        <Text
                          style={[styles.globalText, tw`text-gray-500 ml-1`]}
                          ellipsizeMode="tail"
                        >
                          : {truncateText(item.location_to)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              onPress={closeModal}
              style={[
                styles.globalText,
                tw`bg-red-400 rounded-lg p-3 mt-4 px-20`,
              ]}
            >
              <Text style={[styles.globalText, tw`text-white text-center`]}>
                ปิดหน้าต่าง
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Ensures the overlay appears
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Home;
