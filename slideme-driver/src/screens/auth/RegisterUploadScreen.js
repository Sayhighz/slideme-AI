import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';

// Import services and constants
import { FONTS, COLORS, MESSAGES } from '../../constants';

const RegisterUploadScreen = ({ navigation, route }) => {
  const routeParams = route.params || {};
  
  const [images, setImages] = useState({
    idPhoto: null,
    vehiclePhoto: null,
    vehicleDoc: null,
    idCardPhoto: null,
    licensePhoto: null,
    bankBookPhoto: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleImageSelection = async (label) => {
    const hasPermission = await requestMediaLibraryPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'ขออนุญาตเข้าถึงรูปภาพ',
        'กรุณาอนุญาตให้แอปเข้าถึงคลังรูปภาพ'
      );
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
      console.error('Error selecting image:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้');
    }
  };

  const getUploadCompletionRate = () => {
    const total = Object.keys(images).length;
    const uploaded = Object.values(images).filter(uri => uri !== null).length;
    return Math.round((uploaded / total) * 100);
  };

  const handleNext = () => {
    // Check if all images are uploaded
    const isAllUploaded = Object.values(images).every(uri => uri !== null);
    
    if (!isAllUploaded) {
      Alert.alert('แจ้งเตือน', 'กรุณาอัปโหลดเอกสารทั้งหมด');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, we would upload all images to the server here before proceeding
      // For this mockup, we'll just proceed to the next screen
      navigation.navigate('RegisterVerification', {
        ...routeParams,
        uploadedDocuments: true,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadButton = (label, displayName, icon = 'file-document-outline') => (
    <TouchableOpacity
      style={tw`bg-white shadow border border-gray-200 rounded-lg p-4 mb-4 flex-row items-center`}
      onPress={() => handleImageSelection(label)}
    >
      <View style={tw`flex-1 flex-row items-center`}>
        {images[label] ? (
          <Image
            source={{ uri: images[label] }}
            style={tw`w-16 h-16 rounded-lg`}
            resizeMode="cover"
          />
        ) : (
          <View 
            style={tw`w-16 h-16 bg-gray-100 rounded-lg items-center justify-center`}
          >
            <Icon name={icon} size={32} color="#999" />
          </View>
        )}
        
        <View style={tw`ml-4 flex-1`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
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
            {images[label] ? 'อัปโหลดแล้ว' : 'แตะเพื่ออัปโหลด'}
          </Text>
        </View>
      </View>
      
      <View>
        {images[label] ? (
          <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
        ) : (
          <Icon name="upload" size={24} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="ขั้นตอนที่ 3"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView 
        contentContainerStyle={tw`p-6`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`mb-6`}>
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.XL,
            ...tw`text-gray-800 mb-2`,
          }}>
            อัปโหลดเอกสาร
          </Text>
          
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`flex-1 h-2 bg-gray-200 rounded-full overflow-hidden`}>
              <View 
                style={{
                  ...tw`h-full bg-[${COLORS.PRIMARY}] rounded-full`,
                  width: `${getUploadCompletionRate()}%`,
                }}
              />
            </View>
            
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              ...tw`text-gray-500 ml-2`,
            }}>
              {getUploadCompletionRate()}%
            </Text>
          </View>
        </View>
        
        {renderUploadButton('idPhoto', 'รูปถ่ายบัตรตรวจ', 'card-account-details-outline')}
        {renderUploadButton('vehiclePhoto', 'รูปถ่ายยานพาหนะ', 'car')}
        {renderUploadButton('vehicleDoc', 'รูปถ่ายเอกสารรถ (เล่มรถ)', 'file-document-outline')}
        {renderUploadButton('idCardPhoto', 'รูปถ่ายบัตรประชาชน', 'card-account-details')}
        {renderUploadButton('licensePhoto', 'รูปใบขับขี่', 'card-account-details')}
        {renderUploadButton('bankBookPhoto', 'รูปสมุดธนาคาร', 'bank')}
        
        <View style={tw`h-20`} />
      </ScrollView>
      
      <View style={tw`p-4 bg-white shadow-lg`}>
        <AuthButton
          title="ถัดไป"
          onPress={handleNext}
          isLoading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegisterUploadScreen;