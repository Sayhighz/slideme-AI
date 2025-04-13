// src/components/upload/CarPhotoUpload.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { FONTS, COLORS } from '../../constants';

const CarPhotoUpload = ({ 
  label, 
  displayName, 
  imageUri, 
  onImageCaptured,
  disabled = false 
}) => {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Request camera permission
  const requestCameraPermission = async () => {
    setIsLoading(true);
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    setIsLoading(false);
    
    if (status !== 'granted') {
      alert('ต้องการสิทธิ์การใช้กล้องเพื่อถ่ายรูปรถ');
      return false;
    }
    return true;
  };

  // Handle image capture
  const handleCaptureImage = async () => {
    if (!cameraPermission) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        onImageCaptured(label, uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('ไม่สามารถถ่ายรูปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`bg-white border rounded-xl p-4 shadow-md`,
        styles.container,
        disabled && styles.disabledContainer,
        imageUri && styles.uploadedContainer
      ]}
      onPress={handleCaptureImage}
      disabled={disabled || isLoading}
    >
      <View style={tw`items-center justify-center`}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.PRIMARY} style={tw`mb-2`} />
        ) : imageUri ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.checkmarkContainer}>
              <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
            </View>
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <Icon name="camera" size={32} color={COLORS.PRIMARY} style={tw`mb-2`} />
          </View>
        )}
        
        <Text 
          style={[
            tw`text-gray-500`,
            styles.actionText,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {imageUri ? 'ถ่ายใหม่' : 'ถ่ายรูป'}
        </Text>
        
        <Text
          style={[
            tw`text-center mt-1`,
            styles.labelText,
            { fontFamily: FONTS.FAMILY.MEDIUM }
          ]}
        >
          {displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderColor: '#e0e0e0',
    height: 150,
    justifyContent: 'center',
  },
  disabledContainer: {
    opacity: 0.7,
  },
  uploadedContainer: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(96, 184, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
  },
  labelText: {
    fontSize: 14,
    color: '#333',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  }
});

export default CarPhotoUpload;