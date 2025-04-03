import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import * as ImagePicker from "expo-image-picker";
import { IP_ADDRESS } from "../../config";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import SubmitButton from "../../components/SubmitButton";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

const CarUploadDropOffConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { request_id } = route.params || {};
  const { userData = {} } = route.params || {};

  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to handle image selection
  const handleImageSelection = async (label) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ขอสิทธิ์ใช้งาน", "โปรดอนุญาตการเข้าถึงรูปภาพในคลัง");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });

      if (!result.canceled) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImages((prevImages) => ({
          ...prevImages,
          [label]: uri,
        }));
      }
    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  // Update button enabled state when images change
  useEffect(() => {
    const allImagesUploaded = Object.values(images).every((uri) => uri !== null);

    if (allImagesUploaded) {
      const timer = setTimeout(() => setButtonEnabled(true), 3000); // 3-second delay
      return () => clearTimeout(timer);
    } else {
      setButtonEnabled(false);
    }
  }, [images]);

  // Render upload box
  const renderUploadBox = (label, displayName) => (
    <TouchableOpacity
      style={tw`flex-1 bg-white border border-gray-300 rounded-lg p-4 m-2 shadow-md`}
      onPress={() => handleImageSelection(label)}
    >
      <View style={tw`items-center m-auto`}>
        {images[label] ? (
          <Image
            source={{ uri: images[label] }}
            style={tw`w-15 h-15 mb-2 rounded-lg`}
            resizeMode="cover"
          />
        ) : (
          <Icon
            name="cloud-upload-outline"
            size={32}
            color="gray"
            style={tw`mb-2`}
          />
        )}
        <Text style={[styles.globalFont,tw`text-gray-400`]}>อัพโหลด</Text>
        <Text
          style={[styles.globalFont,tw`text-base text-center text-black`]}
        >
          {displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Handle image upload and request completion
  const handleConfirmation = async () => {
    const imageUris = Object.values(images).filter((uri) => uri !== null);

    if (imageUris.length < 4) {
      Alert.alert("ข้อผิดพลาด", "โปรดอัพโหลดรูปภาพทั้งหมด");
      return;
    }

    if (!request_id || !userData?.driver_id) {
      Alert.alert("ข้อผิดพลาด", "ข้อมูลคำขอหรือผู้ขับไม่สมบูรณ์");
      return;
    }

    const formData = new FormData();
    formData.append("request_id", request_id);
    formData.append("driver_id", userData?.driver_id);

    imageUris.forEach((uri, index) => {
      const fileName = uri.split("/").pop();
      const fileType = fileName.split(".").pop();

      formData.append("photos", {
        uri,
        name: `photo-${index}.${fileType}`,
        type: `image/${fileType}`,
      });
    });

    try {
      const response = await fetch(`http://${IP_ADDRESS}:3000/auth/upload_after_service`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.Status) {
        navigation.navigate('JobWorking_Dropoff', { request_id, workStatus: true });
      } else {
        Alert.alert('ข้อผิดพลาด', result.Error || 'การอัพโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Error during API call:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดปัญหาระหว่างการอัพโหลดรูปภาพ');
    }
  };

  // Show confirmation dialog
  const confirmAction = () => {
    setIsModalVisible(true);
  };

  return (
    <>
      {/* Header */}
      <HeaderWithBackButton
        showBackButton={true}
        title="อัพโหลดรูปภาพ"
        onPress={() => navigation.goBack()}
      />
      <SafeAreaView style={tw`flex-1 bg-white`}>
        {/* Scrollable Upload Boxes Section */}
        <ScrollView contentContainerStyle={tw`p-4 flex-1`}>
          {/* Upload Boxes */}
          {renderUploadBox('front', 'ด้านหน้ารถ')}
          {renderUploadBox('back', 'ด้านหลังรถ')}
          <View style={tw`flex-row justify-between mt-4`}>
            {renderUploadBox('left', 'ด้านข้างรถ (ซ้าย)')}
            {renderUploadBox('right', 'ด้านข้างรถ (ขวา)')}
          </View>
          <View style={tw`h-20`}></View>
        </ScrollView>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          visible={isModalVisible}
          title="ยืนยันการอัพโหลด"
          message="คุณแน่ใจหรือไม่ว่าต้องการอัพโหลดรูปภาพเหล่านี้?"
          onConfirm={() => {
            setIsModalVisible(false);
            handleConfirmation();
          }}
          onCancel={() => setIsModalVisible(false)}
        />

        {/* Submit Button */}
        <SubmitButton 
          onPress={confirmAction} 
          title="ยืนยันการอัพโหลด" 
          disabled={!buttonEnabled}  // Button enabled only after 4 images are uploaded and delay
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  globalFont: {
    fontFamily: "Mitr-Regular",
  },
});

export default CarUploadDropOffConfirmation;
