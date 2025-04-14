import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

/**
 * DocumentUploader - คอมโพเนนต์สำหรับอัปโหลดเอกสาร
 * @param {string} label - คีย์สำหรับระบุประเภทเอกสาร
 * @param {string} displayName - ชื่อที่แสดงให้ผู้ใช้เห็น
 * @param {string} icon - ชื่อไอคอนจาก MaterialCommunityIcons
 * @param {string} imageUri - URI ของรูปภาพที่อัปโหลด
 * @param {Function} onPress - ฟังก์ชันที่เรียกเมื่อกดปุ่มอัปโหลด
 * @param {Boolean} isProcessing - สถานะกำลังประมวลผล OCR
 * @param {String} description - ข้อความคำอธิบายเพิ่มเติม
 */
const DocumentUploader = ({
  label,
  displayName,
  icon = 'file-document-outline',
  imageUri,
  onPress,
  isProcessing = false,
  description = ''
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`bg-white rounded-lg p-4 mb-4`,
        styles.container
      ]}
      onPress={onPress}
      disabled={isProcessing}
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