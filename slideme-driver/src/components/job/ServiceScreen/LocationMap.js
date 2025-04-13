import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from "react-native";
import MapView, { Marker } from "react-native-maps"; // เอา PROVIDER_GOOGLE ออก
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTS, COLORS } from "../../../constants";

const { width } = Dimensions.get('window');

const LocationMap = ({ 
  coordinates, 
  locationDetails, 
  markerTitle, 
  markerDescription,
  onNavigate,
  locationType = "pickup" // "pickup" or "dropoff"
}) => {
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return (
      <View style={[styles.mapContainer, styles.noMapContainer]}>
        <Icon name="location-off" size={40} color={COLORS.GRAY_400} />
        <Text style={styles.noMapText}>ไม่พบข้อมูลตำแหน่ง</Text>
      </View>
    );
  }

  // แปลงค่าละติจูด/ลองจิจูดให้เป็น number
  const latitude = parseFloat(coordinates.latitude);
  const longitude = parseFloat(coordinates.longitude);

  // ตรวจสอบให้แน่ใจว่าค่าถูกต้อง
  if (isNaN(latitude) || isNaN(longitude)) {
    return (
      <View style={[styles.mapContainer, styles.noMapContainer]}>
        <Icon name="location-off" size={40} color={COLORS.GRAY_400} />
        <Text style={styles.noMapText}>ตำแหน่งไม่ถูกต้อง</Text>
      </View>
    );
  }

  const iconName = locationType === "pickup" ? "trip-origin" : "place";
  const colorScheme = locationType === "pickup" ? {
    markerColor: "#4CAF50", // สีเขียว
    iconTint: COLORS.PRIMARY,
    gradientStart: "rgba(76, 175, 80, 0.1)",
  } : {
    markerColor: "#F44336", // สีแดง
    iconTint: "#E53935",
    gradientStart: "rgba(244, 67, 54, 0.1)"
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.mapContainer}
        activeOpacity={0.9}
        onPress={onNavigate}
      >
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={{
              latitude,
              longitude,
            }}
            title={markerTitle}
            description={markerDescription}
            pinColor={colorScheme.markerColor}
          />
        </MapView>

        {/* Navigation Button Overlay */}
        <View style={styles.navigateOverlay}>
          <View style={styles.navigateButton}>
            <Icon name="directions" size={16} color="white" />
            <Text style={styles.navigateText}>นำทาง</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Location Details */}
      <View style={styles.detailsContainer}>
        <View style={[styles.iconContainer, { backgroundColor: colorScheme.gradientStart }]}>
          <Icon name={iconName} size={22} color={colorScheme.iconTint} />
        </View>
        
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationType}>
            {locationType === "pickup" ? "จุดรับรถ" : "จุดส่งรถ"}
          </Text>
          <Text style={styles.locationText}>
            {locationDetails || "ไม่มีข้อมูลที่อยู่"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  noMapContainer: {
    backgroundColor: COLORS.GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    color: COLORS.GRAY_600,
    marginTop: 8,
  },
  navigateOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  navigateButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navigateText: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  detailsContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 15,
    color: COLORS.GRAY_800,
    marginBottom: 2,
  },
  locationText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 14,
    color: COLORS.GRAY_600,
    lineHeight: 20,
  },
});

export default LocationMap;