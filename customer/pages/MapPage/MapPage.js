import React, { useEffect, useState , useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Pressable, Modal, StyleSheet } from "react-native";

import * as Location from "expo-location";
import tw from "twrnc"; // import twrnc
import Map from "../../components/maps/Map";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_API_KEY } from "../../assets/api/api";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import { UserContext } from "../../UserContext";
import SubmitButton from "../../components/SubmitButton";

const MapPage = ({ navigation }) => {
  const route = useRoute();

  const [origin, setOrigin] = useState([]);
  const [destination, setDestination] = useState([]);

  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const [confirmOrigin, setConfirmOrigin] = useState([]);
  const [confirmDestination, setConfirmDestination] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const { userData } = useContext(UserContext);


  //ระบุสถานที่
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const API_KEY = GOOGLE_MAPS_API_KEY; // ใส่ API Key ของคุณ
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=th&key=${API_KEY}`
      );
  
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

  const handleConfirm = () => {
    navigation.navigate("Mapdetail", {
      origin,
      destination,
      confirmOrigin,
      confirmDestination,
    });
    setOpenModal(false);
  };

  useEffect(() => {
    getAddressFromCoords(origin.latitude, origin.longitude);
  }, [origin]);

  useEffect(() => {
    getAddressFromCoords(destination.latitude, destination.longitude);
  }, [destination]);

  useEffect(() => {
    if (confirmDestination.length > 0) {
      handleConfirm();
    }
  },[confirmDestination]);

  return (
    <SafeAreaView style={tw`flex-1`} edges={['top', 'left', 'right']}>
      <Modal transparent={true} visible={openModal}>
        <View style={tw`flex-1 justify-center items-center`}>
          <View style={tw`bg-[#FDFFFD] w-4/5 h-1/3 flex rounded-lg p-5 shadow-md`}>
            <View style={tw`flex-1 justify-center`}>
              <Text style={[styles.globalText, tw`font-bold text-lg`]}>
                ยืนยัน{confirmOrigin.length ? "ปลายทาง" : "ต้นทาง"}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={[styles.globalText, tw`text-gray-600`]}>
                {confirmOrigin.length
                  ? "สถานที่ปลายทาง : " + destinationAddress
                  : "สถานที่ต้นทาง :" + originAddress}
              </Text>
            </View>
            <View style={tw`flex-1 flex-row justify-around items-center`}>
              <Pressable
                style={tw`bg-red-500 p-1 px-5 rounded`}
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
                style={tw`bg-[#60B876] p-1 px-5 rounded`}
                onPress={() => {
                  confirmOrigin.length
                    ? setConfirmDestination(destinationAddress)
                    : // handleConfirm()
                      (setConfirmOrigin(originAddress), setOpenModal(false));
                }}
              >
                <Text style={[styles.globalText,tw`text-lg font-bold text-[#FDFFFD]`]}>
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
        style={tw`flex-1 bg-[#FDFFFD] p-3 border border-[#FDFFFD] rounded-t-3xl mb-10`}
      >
        <View style={tw`flex-1 justify-around pb-4`}>
          <Text style={[styles.globalText, tw`text-xl font-bold mb-1`]}>
            {confirmOrigin.length ? "จุดส่งรถ" : "จุดรับรถ"}
          </Text>
          <Text style={[styles.globalText, tw`text-gray-600`]}>
            {confirmOrigin.length ? destinationAddress : originAddress}
          </Text>
        </View>
        <View style={tw`flex-1 justify-end items-center `}>
        </View>
      </View>
        <SubmitButton
          onPress={() => {
            setOpenModal(true);
          }}
          title={`ยืนยัน${confirmOrigin.length ? "จุดส่งรถ" : "จุดรับรถ"}`}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default MapPage;
