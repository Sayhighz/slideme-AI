import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Pressable, Modal, StyleSheet } from "react-native";

import * as Location from "expo-location";
import tw from "twrnc"; // import twrnc
import Map from "../../../components/maps/Map";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_API_KEY } from "../../../assets/api/api";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import axios from "axios";

const Bookmap = ({ navigation, label }) => {
  const route = useRoute();

  const [origin, setOrigin] = useState([]);
  const [destination, setDestination] = useState([]);

  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const [confirmOrigin, setConfirmOrigin] = useState([]);
  const [confirmDestination, setConfirmDestination] = useState([]);

  const [tab, setTab] = useState(0);
  const [address, setAddress] = useState(null);
  const [storeAddress, setStoreAddress] = useState([]); // State สำหรับที่อยู่ของร้านค้า

  const [openModal, setOpenModal] = useState(false);

  // 13.855827502824274, 100.58551678180032|

  //ร้านค้า
  const [store, setStore] = useState([
    {
      name: "store 1",
      latitude: 13.827187145167997,
      longitude: 100.5548010679114,
      price: "1,000",
    },
    {
      name: "store 2",
      latitude: 13.817187145167997,
      longitude: 100.654801069114,
      price: "1,000",
    },
    {
      name: "store 3",
      latitude: 13.827187145167997,
      longitude: 100.4548010679114,
      price: "1,000",
    },
    {
      name: "store 4",
      latitude: 13.727187145167997,
      longitude: 100.6548010679114,
      price: "1,000",
    },
    {
      name: "store 5",
      latitude: 13.927187145167997,
      longitude: 100.6548010679114,
      price: "1,000",
    },
  ]);

  //ระบุสถานที่
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const API_KEY = GOOGLE_MAPS_API_KEY; // ใส่ API Key ของคุณ
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=th&key=${API_KEY}`
      );

      console.log("API Response:", response.data);

      if (response.data.results.length > 0) {
        const address = response.data.results[0].formatted_address;
        console.log("Address in Thai:", address);

        if (!confirmOrigin.length) {
          setOriginAddress(address);
        } else if (!confirmDestination.length) {
          setDestinationAddress(address);
        } else {
          //ร้านค้า or คนขับ
        }
      }
    } catch (error) {
      // console.error("Failed to get address:", error);
    }
  };

  //คำนวณระยะทาง
  const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // รัศมีของโลกเป็นกิโลเมตร
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // ระยะทางเป็นกิโลเมตร
  };

  // useEffect(() => {
  //   store.forEach((item, index) => {
  //     getAddressFromCoords(item.latitude, item.longitude, index);
  //   });
  // }, [store]);

  useEffect(() => {
    getAddressFromCoords(origin.latitude, origin.longitude);
  }, [origin]);

  useEffect(() => {
    getAddressFromCoords(destination.latitude, destination.longitude);
  }, [destination]);

  // useEffect(()=>{
  //   console.log("confirm Origin = ",confirmOrigin)
  // },[confirmOrigin])

  useEffect(() => {
    if (confirmDestination.length > 0) {
      handleConfirm();
    }
  }),
    [confirmDestination];

  const handleConfirm = () => {
    navigation.navigate("addressPage", {
      origin_lat: origin.latitude,
      origin_long: origin.longitude,
      destination_lat: destination.latitude,
      destination_long: destination.longitude,
      confirmOrigin: confirmOrigin,
      confirmDestination: confirmDestination,
      category: route.params.category,
      nameBookMark: route.params.save_name,
      address_id: route.params.address,
    });
    setOpenModal(false);
  };

  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "left", "right"]}>
      <Modal transparent={true} visible={openModal}>
        <View style={tw`flex-1 justify-center items-center`}>
          <View style={tw`bg-[#FDFFFD] w-4/5 h-1/3 flex rounded-lg p-3`}>
            <View style={tw`flex-1 justify-center`}>
              <Text style={[styles.globalText, tw`font-bold text-lg`]}>
                ยืนยันสถานที่ {confirmOrigin.length ? "ปลายทาง" : "ต้นทาง"}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={[styles.globalText, tw`font-bold text-sm`]}>
                {confirmOrigin.length
                  ? "สถานที่ปลายทาง : " + destinationAddress
                  : "สถานที่ต้นทาง :" + originAddress}
              </Text>
            </View>
            <View style={tw`flex-1 flex-row justify-around items-center`}>
              <Pressable
                style={tw`bg-red-500 p-3 rounded-lg`}
                onPress={() => {
                  setOpenModal(false);
                }}
              >
                <Text
                  style={[
                    styles.globalText,
                    tw`text-lg font-bold text-[#FDFFFD]`,
                  ]}
                >
                  ยกเลิก
                </Text>
              </Pressable>
              <Pressable
                style={tw`bg-[#60B876] p-3 rounded-lg`}
                onPress={() => {
                  confirmOrigin.length
                    ? setConfirmDestination(destinationAddress)
                    : // handleConfirm()
                      (setConfirmOrigin(originAddress), setOpenModal(false));
                }}
              >
                <Text
                  style={[
                    styles.globalText,
                    tw`text-lg font-bold text-[#FDFFFD]`,
                  ]}
                >
                  ยืนยัน
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={tw`flex-3 relative`}>
        <Map
          setDestination={setDestination}
          setOrigin={setOrigin}
          origin={origin}
          destination={destination}
          store={store}
          confirmOrigin={confirmOrigin}
          confirmDestination={confirmDestination}
        />

        <View
          style={[
            tw` flex-1 flex-row z-10 w-full absolute top-2 justify-center items-center `,
          ]}
        >
          <View
            style={tw` flex-row w-11/12 rounded-lg bg-[#FDFFFD] border border-gray-200`}
          >
            <View style={tw`flex-1 justify-center items-center`}>
              <TouchableOpacity
                onPress={() => {
                  if (confirmOrigin.length) {
                    setConfirmOrigin([]);
                    setConfirmDestination([]);
                    setDestination([]);
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <View style={tw`flex-9`}>
              <GooglePlacesAutocomplete
                //ต้องขอ api
                styles={tw`bg-[#FDFFFD]`}
                fetchDetails={true}
                placeholder={confirmOrigin.length ? "ปลายทาง" : "ต้นทาง"}
                minLength={2}
                debounce={400}
                onPress={(data, details = null) => {
                  if (confirmOrigin.length) {
                    let destinationCordinates = {
                      latitude: details?.geometry?.location.lat,
                      longitude: details?.geometry?.location.lng,
                    };
                    setDestination(destinationCordinates);
                  } else {
                    let originCordinates = {
                      latitude: details?.geometry?.location.lat,
                      longitude: details?.geometry?.location.lng,
                    };
                    setOrigin(originCordinates);
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_API_KEY,
                  language: "th",
                }}
                onFail={(error) => console.log(error)}
                onNotFound={() => console.log("ไม่พบสถานที่")}
              />
            </View>
          </View>
        </View>
      </View>
      <View
        style={tw`flex-1 bg-[#FDFFFD] p-3 border border-[#FDFFFD] rounded-t-3xl`}
      >
        <View style={tw`flex-1 justify-around`}>
          <Text style={[styles.globalText, tw`text-xl font-bold mb-1`]}>
            {confirmOrigin.length ? "ปลายทาง" : "ต้นทาง"}
          </Text>
          <Text style={styles.globalText}>
            {confirmOrigin.length ? destinationAddress : originAddress}
          </Text>
        </View>
        <View style={tw`flex-1 justify-end items-center `}>
          <Pressable
            style={tw`border border-[#60B876] rounded-lg w-9/10 h-3/5 justify-center items-center bg-[#60B876]`}
            onPress={() => {
              setOpenModal(true);
            }}
          >
            <Text
              style={[styles.globalText, tw`text-[#FDFFFD] text-xl font-bold`]}
            >
              ยืนยัน{confirmOrigin.length ? "ปลายทาง" : "ต้นทาง"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default Bookmap;
