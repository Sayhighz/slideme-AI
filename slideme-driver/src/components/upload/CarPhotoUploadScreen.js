// src/components/upload/CarPhotoUploadScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';
import { FONTS, COLORS, MESSAGES } from '../../constants';
import PhotoUploadService from '../../services/PhotoUploadService';

// Import components
import HeaderWithBackButton from '../common/HeaderWithBackButton';
import CarPhotoUpload from './CarPhotoUpload';
import PhotoUploadProgress from './PhotoUploadProgress';
import SubmitButton from '../common/SubmitButton';
import ConfirmationDialog from '../common/ConfirmationDialog';

const CarPhotoUploadScreen = ({
  title,
  description,
  uploadType,
  request_id,
  userData,
  uploadEndpoint,
  nextScreen,
  extraNotes
}) => {
  const navigation = useNavigation();
  
  // State
  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Update button enabled state when all images are captured
  useEffect(() => {
    const allImagesCaptured = Object.values(images).every((uri) => uri !== null);
    
    if (allImagesCaptured) {
      // Add a slight delay before enabling button for better UX
      const timer = setTimeout(() => setButtonEnabled(true), 500);
      return () => clearTimeout(timer);
    } else {
      setButtonEnabled(false);
    }
  }, [images]);

  // Handle image capture
  const handleImageCaptured = (label, uri) => {
    setImages((prevImages) => ({
      ...prevImages,
      [label]: uri,
    }));
  };

  // Handle confirmation
  const handleConfirmation = async () => {
    if (!request_id || !userData?.driver_id) {
      Alert.alert('ข้อผิดพลาด', 'ไม่มีข้อมูลการร้องขอหรือข้อมูลผู้ขับ');
      return;
    }

    const imageUris = Object.values(images).filter((uri) => uri !== null);
    if (imageUris.length < 4) {
      Alert.alert('ข้อผิดพลาด', 'โปรดถ่ายรูปรถให้ครบทั้ง 4 ด้าน');
      return;
    }

    setIsUploading(true);
    
    try {
      // กำหนด uploadType ตามประเภทการอัปโหลด ('before' หรือ 'after')
      const type = uploadEndpoint.includes('_before') ? 'before' : 'after';
      
      // ใช้ PhotoUploadService แทนการเขียนตรรกะโดยตรง
      const result = await PhotoUploadService.uploadCarPhotos(
        type,
        images,
        request_id,
        userData.driver_id,
        setUploadStatus
      );
      
      if (result && result.Status) {
        // ตรวจสอบว่า API ตอบกลับมาในรูปแบบใหม่ (array ของรูปภาพ)
        const resultFiles = result.Result?.files || [];
        
        navigation.navigate(nextScreen, { 
          request_id, 
          workStatus: true,
          userData,
          uploadedPhotos: resultFiles
        });
      } else {
        Alert.alert('ข้อผิดพลาด', result?.Error || 'การอัปโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Error during upload:', error);
      Alert.alert('ข้อผิดพลาด', error.message || MESSAGES.ERRORS.UPLOAD);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  // Show confirmation dialog
  const confirmAction = () => {
    setIsModalVisible(true);
  };

  return (
    <>
      <HeaderWithBackButton
        showBackButton={true}
        title={title}
        onPress={() => navigation.goBack()}
      />
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <ScrollView 
          contentContainerStyle={tw`p-4`}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={[tw`text-gray-700 mb-4`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            {description}
          </Text>
          
          {/* Upload Progress */}
          <PhotoUploadProgress 
            images={images} 
            isUploading={isUploading} 
          />
          
          {/* Instruction and Icon */}
          <View style={tw`flex-row items-center justify-center mb-4`}>
            <View style={styles.instructionContainer}>
              <Text style={[tw`text-sm text-center text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                กดที่ช่องเพื่อถ่ายรูปรถแต่ละด้าน
              </Text>
            </View>
          </View>
          
          {/* Upload Grid */}
          <View style={tw`mb-4`}>
            <CarPhotoUpload
              label="front"
              displayName="ด้านหน้ารถ"
              imageUri={images.front}
              onImageCaptured={handleImageCaptured}
              disabled={isUploading}
            />
            
            <CarPhotoUpload
              label="back"
              displayName="ด้านหลังรถ"
              imageUri={images.back}
              onImageCaptured={handleImageCaptured}
              disabled={isUploading}
            />
            
            <View style={tw`flex-row mt-2`}>
              <CarPhotoUpload
                label="left"
                displayName="ด้านซ้าย"
                imageUri={images.left}
                onImageCaptured={handleImageCaptured}
                disabled={isUploading}
              />
              
              <CarPhotoUpload
                label="right"
                displayName="ด้านขวา"
                imageUri={images.right}
                onImageCaptured={handleImageCaptured}
                disabled={isUploading}
              />
            </View>
          </View>

          {/* Extra Notes */}
          {extraNotes && (
            <Text style={[tw`mt-2 text-xs text-gray-500 italic`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              {extraNotes}
            </Text>
          )}
          
          {/* Upload Status */}
          {uploadStatus && (
            <Text style={[tw`mt-2 text-green-600 text-center`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              {uploadStatus}
            </Text>
          )}
          
          <View style={tw`h-24`} />
        </ScrollView>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          visible={isModalVisible}
          title="ยืนยันการส่งรูปภาพ"
          message={`คุณแน่ใจว่าต้องการส่งรูปภาพสำหรับ${uploadType}ใช่หรือไม่?`}
          onConfirm={() => {
            setIsModalVisible(false);
            handleConfirmation();
          }}
          onCancel={() => setIsModalVisible(false)}
        />

        {/* Submit Button */}
        <SubmitButton 
          onPress={confirmAction} 
          title={isUploading ? "กำลังอัปโหลด..." : "ยืนยันการส่งรูปภาพ"} 
          disabled={!buttonEnabled || isUploading} 
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  instructionContainer: {
    backgroundColor: 'rgba(96, 184, 118, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 4,
  }
});

export default CarPhotoUploadScreen;