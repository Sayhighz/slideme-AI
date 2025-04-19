import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

/**
 * DocumentUploader - คอมโพเนนต์สำหรับอัปโหลดเอกสาร
 * @param {string} label - คีย์สำหรับระบุประเภทเอกสาร
 * @param {string} displayName - ชื่อที่แสดงให้ผู้ใช้เห็น
 * @param {string} icon - ชื่อไอคอนจาก MaterialCommunityIcons
 * @param {string} imageUri - URI ของรูปภาพที่อัปโหลด
 * @param {Function} onImageSelected - ฟังก์ชันที่เรียกเมื่อเลือกรูปภาพเสร็จ (ส่ง URI กลับไป)
 * @param {Boolean} isProcessing - สถานะกำลังประมวลผล OCR
 * @param {String} description - ข้อความคำอธิบายเพิ่มเติม
 */
const DocumentUploader = ({
  label,
  displayName,
  icon = 'file-document-outline',
  imageUri,
  onImageSelected,
  isProcessing = false,
  description = ''
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // ถ่ายรูปด้วยกล้อง
  const takePicture = async () => {
    try {
      // ขออนุญาตใช้งานกล้อง
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์การเข้าถึงกล้อง',
          'โปรดอนุญาตให้แอปเข้าถึงกล้องเพื่อถ่ายภาพ'
        );
        return null;
      }
      
      // เปิดกล้อง
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

  // เลือกรูปจากแกลเลอรี่
  const selectPicture = async () => {
    try {
      // ขออนุญาตเข้าถึงแกลเลอรี่
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์การเข้าถึงแกลเลอรี่',
          'โปรดอนุญาตให้แอปเข้าถึงแกลเลอรี่เพื่อเลือกภาพ'
        );
        return null;
      }
      
      // เปิดแกลเลอรี่
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

  // เรียกเมื่อได้รับรูปภาพ
  const handleImageReceived = (uri) => {
    if (uri && onImageSelected) {
      onImageSelected(uri);
      setModalVisible(false);
    }
  };

  // แสดง Modal เลือกวิธีการอัปโหลด
  const showUploadOptions = () => {
    if (isProcessing) return;
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          tw`bg-white rounded-lg p-4 mb-4`,
          styles.container
        ]}
        onPress={showUploadOptions}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`mr-4`}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={tw`w-20 h-20 rounded-lg`}
                resizeMode="cover"
              />
            ) : (
              <View style={[tw`w-20 h-20 rounded-lg items-center justify-center`, styles.placeholder]}>
                <Icon name={icon} size={32} color={COLORS.GRAY_500} />
              </View>
            )}
          </View>
          
          <View style={tw`flex-1`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              fontSize: FONTS.SIZE.M,
              ...tw`text-gray-800 mb-1`,
            }}>
              {displayName}
            </Text>
            
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.S,
              ...tw`text-gray-500`,
            }}>
              {imageUri ? 'อัปโหลดแล้ว' : 'แตะเพื่ออัปโหลด'}
            </Text>

            {description ? (
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.XS,
                ...tw`text-gray-400 mt-1`,
              }}>
                {description}
              </Text>
            ) : null}
          </View>
          
          <View style={tw`ml-2`}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            ) : imageUri ? (
              <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
            ) : (
              <View style={styles.uploadButton}>
                <Icon name="upload" size={18} color="#fff" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal สำหรับเลือกวิธีอัปโหลด */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/60 justify-end`}>
          <View style={tw`bg-white rounded-t-xl overflow-hidden`}>
            <View style={tw`px-5 py-4 border-b border-gray-200`}>
              <Text style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                fontSize: FONTS.SIZE.M,
                ...tw`text-gray-800 text-center`,
              }}>
                เลือกวิธีอัปโหลดรูปภาพ
              </Text>
            </View>

            <TouchableOpacity
              style={tw`px-5 py-4 flex-row items-center border-b border-gray-100`}
              onPress={async () => {
                const uri = await takePicture();
                handleImageReceived(uri);
              }}
            >
              <Icon name="camera" size={24} color={COLORS.PRIMARY} style={tw`mr-3`} />
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.M,
                ...tw`text-gray-800`,
              }}>
                ถ่ายภาพใหม่
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`px-5 py-4 flex-row items-center border-b border-gray-100`}
              onPress={async () => {
                const uri = await selectPicture();
                handleImageReceived(uri);
              }}
            >
              <Icon name="image" size={24} color={COLORS.PRIMARY} style={tw`mr-3`} />
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.M,
                ...tw`text-gray-800`,
              }}>
                เลือกจากแกลเลอรี่
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`px-5 py-4 mb-2`}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.M,
                ...tw`text-center text-red-500`,
              }}>
                ยกเลิก
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placeholder: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  uploadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  }
});

export default DocumentUploader;