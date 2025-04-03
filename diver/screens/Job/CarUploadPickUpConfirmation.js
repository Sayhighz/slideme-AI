import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, Alert, StyleSheet,ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import * as ImagePicker from 'expo-image-picker';
import { IP_ADDRESS } from '../../config';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import SubmitButton from '../../components/SubmitButton';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';

const CarUploadPickUpConfirmation = () => {
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
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isDelayOver, setIsDelayOver] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Update button state based on uploaded images
  useEffect(() => {
    const allImagesUploaded = Object.values(images).every((uri) => uri !== null);

    if (allImagesUploaded) {
      setIsButtonDisabled(true);
      setIsDelayOver(false);

      // Add a 3-second delay before enabling the button
      const delayTimer = setTimeout(() => {
        setIsButtonDisabled(false);
        setIsDelayOver(true);
      }, 3000);

      return () => clearTimeout(delayTimer);
    } else {
      setIsButtonDisabled(true);
    }
  }, [images]);

  // Handle image selection
  const handleImageSelection = async (label) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ขอสิทธิ์ใช้งาน', 'โปรดให้สิทธิ์การเข้าถึงคลังรูปภาพ');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImages((prevImages) => ({
          ...prevImages,
          [label]: uri,
        }));
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  // Render upload box component
  const renderUploadBox = (label, displayName) => (
    <TouchableOpacity
      style={tw`flex-1 bg-white border border-gray-300 rounded-lg p-4 m-2 shadow-md`}
      onPress={() => handleImageSelection(label)}
    >
      <View style={[styles.globalFont,tw`items-center m-auto`]}>
        {images[label] ? (
          <Image
            source={{ uri: images[label] }}
            style={tw`w-15 h-15 mb-2 rounded-lg`}
            resizeMode="cover"
          />
        ) : (
          <Icon name="cloud-upload-outline" size={32} color="gray" style={tw`mb-2`} />
        )}
        <Text style={[styles.globalFont,tw`text-gray-400`]}>อัพโหลด</Text>
        <Text style={[styles.globalFont,tw`text-base text-center text-black`]}>
          {displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Handle confirmation
  const handleConfirmation = async () => {
    if (!request_id || !userData?.driver_id) {
      Alert.alert('ข้อผิดพลาด', 'ไม่มีข้อมูลการร้องขอหรือข้อมูลผู้ขับ');
      return;
    }

    const imageUris = Object.values(images).filter((uri) => uri !== null);

    if (imageUris.length < 4) {
      Alert.alert('ข้อผิดพลาด', 'โปรดอัพโหลดรูปภาพทั้งหมด 4 รูป');
      return;
    }

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

    try {
      const response = await fetch(`http://${IP_ADDRESS}:3000/auth/upload_before_service`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.Status) {
        navigation.navigate('JobWorking_Pickup', { request_id, workStatus: true });
      } else {
        Alert.alert('ข้อผิดพลาด', result.Error || 'การอัพโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Error during API call:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดปัญหาระหว่างการอัพโหลดรูปภาพ');
    }
  };

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
      disabled={isButtonDisabled} 
    />
  </SafeAreaView>
    </>


  );
};

const styles = StyleSheet.create({
  globalFont: {
    fontFamily: "Mitr-Regular",
  }
});

export default CarUploadPickUpConfirmation;
