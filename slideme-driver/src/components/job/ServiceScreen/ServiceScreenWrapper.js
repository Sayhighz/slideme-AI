import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Linking,
  Alert
} from "react-native";
import tw from "twrnc";
import { COLORS, FONTS } from "../../../constants";

// Import components
import ServiceScreenHeader from "./ServiceScreenHeader";
import StatusIndicator from "./StatusIndicator";
import CustomerHeader from "./CustomerHeader";
import LocationMap from "./LocationMap";
import JobDetailsSection from "./JobDetailsSection";
import SubmitButton from "../../common/SubmitButton";
import ConfirmationDialog from "../../common/ConfirmationDialog";

const ServiceScreenWrapper = ({
  isLoading = false,
  error = null,
  showBackButton = false,
  onBack = null,
  isDropoff = false,
  serviceData = null,
  userData = null,
  currentStep = 1,
  photosUploaded = false,
  buttonTitle = "ยืนยันการถึงจุดรับรถ",
  onConfirmAction = () => {},
  navigation,
  confirmationTitle = "",
  confirmationMessage = "",
  handleConfirm = () => {},
  showConfirmDialog = false,
  setShowConfirmDialog = () => {},
}) => {
  // Format data for components
  const getFormattedData = () => {
    if (!serviceData) return null;

    return {
      customer: {
        customer_name: serviceData.customer_name,
        first_name: serviceData.customer_first_name,
        last_name: serviceData.customer_last_name,
        customer_phone: serviceData.customer_phone,
      },
      tripDetails: {
        vehicleType: serviceData.vehicletype_name,
        distance: serviceData.trip_distance_text || `${serviceData.trip_distance || serviceData.distance || 0} กม.`,
        duration: serviceData.estimated_duration_text || `${serviceData.estimated_duration || 0} นาที`,
      },
      coordinates: isDropoff 
        ? { latitude: serviceData.dropoff_lat, longitude: serviceData.dropoff_long }
        : { latitude: serviceData.pickup_lat, longitude: serviceData.pickup_long },
      locationDetails: isDropoff ? serviceData.location_to : serviceData.location_from,
      customerMessage: serviceData.customer_message,
      estimatedPrice: serviceData.price_estimate_text || serviceData.estimated_price || null,
    };
  };

  // Handle calling customer
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url);
    } else {
      Alert.alert("หมายเลขโทรศัพท์", "หมายเลขโทรศัพท์ไม่พร้อมใช้งาน");
    }
  };

  // Handle chat navigation
  const handleChat = () => {
    const data = getFormattedData();
    if (!data) return;

    navigation.navigate("ChatScreen", { 
      room_id: serviceData.request_id, 
      user_name: data.customer.customer_name || `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim(),
      phoneNumber: data.customer.customer_phone
    });
  };

  // Handle map navigation
  const handleNavigate = () => {
    const data = getFormattedData();
    if (!data || !data.coordinates) return;
    
    const { latitude, longitude } = data.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const data = getFormattedData();
  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>ไม่พบข้อมูลงาน</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ServiceScreenHeader
          onBack={showBackButton ? onBack : null}
          isDropoff={isDropoff}
          hideCancel={isDropoff}
        />

        {/* Status Indicator */}
        <StatusIndicator
          currentStep={currentStep}
          uploadPhotosComplete={photosUploaded}
        />

        {/* Customer Header */}
        <CustomerHeader 
          customer={data.customer}
          onCall={handleCall}
          onChat={handleChat}
          tripDetails={data.tripDetails}
        />

        {/* Location Map */}
        <LocationMap 
          coordinates={data.coordinates}
          locationDetails={data.locationDetails}
          markerTitle={isDropoff ? "จุดส่ง" : "จุดรับ"}
          markerDescription={isDropoff ? "ตำแหน่งที่ตั้งของการส่ง" : "ตำแหน่งที่ตั้งของการรับ"}
          onNavigate={handleNavigate}
          locationType={isDropoff ? "dropoff" : "pickup"}
        />

        {/* Job Details Section */}
        <JobDetailsSection 
          locationDetails={data.locationDetails}
          customerMessage={data.customerMessage}
          estimatedPrice={!isDropoff ? data.estimatedPrice : null}
          isDropoff={isDropoff}
        />

        {/* Space for button */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showConfirmDialog}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleConfirm();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Submit Button */}
      <SubmitButton 
        onPress={onConfirmAction} 
        title={buttonTitle} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // สำหรับพื้นที่ปุ่ม
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.FAMILY.REGULAR,
    color: COLORS.GRAY_600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "white",
  },
  errorText: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    color: COLORS.DANGER,
    fontSize: 16,
  },
  buttonSpacer: {
    height: 40,
  },
});

export default ServiceScreenWrapper;