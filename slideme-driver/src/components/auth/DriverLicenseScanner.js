// src/components/auth/DriverLicenseScanner.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FONTS, COLORS } from '../../constants';
import OCRService from '../../services/OCRService';

/**
 * DriverLicenseScanner - คอมโพเนนต์สำหรับสแกนใบขับขี่และดึงข้อมูลอัตโนมัติ
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onScanSuccess - ฟังก์ชั่นที่จะถูกเรียกเมื่อสแกนสำเร็จพร้อมข้อมูลที่ได้
 * @param {Function} props.onImageSelected - ฟังก์ชั่นที่จะส่งกลับ URI ของรูปภาพที่เลือก
 * @param {Object} props.style - สไตล์เพิ่มเติมสำหรับคอมโพเนนต์
 */
const DriverLicenseScanner = ({ onScanSuccess, onImageSelected, style }) => {
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // เลือกรูปภาพจากกล้องหรือแกลเลอรี่
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      
      if (useCamera) {
        // ขออนุญาตใช้งานกล้อง
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'ต้องการสิทธิ์การเข้าถึงกล้อง',
            'โปรดอนุญาตให้แอปเข้าถึงกล้องเพื่อถ่ายภาพใบขับขี่'
          );
          return;
        }
        
        // เปิดกล้อง
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        // ขออนุญาตเข้าถึงแกลเลอรี่
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'ต้องการสิทธิ์การเข้าถึงแกลเลอรี่',
            'โปรดอนุญาตให้แอปเข้าถึงแกลเลอรี่เพื่อเลือกภาพใบขับขี่'
          );
          return;
        }
        
        // เปิดแกลเลอรี่
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImageUri(selectedImage.uri);
        
        // ส่ง URI ของรูปภาพกลับไปให้ parent component
        if (onImageSelected) {
          onImageSelected(selectedImage.uri);
        }
        
        setPreviewVisible(true);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        'เกิดข้อผิดพลาดในการเลือกรูปภาพ โปรดลองอีกครั้ง'
      );
    }
  };
  
  // สแกนใบขับขี่ด้วย OCR
  const scanDriverLicense = async () => {
    if (!imageUri) {
      Alert.alert(
        'ไม่พบรูปภาพ',
        'โปรดถ่ายหรือเลือกรูปภาพใบขับขี่ก่อน'
      );
      return;
    }
    
    setScanning(true);
    setPreviewVisible(false);
    
    try {
      const result = await OCRService.readThaiDriverLicense(imageUri);
      
      if (result.success) {
        // เรียกฟังก์ชัน callback พร้อมส่งข้อมูลที่อ่านได้
        if (onScanSuccess) {
          onScanSuccess(result.data);
        }
        
        Alert.alert(
          'สแกนสำเร็จ',
          'ระบบอ่านข้อมูลจากใบขับขี่เรียบร้อยแล้ว'
        );
      } else {
        Alert.alert(
          'สแกนไม่สำเร็จ',
          'ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้ โปรดตรวจสอบว่ารูปภาพชัดเจนและถ่ายเต็มใบขับขี่'
        );
      }
    } catch (error) {
      console.error('Error scanning driver license:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        'เกิดข้อผิดพลาดในการสแกนใบขับขี่ โปรดลองอีกครั้ง'
      );
    } finally {
      setScanning(false);
    }
  };

  // ยกเลิกการสแกน
  const cancelScan = () => {
    setPreviewVisible(false);
  };

  return (
    <View style={[tw`w-full`, style]}>
      <View style={tw`bg-white rounded-lg border border-gray-200 p-4 mb-4`}>
        <View style={tw`flex-row items-center mb-3`}>
          <Icon name="card-account-details-outline" size={24} color={COLORS.PRIMARY} style={tw`mr-2`} />
          <Text style={{
            fontFamily: FONTS.FAMILY.MEDIUM,
            fontSize: FONTS.SIZE.M,
            ...tw`text-gray-800`,
          }}>
            สแกนใบขับขี่
          </Text>
        </View>
        
        <Text style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.S,
          ...tw`text-gray-600 mb-4`,
        }}>
          สแกนใบขับขี่เพื่อกรอกข้อมูลอัตโนมัติและประหยัดเวลาในการลงทะเบียน
        </Text>
        
        {imageUri ? (
          <View style={tw`mb-4`}>
            <Image 
              source={{ uri: imageUri }} 
              style={tw`w-full h-40 rounded-lg`}
              resizeMode="cover"
            />
            
            <View style={tw`flex-row mt-3`}>
              <TouchableOpacity
                style={tw`flex-1 py-2 mr-2 flex-row items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}
                onPress={() => pickImage(false)}
                disabled={scanning}
              >
                <Icon name="image-refresh" size={20} color={COLORS.GRAY_700} style={tw`mr-1`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-gray-700`,
                }}>
                  เลือกรูปใหม่
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  tw`flex-1 py-2 ml-2 flex-row items-center justify-center rounded-lg`,
                  { backgroundColor: COLORS.PRIMARY }
                ]}
                onPress={scanDriverLicense}
                disabled={scanning}
              >
                <Icon name="text-recognition" size={20} color="#fff" style={tw`mr-1`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-white`,
                }}>
                  {scanning ? 'กำลังสแกน...' : 'สแกนข้อมูล'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={[
                tw`flex-1 py-2 rounded-lg mr-2 flex-row items-center justify-center`,
                { backgroundColor: COLORS.PRIMARY }
              ]}
              onPress={() => pickImage(true)}
              disabled={scanning}
            >
              <Icon name="camera" size={20} color="#fff" style={tw`mr-1`} />
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-white`,
              }}>
                ถ่ายภาพ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                tw`flex-1 py-2 rounded-lg ml-2 flex-row items-center justify-center bg-gray-100`,
                { borderWidth: 1, borderColor: COLORS.GRAY_300 }
              ]}
              onPress={() => pickImage(false)}
              disabled={scanning}
            >
              <Icon name="image" size={20} color={COLORS.GRAY_700} style={tw`mr-1`} />
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                ...tw`text-gray-700`,
              }}>
                เลือกรูป
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {scanning && (
        <View style={tw`bg-white rounded-lg border border-gray-200 p-4 mb-4 flex-row items-center`}>
          <ActivityIndicator size="small" color={COLORS.PRIMARY} style={tw`mr-3`} />
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw`text-gray-700 flex-1`,
          }}>
            กำลังสแกนและอ่านข้อมูลจากใบขับขี่...
          </Text>
        </View>
      )}
      
      {/* Modal แสดงรูปภาพก่อนสแกน */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelScan}
      >
        <View style={tw`flex-1 bg-black/80 justify-center items-center p-6`}>
          <View style={tw`bg-white rounded-xl w-full max-w-lg overflow-hidden`}>
            <View style={tw`p-4 border-b border-gray-200 flex-row justify-between items-center`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                fontSize: FONTS.SIZE.M,
                ...tw`text-gray-800`,
              }}>
                ตรวจสอบรูปภาพ
              </Text>
              <TouchableOpacity onPress={cancelScan}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={tw`p-4`}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={tw`w-full h-48 rounded-lg mb-4`}
                  resizeMode="contain"
                />
              ) : null}
              
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.S,
                ...tw`text-gray-600 mb-4 text-center`,
              }}>
                ตรวจสอบว่ารูปภาพชัดเจนและเห็นข้อมูลใบขับขี่ครบถ้วน
              </Text>
              
              <View style={tw`flex-row justify-between`}>
                <TouchableOpacity
                  style={tw`flex-1 py-3 bg-gray-200 rounded-lg mr-2 items-center`}
                  onPress={cancelScan}
                >
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    ...tw`text-gray-700`,
                  }}>
                    ยกเลิก
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    tw`flex-1 py-3 rounded-lg ml-2 items-center`,
                    { backgroundColor: COLORS.PRIMARY }
                  ]}
                  onPress={scanDriverLicense}
                >
                  <Text style={{
                    fontFamily: FONTS.FAMILY.REGULAR,
                    ...tw`text-white`,
                  }}>
                    สแกนเลย
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverLicenseScanner;