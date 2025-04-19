// src/components/auth/LicensePlateScanner.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FONTS, COLORS } from '../../constants';
import OCRService from '../../services/OCRService';

/**
 * LicensePlateScanner - คอมโพเนนต์สำหรับสแกนป้ายทะเบียนรถและดึงข้อมูลอัตโนมัติ
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onScanSuccess - ฟังก์ชั่นที่จะถูกเรียกเมื่อสแกนสำเร็จพร้อมข้อมูลที่ได้
 * @param {Function} props.onImageSelected - ฟังก์ชั่นที่จะส่งกลับ URI ของรูปภาพที่เลือก
 * @param {Object} props.style - สไตล์เพิ่มเติมสำหรับคอมโพเนนต์
 */
const LicensePlateScanner = ({ onScanSuccess, onImageSelected, style }) => {
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // ถ่ายรูปด้วยกล้อง - ใช้วิธีเรียบง่ายที่สุด
  const takePicture = async () => {
    try {
      // ขออนุญาตใช้งานกล้อง
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์การเข้าถึงกล้อง',
          'โปรดอนุญาตให้แอปเข้าถึงกล้องเพื่อถ่ายภาพรถและป้ายทะเบียน'
        );
        return null;
      }
      
      // เปิดกล้อง - ใช้พารามิเตอร์น้อยที่สุด
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log('Camera image URI:', uri);
        return uri;
      }
      return null;
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถใช้กล้องได้: ' + error.message);
      return null;
    }
  };

  // เลือกรูปจากแกลเลอรี่ - ใช้วิธีเรียบง่ายที่สุด
  const selectPicture = async () => {
    try {
      // ขออนุญาตเข้าถึงแกลเลอรี่
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์การเข้าถึงแกลเลอรี่',
          'โปรดอนุญาตให้แอปเข้าถึงแกลเลอรี่เพื่อเลือกภาพรถและป้ายทะเบียน'
        );
        return null;
      }
      
      // เปิดแกลเลอรี่ - ใช้พารามิเตอร์น้อยที่สุด
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log('Gallery image URI:', uri);
        return uri;
      }
      return null;
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดแกลเลอรี่ได้: ' + error.message);
      return null;
    }
  };
  
  // สแกนป้ายทะเบียนด้วย OCR
  const scanLicensePlate = async () => {
    if (!imageUri) {
      Alert.alert(
        'ไม่พบรูปภาพ',
        'โปรดถ่ายหรือเลือกรูปภาพรถและป้ายทะเบียนก่อน'
      );
      return;
    }
    
    setScanning(true);
    setPreviewVisible(false);
    
    try {
      // สร้าง timeout เพื่อป้องกันการทำงานค้าง
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('การสแกนใช้เวลานานเกินไป')), 30000)
      );
      
      // ทำการสแกนพร้อมตั้งค่า timeout
      const result = await Promise.race([
        OCRService.readLicensePlate(imageUri),
        timeoutPromise
      ]);
      
      if (result.success) {
        // เรียกฟังก์ชัน callback พร้อมส่งข้อมูลที่อ่านได้
        if (onScanSuccess) {
          onScanSuccess(result.data);
        }
        
        Alert.alert(
          'สแกนสำเร็จ',
          `ระบบอ่านข้อมูลป้ายทะเบียน ${result.data.licensePlate} ${result.data.province ? 'จังหวัด' + result.data.province : ''} เรียบร้อยแล้ว`
        );
      } else {
        Alert.alert(
          'สแกนไม่สำเร็จ',
          'ไม่สามารถอ่านข้อมูลจากป้ายทะเบียนได้ โปรดตรวจสอบว่ารูปภาพชัดเจนและเห็นป้ายทะเบียนชัดเจน'
        );
      }
    } catch (error) {
      console.error('Error scanning license plate:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        `เกิดข้อผิดพลาดในการสแกนป้ายทะเบียน: ${error.message || 'โปรดลองอีกครั้ง'}`
      );
    } finally {
      setScanning(false);
    }
  };

  // จัดการเมื่อได้รับรูปภาพ
  const handleImageReceived = (uri) => {
    if (uri) {
      setImageUri(uri);
      if (onImageSelected) onImageSelected(uri);
      setPreviewVisible(true);
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
          <Icon name="car" size={24} color={COLORS.PRIMARY} style={tw`mr-2`} />
          <Text style={{
            fontFamily: FONTS.FAMILY.MEDIUM,
            fontSize: FONTS.SIZE.M,
            ...tw`text-gray-800`,
          }}>
            สแกนรถและป้ายทะเบียน
          </Text>
        </View>
        
        <Text style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.S,
          ...tw`text-gray-600 mb-4`,
        }}>
          ถ่ายภาพรถพร้อมป้ายทะเบียนที่ชัดเจนเพื่อกรอกข้อมูลทะเบียนรถอัตโนมัติ
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
                onPress={async () => {
                  const uri = await selectPicture();
                  handleImageReceived(uri);
                }}
                disabled={scanning}
              >
                <Icon name="refresh" size={20} color={COLORS.GRAY_700} style={tw`mr-1`} />
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
                onPress={scanLicensePlate}
                disabled={scanning}
              >
                <Icon name="text-recognition" size={20} color="#fff" style={tw`mr-1`} />
                <Text style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-white`,
                }}>
                  {scanning ? 'กำลังสแกน...' : 'สแกนป้ายทะเบียน'}
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
              onPress={async () => {
                const uri = await takePicture();
                handleImageReceived(uri);
              }}
              disabled={scanning}
              activeOpacity={0.7}
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
              onPress={async () => {
                const uri = await selectPicture();
                handleImageReceived(uri);
              }}
              disabled={scanning}
              activeOpacity={0.7}
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
            กำลังสแกนและอ่านข้อมูลจากป้ายทะเบียน...
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
              <TouchableOpacity 
                onPress={cancelScan}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
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
                ตรวจสอบว่ารูปภาพชัดเจนและเห็นป้ายทะเบียนชัดเจน
              </Text>
              
              <View style={tw`flex-row justify-between`}>
                <TouchableOpacity
                  style={tw`flex-1 py-3 bg-gray-200 rounded-lg mr-2 items-center`}
                  onPress={cancelScan}
                  activeOpacity={0.7}
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
                  onPress={scanLicensePlate}
                  activeOpacity={0.7}
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

export default LicensePlateScanner;