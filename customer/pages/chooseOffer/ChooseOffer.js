import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState, useContext, useRef } from "react";
import tw from "twrnc";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity, Animated } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { Dropdown } from "react-native-element-dropdown";
import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../../assets/api/api";
import { IP_ADDRESS } from "../../config";
import MapViewDirections from "react-native-maps-directions";
import { UserContext } from "../../UserContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

const ChooseOffer = ({ navigation, route }) => {
  const fee = '';

  const [offer, setOffer] = useState([]);

  const [chooseDriver, setChooseDriver] = useState({});

  const [openModal, setOpenModal] = useState(false);

  const [openModalCancel, setOpenModalCancel] = useState(false);

  const [filteredOffer, setFilteredOffer] = useState([]);

  const [radiusInMeters, setRadiusInMeters] = useState(5000);

  const [offerLoading, setOfferLoading] = useState(true);

  const [fetchDataLoading, setFetchDataLoading] = useState(false);

  const [sortedFilteredOffer, setSortedFilteredOffer] = useState([]);

  const [originLocation, setOriginLocation] = useState({
    name: "",
    latitude: 0,
    longitude: 0,
  });

  const [destinationLocation, setDestinationLocation] = useState({
    name: "",
    latitude: 0,
    longitude: 0,
  });

  const dataDropdown = [
    { label: "1 กม.", value: "1000" },
    { label: "5 กม.", value: "5000" },
    { label: "10 กม.", value: "10000" },
    { label: "20 กม.", value: "20000" },
    { label: "30 กม.", value: "30000" },
  ];

  const animatedValue = useRef(new Animated.Value(0)).current;

  const { userData } = useContext(UserContext);
  const { request_id } = route.params;

  const handleCancelRequest = async () => {

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/cancel_request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: request_id
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        navigation.navigate("HomePage");
      } else {
        Alert.alert("ข้อผิดพลาด", result.message || "ยกเลิกรายการไม่สําเร็จ");
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการยกเลิกรายการ");
      console.error(error);
    }
  };

  useEffect(() => {
    console.log("request_id", request_id);
  }, [route.params]);

  useEffect(() => {
    // กรองข้อมูลด้วยรัศมีเมื่อเปลี่ยน `radiusInMeters`
    const filtered = filterOffersByRadius(offer, radiusInMeters);
    setFilteredOffer(filtered);

    // คำนวณระยะทางเส้นทางจริงและอัพเดทข้อมูลใน `FlatList`
    calculateAccurateRouteDistance(filtered).then((results) => {
      setFilteredOffer(results);
    });
  }, [offer, radiusInMeters]);

  useEffect(() => {
    filterOffers(offer, radiusInMeters);
  }, [offer, radiusInMeters]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const filterOffers = async (offers, radius) => {
    // กรองข้อเสนอโดยใช้การคำนวณระยะทางแบบ haversine
    const haversineFiltered = offers.filter((item) => {
      const distance = calculateDistance(
        originLocation.latitude,
        originLocation.longitude,
        item.location.latitude,
        item.location.longitude
      );
      return distance <= radius; // กรองตามรัศมีที่กำหนด
    });

    // ใช้ Google Maps API เพื่อดึงข้อมูลเส้นทางสำหรับการแสดงผล
    const promises = haversineFiltered.map(async (item) => {
      try {
        const result = await getRouteDistance(item.location, originLocation);
        return {
          ...item,
          distance:
            result.distance !== null
              ? result.distance
              : calculateDistance(
                  originLocation.latitude,
                  originLocation.longitude,
                  item.location.latitude,
                  item.location.longitude
                ), // ใช้ระยะทางแบบ haversine หาก API ไม่สามารถคืนค่าระยะทางได้
          duration: result.duration,
          durationText: result.durationText,
        };
      } catch (error) {
        console.error(`Error fetching route distance for ${item.name}:`, error);
        return { ...item, distance: null, duration: null, durationText: null };
      }
    });

    const results = await Promise.all(promises);
    setFilteredOffer(results);
  };

  const getRouteDistance = async (driverLocation, originLocation) => {
    const API_KEY = GOOGLE_MAPS_API_KEY; // Use your API key
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${originLocation.latitude},${originLocation.longitude}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching route data: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        const distance = leg.distance.value; // Distance in meters
        const duration = leg.duration.value; // Duration in seconds
        const durationText = leg.duration.text.replace(/[^\d]/g, "");

        return { distance, duration, durationText };
      } else {
        console.error("No routes found");
        return { distance: null, duration: null, durationText: null };
      }
    } catch (error) {
      console.error("Error calling Directions API:", error.message);
      return { distance: null, duration: null, durationText: null };
    }
  };

  const sortOffersByDistance = (offers) => {
    return offers.sort(
      (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshPage();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [fetchDataLoading]);

  const refreshPage = async () => {
    if (fetchDataLoading) return;
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/offer/chooseoffer?request_id=${request_id}`
      );
      
      // Check if response is OK before trying to parse JSON
      // console.log(response)
      if (!response.ok) {
        console.error(`Server responded with status: ${response.status}`);
        return;
      }
      
      // Get the content type
      const contentType = response.headers.get("content-type");
      
      // Only try to parse as JSON if the content type is application/json
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.Status) {
          if (data.PickupDropoffInfo) {
            setOriginLocation({
              name: data.PickupDropoffInfo.location_from,
              latitude: parseFloat(data.PickupDropoffInfo.pickup_lat),
              longitude: parseFloat(data.PickupDropoffInfo.pickup_long),
            });
            setDestinationLocation({
              name: data.PickupDropoffInfo.location_to,
              latitude: parseFloat(data.PickupDropoffInfo.dropoff_lat),
              longitude: parseFloat(data.PickupDropoffInfo.dropoff_long),
            });
          }
  
          if (data.Result === "") {
            setOfferLoading(true);
          }
  
          if (data.Result && data.Result.length > 0) {
            // Handle driver data if available
            const drivers = data.Result.map((driver) => ({
              id: driver.driver_id,
              name: `${driver.first_name} ${driver.last_name}`,
              rating: driver.average_rating || 0,
              location: {
                latitude: driver.current_latitude,
                longitude: driver.current_longitude,
              },
              price: driver.offered_price,
              customer_id_request: driver.customer_id,
              request_id: driver.request_id,
            }));
            console.log(drivers);
            setOffer(drivers);
            setOfferLoading(false);
            setFetchDataLoading(true);
          }
        }
      } else {
        // Handle non-JSON response
        console.error("Server returned non-JSON response:", await response.text().slice(0, 100));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Add more detailed logging for debugging
      if (error instanceof SyntaxError) {
        console.error("JSON parsing error. This usually means the server sent HTML instead of JSON.");
      }
    }
  };

  const filterOffersByRadius = (offers, radius) => {
    const filteredOffers = offers.filter((item) => {
      const distance = calculateDistance(
        originLocation.latitude,
        originLocation.longitude,
        item.location.latitude,
        item.location.longitude
      );
      return distance <= radius;
    });
    return sortOffersByDistance(filteredOffers); // เรียงข้อมูลทันที
  };


  const calculateAccurateRouteDistance = async (offers) => {
    const promises = offers.map(async (item) => {
      try {
        const result = await getRouteDistance(item.location, originLocation);
        return {
          ...item,
          distance: result.distance,
          duration: result.duration,
          durationText: result.durationText,
        };
      } catch (error) {
        console.error(`Error fetching route distance for ${item.name}:`, error);
        return { ...item, distance: null, duration: null, durationText: null };
      }
    });

    const results = await Promise.all(promises);
    setSortedFilteredOffer(results);
    return sortOffersByDistance(results); // เรียงลำดับ
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 150, // ระยะทางในแกน X
          duration: 2000, // ความเร็ว (1 วินาที)
          useNativeDriver: true,
        }),
        // Animated.timing(animatedValue, {
        //   toValue: -50, // ย้อนกลับไปในทิศตรงข้าม
        //   duration: 2000,
        //   useNativeDriver: true,
        // }),
      ])
    ).start(); // เริ่มแอนิเมชัน
  }, [animatedValue]);

  useEffect(() => {
    refreshPage();
  }, []);

  const renderEmptyList = () => {
    return (
      <View style={tw`flex-1 justify-center items-center mt-20 h-2/2`}>
        <Text style={[styles.globalText, tw`text-lg`]}>
          ไม่มีคนขับในระยะนี้
        </Text>
      </View>
    );
  };
  
  return (
    <>
      <HeaderWithBackButton
        showBackButton={true}
        title="เลือกคนขับ"
        onPress={() => setOpenModalCancel(true)}
      />
    <SafeAreaView style={tw`flex-1`}>
      <Modal transparent={true} visible={openModalCancel} >
        <View style={[{backgroundColor: "rgba(0, 0, 0, 0.5)"} , tw`flex-1 justify-center items-center`]}>
          <View style={tw`bg-white shadow flex rounded-lg p-3 h-40 w-2/4`}>
            <View style={tw`flex-1 items-center justify-center`}>
              <Text style={[styles.globalText,tw`text-sm text-center text-red-600`]}>
                คุณต้องการใช้บริการ
              </Text>
              <Text style={[styles.globalText,tw`text-sm text-center text-red-600`]}>นี้หรือไม่</Text>
            </View>
            <View style={tw`flex-row flex-1 items-center justify-around`}>
              <TouchableOpacity
                style={tw`p-2 bg-red-500 rounded-lg w-1/3`}
                onPress={() => setOpenModalCancel(false)}
              >
                <Text style={[styles.globalText,tw`text-white text-center`]}>ไม่</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`p-2 bg-green-500 rounded-lg w-1/3`}
                onPress={handleCancelRequest}
              >
                <Text style={[styles.globalText,tw`text-white text-center`]}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal transparent={true} visible={openModal}>
        <View style={[tw`flex-1 justify-center items-center ` , {backgroundColor: "rgba(0, 0, 0, 0.5)"}]}>
          <View style={tw`bg-white shadow-md border border-gray-300 w-4/5 h-1/3 flex rounded-lg p-3`}>
            <View style={tw`flex-2`}>
              <View style={tw`flex-1 justify-between`}>
                <Text
                  style={[styles.globalText, tw`text-lg text-center`]}
                >
                  ข้อมูลคนขับ
                </Text>
                <View style={tw`flex-1`}>
                  <Text style={[styles.globalText, tw`text-lg`]}>
                    {"ชื่อ : "}
                    <Text style={tw`text-lg text-green-700`}>
                      {chooseDriver.name}
                    </Text>
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[styles.globalText, tw`text-lg`]}>
                    {"ราคา : "}
                    <Text style={tw`text-lg text-red-700`}>
                      {chooseDriver.price !== null
                        ? chooseDriver.price + fee
                        : "-"}
                      {" บาท"}
                    </Text>
                  </Text>
                </View>
                <View style={tw`flex-1 justify-center`}>
                  <Text style={[styles.globalText, tw`text-lg`]}>
                    {"คะแนน : "}
                    <View>
                      <MaterialIcons name="star" size={24} color="orange" />
                    </View>
                    <Text style={tw`text-lg text-green-700 flex-1`}>
                      {chooseDriver.rating || "0.0"}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
            <View style={tw`flex-1 flex-row justify-around items-center`}>
              <Pressable
                style={tw`bg-red-500 p-3 rounded-lg`}
                onPress={() => {
                  setOpenModal(false);
                }}
              >
                <Text style={[styles.globalText,tw`text-lg text-[#FDFFFD]`]}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={tw`bg-[#60B876] p-3 rounded-lg`}
                onPress={() => {
                  console.log("request_id:", request_id, "chooseDriver:", chooseDriver);
                  navigation.navigate("payment", {
                    chooseDriver: chooseDriver,
                    request_id: request_id,
                    // originLocation: originLocation,
                    // destinationLocation: destinationLocation,
                  }),
                    setOpenModal(false);
                }}
              >
                <Text style={[styles.globalText,tw`text-lg text-[#FDFFFD]`]}>ยืนยัน</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={tw`flex-2`}>
        {originLocation.latitude && destinationLocation.latitude ? (
          <MapView
            style={tw`flex-1`} // ปรับขนาดตามที่ต้องการ
            initialRegion={{
              latitude: originLocation.latitude,
              longitude: originLocation.longitude,
              latitudeDelta: 0.08, // ค่า zoom level สามารถปรับได้ตามต้องการ
              longitudeDelta: 0.08,
            }}
          >
            <Marker
              coordinate={{
                latitude: originLocation.latitude,
                longitude: originLocation.longitude,
              }}
              title="ต้นทาง"
              description={originLocation.name}
            >
              <MaterialIcons
                name="location-pin"
                size={35}
                color="red"
                style={tw`ml-2`}
              />
            </Marker>

            <Marker
              coordinate={{
                latitude: destinationLocation.latitude,
                longitude: destinationLocation.longitude,
              }}
              title="ปลายทาง"
              description={destinationLocation.name}
            >
              <MaterialIcons
                name="location-pin"
                size={35}
                color="green"
                style={tw`ml-2`}
              />
            </Marker>

            {filteredOffer.map((item, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                }}
                title={item.name}
                description={`ราคา: ${item.price + fee} บาท`}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={35}
                  color={chooseDriver.id === item.id ? "#1d4ed8" : "gray"}
                  style={tw`ml-2`}
                />
              </Marker>
            ))}

            <Circle
              center={originLocation}
              radius={radiusInMeters}
              fillColor="rgba(255, 0, 0, 0.1)"
              strokeColor="transparent"
            />
          </MapView>
        ) : (
          <View style={tw`flex-1 justify-center items-center`}>
            <Text>Loading Map...</Text>
          </View>
        )}
      </View>

      <View style={tw`flex-2 p-4`}>
        <View style={tw`flex-1 flex-row`}>
          <View style={tw`flex-1 justify-center`}>
            <Pressable
              onPress={() => {
                refreshPage();
                setFetchDataLoading(false);
              }}
            >
              <MaterialIcons name="refresh" size={24} color="gray" />
            </Pressable>
          </View>
          <View style={tw`flex-1 justify-center items-end`}>
            {!offerLoading ? (
              <Dropdown
                style={tw`h-3/4 w-2/4 rounded-lg px-3 bg-white`}
                data={dataDropdown}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Radius"
                value={radiusInMeters.toString()}
                onChange={(item) => {
                  const newRadius = parseInt(item.value, 10);
                  setRadiusInMeters(newRadius);

                  // กรองและเรียงข้อมูลทันที
                  const filtered = filterOffersByRadius(offer, newRadius);
                  calculateAccurateRouteDistance(filtered).then((results) => {
                    const sorted = sortOffersByDistance(results); // เรียงข้อมูล
                    setSortedFilteredOffer(sorted); // อัปเดตข้อมูลเรียงเสร็จแล้ว
                  });
                }}
              />
            ) : <Dropdown
            style={tw`h-3/4 w-2/4 rounded-lg px-3 bg-white`}
            data={dataDropdown}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Radius"
            value={radiusInMeters.toString()}
            onChange={(item) => {
              const newRadius = parseInt(item.value, 10);
              setRadiusInMeters(newRadius);

              // กรองและเรียงข้อมูลทันที
              const filtered = filterOffersByRadius(offer, newRadius);
              calculateAccurateRouteDistance(filtered).then((results) => {
                const sorted = sortOffersByDistance(results); // เรียงข้อมูล
                setSortedFilteredOffer(sorted); // อัปเดตข้อมูลเรียงเสร็จแล้ว
              });
            }}
          />}
          </View>
        </View>
        <View style={tw`flex-8 items-center`}>
          {!offerLoading ? (
            <FlatList
              data={sortedFilteredOffer}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              ListEmptyComponent={renderEmptyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center p-2 my-2 rounded shadow w-90 justify-between h-20`,
                    chooseDriver.id === item.id
                      ? tw`bg-[#60B876]`
                      : tw`bg-white`,
                  ]}
                  onPress={() => {
                    if (chooseDriver.id !== item.id) {
                      setChooseDriver(item);
                    } else {
                      setOpenModal(true);
                    }
                  }}
                >
                  <View style={tw`flex-3 justify-between`}>
                    <View style={tw`flex-row flex-1 items-center justify-center`}>
                      <Text
                        style={[
                          styles.globalText,
                          tw`text-gray-600 `,
                        ]}
                      >
                        คนขับ : {item.name}
                      </Text>
                        <MaterialIcons name="star" size={24} color="orange" />
                        <Text
                          style={[
                            styles.globalText,
                            tw`text-gray-600  flex-1`,
                          ]}
                        >{item.rating ? item.rating : "-"}</Text>
                    </View>
                    <View style={tw`flex-1 justify-center`}>

                    <Text style={[styles.globalText, tw``]}>
                      ราคา :
                      <Text style={tw`text-red-700`}> {item.price + fee}</Text>
                      {" บาท"}{" "}
                    </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.globalText, tw`flex-2 items-center justify-between`]}
                  >
                    <View style={tw`flex-1 justify-center`}>

                    <Text style={[styles.globalText , tw`text-gray-600 items-center`]}>
                      ระยะทาง : {""}
                      <Text style={tw`text-red-700`}>
                        {item.distance
                          ? (item.distance / 1000).toFixed(2)
                          : "-"}
                      </Text>
                      {" กม."}
                    </Text>
                          </View>
                          <View style={tw`flex-1 justify-center items-center`}>

                    <Text style={[ styles.globalText ,tw`text-gray-600`]}>
                      เวลาที่ใช้ : {""}
                      <Text style={tw`text-red-700`}>{item.durationText}</Text>
                      {" นาที"}
                    </Text>
                          </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={tw`flex-1 justify-center items-center w-1/2`}>
              <Animated.View
                style={StyleSheet.flatten([
                  tw`w-full`, // ใช้ tw
                  { transform: [{ translateX: animatedValue }] }, // ใช้แอนิเมชัน
                ])}
              >
                <MaterialIcons name="local-shipping" size={35} color="gray" />
              </Animated.View>
              <Text style={[styles.globalText, tw`text-lg mt-5`]}>
                กําลังรอคนขับ...
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default ChooseOffer;
