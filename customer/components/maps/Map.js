import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, View, Button, Text, Dimensions } from "react-native";
import tw from "twrnc"; // import twrnc
import MapView, { Circle, Marker, Polygon, Polyline } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { GOOGLE_MAPS_API_KEY } from "../../assets/api/api";
import { MaterialIcons } from "@expo/vector-icons";

// 13.855827502824274, 100.58551678180032

function Map({
  setDestination,
  setOrigin,
  origin,
  destination,
  confirmOrigin,
  confirmDestination,
}) {
  const [region, setRegion] = useState(null);

  const spuLocation = {
    latitude: 13.855827502824274,
    longitude: 100.58551678180032,
  };

  const locationWatcher = useRef(null);

  const _getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }

      // เฝ้าดูตำแหน่งของผู้ใช้แบบเรียลไทม์และเก็บ watcher ไว้ใน ref
      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // ตรวจสอบตำแหน่งใหม่ทุก 1 วินาที
          distanceInterval: 1, // อัปเดตเมื่อมีการเคลื่อนที่อย่างน้อย 1 เมตร
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };

          setOrigin(location.coords);
          setRegion(newRegion);
        }
      );
    } catch (error) {
      console.warn("Error fetching location", error);
    }
  };

  useEffect(() => {
    _getLocation();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 relative`}>
      <View style={tw`flex-1`}>
        <MapView
          style={tw`w-full h-full`}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            {
              confirmOrigin.length
                ? setDestination({ latitude, longitude })
                : setOrigin({ latitude, longitude });
            }
          }}
        >
          {confirmOrigin.length ? (
            <Marker
              coordinate={{
                latitude: origin.latitude,
                longitude: origin.longitude,
              }}
              pinColor="red"
              title="confirm"
              description="ต้นทาง"
            >
              <MaterialIcons
                name="location-pin"
                size={35}
                color="red"
                style={tw`ml-2`}
              />
            </Marker>
          ) : (
            <Marker
              draggable
              coordinate={{
                latitude: origin.latitude,
                longitude: origin.longitude,
              }}
              pinColor="red"
              title="กรุณาเลือกต้นทาง"
              description="ตำแหน่งต้นทาง"
              >
              <MaterialIcons
                name="location-pin"
                size={35}
                color="red"
                style={tw`ml-2`}
              />
            </Marker>
          )}

          {confirmOrigin.length ? (
            <Marker
              draggable
              coordinate={
                destination.latitude && destination.longitude
                  ? {
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                    }
                  : {
                      latitude: origin.latitude,
                      longitude: origin.longitude + 0.003,
                    }
              }
              pinColor="green"
              title="กรุณาเลือกปลายทาง"
              description="ตำแหน่งที่อยากให้ไปส่ง"
            >
              <MaterialIcons
                name="location-pin"
                size={35}
                color="green"
                style={tw`ml-2`}
              />
            </Marker>
          ) : null}

          {/* เส้นทาง */}
          {origin && destination && origin.latitude && destination.latitude ? (
            <MapViewDirections
              strokeColor={"#1e40af"}
              strokeWidth={3}
              origin={origin}
              destination={destination}
              apikey={GOOGLE_MAPS_API_KEY}
              onError={(errorMessage) => {
                console.log("Error fetching directions: ", errorMessage);
                alert("ไม่พบเส้นทางระหว่างจุดต้นทางและปลายทางที่ระบุ");
              }}
            />
          ) : null}
        </MapView>
      </View>
    </SafeAreaView>
  );
}

export default Map;
