// src/components/upload/PhotoUploadProgress.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

const PhotoUploadProgress = ({ images, isUploading }) => {
  const completedCount = useMemo(() => {
    return Object.values(images).filter(uri => uri !== null).length;
  }, [images]);

  const progressPercentage = (completedCount / 4) * 100;

  return (
    <View style={tw`mb-6 mt-2`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Text style={[tw`text-gray-700`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
          ความคืบหน้า
        </Text>
        <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
          {completedCount}/4
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
      
      <View style={tw`mt-3 flex-row justify-center items-center`}>
        {isUploading ? (
          <View style={tw`flex-row items-center`}>
            <Icon name="cloud-upload" size={16} color={COLORS.PRIMARY} style={tw`mr-2`} />
            <Text style={[tw`text-sm text-green-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              กำลังอัปโหลดรูปภาพ...
            </Text>
          </View>
        ) : completedCount === 4 ? (
          <View style={tw`flex-row items-center`}>
            <Icon name="check-circle" size={16} color={COLORS.PRIMARY} style={tw`mr-2`} />
            <Text style={[tw`text-sm text-green-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              เสร็จสิ้น! พร้อมส่งรูปภาพ
            </Text>
          </View>
        ) : (
          <Text style={[tw`text-sm text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            {completedCount === 0 
              ? 'โปรดถ่ายรูปรถทั้ง 4 ด้าน' 
              : `กรุณาถ่ายรูปอีก ${4 - completedCount} รูป`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  }
});

export default PhotoUploadProgress;