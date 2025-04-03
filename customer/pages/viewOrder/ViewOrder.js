import {
  Pressable,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { openURL } from "expo-linking";
import { rating } from "@material-tailwind/react";
import { useRoute } from "@react-navigation/native";
import { GOOGLE_MAPS_API_KEY } from "../../assets/api/api";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import axios from "axios";
import { IP_ADDRESS } from "../../config";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

export default function ViewOrder({ navigation }) {
  const styles = StyleSheet.create({
    globalText: {
      fontFamily: "Mitr-Regular",
    },
  });

  const route = useRoute();

  const [origin, setOrigin] = useState({});
  const [destination, setDestination] = useState({});

  const [driverInformation, setDriverInformation] = useState({});

  const [driverLocation, setDriverLocation] = useState({});

  const [confirmFromDriver, setConfirmFromDriver] = useState(false);

  const [myLocation, setMyLocation] = useState({});

  const [request, setRequest] = useState("");

  const [time, setTime] = useState("");

  const [status, setStatus] = useState(null);

  const [alertComfirm, setAlertConfirm] = useState(false);

  const driver_id = route.params?.driverProfile.chooseDriver.id || "ไม่ระบุ";
  const customer_id_request =
    route.params?.driverProfile.chooseDriver.customer_id_request || "ไม่ระบุ";
  const request_id =
    route.params?.driverProfile.chooseDriver.request_id || "ไม่ระบุ";

  useEffect(() => {
    console.log("route.params:", route.params || "ไม่ระบุ");
  }, [route.params]);

  const formatDateToThaiTimezone = (dateString) => {
    const date = new Date(dateString);
    const options = {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit",
    };
    return new Intl.DateTimeFormat("th-TH", options).format(date);
  };

  const padNumber = (number, length) => {
    return number.toString().padStart(length, "0");
  };

  useEffect(() => {
    console.log("driver_id:", driver_id);
    console.log("customer_id_request:", customer_id_request);
    console.log("request_id:", request_id);
  }, [driver_id, customer_id_request, request_id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `http://${IP_ADDRESS}:3000/auth/fetch_driver_info/${customer_id_request}/${driver_id}/${request_id}`
      );

      if (response.data.Status && response.data.Result.length > 0) {
        const data = response.data.Result[0]; // Assuming you want the first result

        // Set the state with fetched data
        setOrigin({
          name: data.location_from,
          latitude: parseFloat(data.pickup_lat),
          longitude: parseFloat(data.pickup_long),
        });

        setDestination({
          name: data.location_to,
          latitude: parseFloat(data.dropoff_lat),
          longitude: parseFloat(data.dropoff_long),
        });

        setDriverInformation({
          name: data.driver_first_name + " " + data.driver_last_name,
          latitude: data.driver_latitude,
          longitude: data.driver_longitude,
          phone: data.driver_phone,
          rating: data.average_rating.toFixed(1),
        });

        setTime(formatDateToThaiTimezone(data.booking_time));
        setRequest(padNumber(data.request_id, 10));
      } else {
        console.error("No matching data found");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const checkOrderStatus = async () => {
    try {
      const response = await axios.get(
        `http://${IP_ADDRESS}:3000/auth/checkStatusOrder/${request_id}`
      );

      if (response.data && response.data.status) {
        setStatus(response.data.status); // อัปเดตสถานะใน state

        // ถ้า status เป็น "completed" แสดง Alert และ navigate
        if (response.data.status === "completed" && !alertComfirm) {
          setAlertConfirm(true);
          Alert.alert(
            "รถของคุณได้ถึงปลายทางแล้ว",
            "",
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("Rating", {
                    requestId: request_id,
                    driver_id: driver_id,
                    customer_id_request: customer_id_request,
                  });
                },
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        console.error("No status found for the given request_id.");
      }
    } catch (error) {
      console.error("Error fetching order status:", error);
    }
  };

  useEffect(() => {
    let interval;

    if (status === "accepted") {
      interval = setInterval(() => {
        checkOrderStatus();
      }, 5000);
    }

    if (status === "completed") {
      clearInterval(interval);
    }

    // Cleanup function สำหรับ useEffect
    return () => clearInterval(interval);
  }, [status]);

  const getDriverLocation = async () => {
    try {
      const response = await axios.get(
        `http://${IP_ADDRESS}:4000/drivers/driverlocation/${driver_id}`
      );
      if (status === "accepted") {
        if (response.data.success) {
          setDriverLocation({
            latitude: response.data.data.current_latitude,
            longitude: response.data.data.current_longitude,
          });
        } else {
          console.error(
            "Failed to fetch driver location:",
            response.data.message
          );
        }
      }
    } catch (error) {
      console.error("Error fetching driver location:", error);
    }
  };

  useEffect(() => {
    let intervalLocation;
    if (status === "accepted") {
      intervalLocation = setInterval(() => {
        getDriverLocation();
      }, 1000);
    }
    if (status === "completed") {
      console.log("Clearing interval");
      clearInterval(intervalLocation);
    }

    return () => clearInterval(intervalLocation);
  }, [status]);

  useEffect(() => {
    fetchOrderDetails();
    checkOrderStatus();
    getDriverLocation();
  }, []);

  const handleChat = () => {
    navigation.navigate("ChatScreen", { room_id: request_id, user_name: driverInformation.name, phoneNumber: driverInformation.phone });
  };

  return (
    <>
    <HeaderWithBackButton showBackButton={true} title="รายละเอียด" onPress={() => navigation.navigate("HomePage")} />
    <SafeAreaView style={tw`flex-1 relative `}>

      <View style={tw`flex-2`}>
        <View style={tw`flex-2`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-1 flex-row justify-between p-4 items-end`}>
              <Text style={[styles.globalText, tw`text-sm`]}>{time}</Text>
              <Text style={[styles.globalText, tw`text-sm`]}>{request}</Text>
            </View>
            <View
              style={tw`flex-4 justify-around mx-4 bg-white shadow-lg border border-gray-300 mb-5 p-1 rounded-lg`}
            >
              <View style={tw`flex-1 flex-row items-center w-full`}>
                <MaterialIcons name="location-pin" size={24} color="blue" />
                <Text style={[styles.globalText, tw`items-center`]}>
                  คนขับ{" "}
                </Text>
                <Text
                  style={[styles.globalText, tw`items-center text-gray-600`]}
                >
                  {driverInformation.name}
                </Text>
              </View>
              <View
                style={tw`flex-1 flex-row items-center w-full`}
                onTouchEnd={() => {
                  Alert.alert("ต้นทาง :", origin.name);
                }}
              >
                <MaterialIcons name="location-pin" size={24} color="red" />
                <Text
                  style={[styles.globalText, tw`items-center flex-1`]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  ต้นทาง : {origin.name}
                </Text>
                <Text
                  style={[styles.globalText, tw`items-center flex-1`]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {origin.name}
                </Text>
              </View>
              <View
                style={tw`flex-1 flex-row items-center w-full`}
                onTouchEnd={() => {
                  Alert.alert("ปลายทาง :", destination.name);
                }}
              >
                <MaterialIcons name="location-pin" size={24} color="green" />
                <Text
                  style={[styles.globalText, tw`items-center flex-1`]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  ปลายทาง : {destination.name}
                </Text>
              </View>
            </View>
          </View>
          <View style={tw`flex-2`}>
            <View style={tw`flex-1 bg-black justify-center`}>
              <MapView
                style={tw`flex-1`}
                initialRegion={{
                  latitude: 13.855890002666245,
                  longitude: 100.58553823947129,
                  latitudeDelta: 0.0522,
                  longitudeDelta: 0.0521,
                }}
              >
                <Marker
                  coordinate={origin}
                  title="ต้นทาง"
                  description={origin.name}
                >
                  <MaterialIcons
                    name="location-pin"
                    size={35}
                    color="red"
                    style={tw`ml-2`}
                  />
                </Marker>

                <Marker
                  coordinate={destination}
                  title="ปลายทาง"
                  description={destination.name}
                >
                  <MaterialIcons
                    name="location-pin"
                    size={35}
                    color="green"
                    style={tw`ml-2`}
                  />
                </Marker>

                <Marker
                  coordinate={driverLocation}
                  title="คนขับ"
                  description={driverInformation.name}
                >
                  <MaterialIcons
                    name="location-pin"
                    size={35}
                    color="blue"
                    style={tw`ml-2`}
                  />
                </Marker>

                {/* <Marker
                  coordinate={myLocation}
                  title="myLocation"
                  description="myLocation"
                  pinColor="red"
                /> */}

                {origin.latitude &&
                  origin.longitude &&
                  destination.latitude &&
                  destination.longitude &&
                  driverInformation.latitude &&
                  driverInformation.longitude && (
                    <MapViewDirections
                      strokeColor={"#1e40af"}
                      strokeWidth={3}
                      apikey={GOOGLE_MAPS_API_KEY}
                      origin={{
                        latitude: driverInformation.latitude,
                        longitude: driverInformation.longitude,
                      }}
                      destination={
                        confirmFromDriver
                          ? {
                              latitude: destination.latitude,
                              longitude: destination.longitude,
                            }
                          : {
                              latitude: origin.latitude,
                              longitude: origin.longitude,
                            }
                      }
                      // onError={(errorMessage) => {
                      //   console.log("Error fetching directions: ", errorMessage);
                      //   alert("ไม่พบเส้นทางระหว่างจุดต้นทางและปลายทางที่ระบุ");
                      // }}
                    />
                  )}
              </MapView>
            </View>
          </View>
        </View>
        <View style={tw`flex-1`}>
          <Pressable
            style={tw`flex-1 flex-row bg-white shadow-md border border-gray-300 m-4 rounded-lg items-center px-4`}
          >
            <View style={tw`flex-8`}>
              <Text style={[styles.globalText, tw`text-xl`]}>
                {driverInformation.name}
              </Text>
            </View>
            <View style={tw`flex-1 flex-row items-center justify-end`}>
              <MaterialIcons name="star" size={24} color="orange" />
              <Text style={[styles.globalText, tw`text-xl text-center`]}>
                {driverInformation.rating || "0.0"}
              </Text>
            </View>
          </Pressable>
          <View style={tw`flex-2`}>
            <View style={tw`flex-1 flex-row justify-around mb-4`}>
              {/* Call Button */}
              <Pressable
                style={tw`flex-1 bg-white shadow-md border border-gray-300 justify-center rounded-lg items-center mx-4 h-16`}
                onPress={() => {
                  openURL(`tel:${driverInformation.phone}`);
                  console.log(driverInformation.phone);
                }}
              >
                <MaterialIcons name="call" size={24} color="green" />
                <Text style={[styles.globalText, tw`text-xs`]}>โทร</Text>
              </Pressable>

              {/* Chat Button */}
              <Pressable
                style={tw`flex-1 bg-white shadow-md border border-gray-300 justify-center rounded-lg items-center mx-4 h-16`}
                onPress={handleChat}
              >
                <MaterialIcons name="chat" size={24} color="black" />
                <Text style={[styles.globalText, tw`text-xs`]}>ข้อความ</Text>
              </Pressable>

              {/* Cancel Button */}
              <Pressable
                style={tw`flex-1 bg-white shadow-md border border-gray-300 justify-center rounded-lg items-center mx-4 h-16`}
                onPress={() => {
                  Alert.alert(
                    "ฟังก์ชั่นนี้ยังไม่พร้อมใช้งาน",
                    "",
                    [{ text: "OK" }],
                    { cancelable: false }
                  );
                }}
              >
                <MaterialIcons name="close" size={24} color="red" />
                <Text style={[styles.globalText, tw`text-xs`]}>ยกเลิก</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
    </>
  );
}
