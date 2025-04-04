import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "../../services/api";
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from "../../constants";

// Import components
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import SubmitButton from "../../components/common/SubmitButton";
import HeaderWithBackButton from "../../components/common/HeaderWithBackButton";

const CarUploadPickUpConfirmationScreen = ({ route }) => {
  const navigation = useNavigation();
  const { request_id } = route.params || {};
  const { userData = {} } = route.params || {};

  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [isDelayOver, setIsDelayOver] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Update button state based on uploaded images
  useEffect(() => {
    const allImagesUploaded = Object.values(images).every((uri) => uri !== null);

    if (allImagesUploaded) {
      setButtonEnabled(false);
      setIsDelayOver(false);

      // Add a 3-second delay before enabling the button
      const delayTimer = setTimeout(() => {
        setButtonEnabled(true);
        setIsDelayOver(true);
      }, 3000);

      return () => clearTimeout(delayTimer);
    } else {
      setButtonEnabled(false);
    }
  }, [images]);

  // Handle image selection
  const handleImageSelection = async (label) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ขอสิทธิ์ใช้งาน", "โปรดให้สิทธิ์การเข้าถึงคลังรูปภาพ");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImages((prevImages) => ({
          ...prevImages,
          [label]: uri,
        }));
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเลือกรูปภาพได้");
    }
  };

  // Render upload box component
  const renderUploadBox = (label, displayName) => (
    <TouchableOpacity
      style={tw`flex-1 bg-white border border-gray-300 rounded-lg p-4 m-2 shadow-md`}
      onPress={() => handleImageSelection(label)}
    >
      <View 
        style={tw`items-center m-auto`}
      >
        {images[label] ? (
          <Image
            source={{ uri: images[label] }}
            style={tw`w-15 h-15 mb-2 rounded-lg`}
            resizeMode="cover"
          />
        ) : (
          <Icon name="cloud-upload-outline" size={32} color="gray" style={tw`mb-2`} />
        )}
        <Text 
          style={[
            tw`text-gray-400`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          อัพโหลด
        </Text>
        <Text 
          style={[
            tw`text-base text-center text-black`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Handle confirmation
  const handleConfirmation = async () => {
    if (!request_id || !userData?.driver_id) {
      Alert.alert("ข้อผิดพลาด", "ไม่มีข้อมูลการร้องขอหรือข้อมูลผู้ขับ");
      return;
    }

    const imageUris = Object.values(images).filter((uri) => uri !== null);

    if (imageUris.length < 4) {
      Alert.alert("ข้อผิดพลาด", "โปรดอัพโหลดรูปภาพทั้งหมด 4 รูป");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('request_id', request_id);
      formData.append('driver_id', userData?.driver_id);

      imageUris.forEach((uri, index) => {
        const fileName = uri.split('/').pop();
        const fileType = fileName.split('.').pop();

        formData.append('photos', {
          uri,
          name: `photo-${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      const result = await uploadFile(API_ENDPOINTS.UPLOAD.UPLOAD_BEFORE, formData);

      if (result.Status) {
        navigation.navigate('JobWorkingPickup', { 
          request_id, 
          workStatus: true,
          userData 
        });
      } else {
        Alert.alert('ข้อผิดพลาด', result.Error || 'การอัพโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Error during API call:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.UPLOAD);
    } finally {
      setIsUploading(false);
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
          disabled={!buttonEnabled || isUploading} 
        />
      </SafeAreaView>
    </>
  );
};

export default CarUploadPickUpConfirmationScreen;