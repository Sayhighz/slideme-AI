// src/screens/auth/RegisterUploadScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native';
import tw from 'twrnc';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

// Import components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';
import DocumentUploader from '../../components/auth/DocumentUploader';
import RegistrationSteps from '../../components/auth/RegistrationSteps';

// Import services and constants
import { FONTS, COLORS, MESSAGES } from '../../constants';
import { uploadFile } from '../../services/api';
import OCRService from '../../services/OCRService';

const RegisterUploadScreen = ({ navigation, route }) => {
  const routeParams = route.params || {};
  
  const [documents, setDocuments] = useState({
    profilePhoto: null,
    driverLicense: routeParams.documents?.driverLicense || null,
    vehicleWithPlate: routeParams.documents?.vehicleWithPlate || null,
    vehicleRegistration: null,
    idCard: null,
    bankBook: null,
  });

  const [processingOCR, setProcessingOCR] = useState({
    driverLicense: false,
    vehicleWithPlate: false,
  });
  
  const [ocrData, setOcrData] = useState({
    driverLicense: null,
    vehicleWithPlate: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // ขออนุญาตเข้าถึงคลังรูปภาพเมื่อเปิดหน้าจอ
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "ต้องการสิทธิ์การเข้าถึง",
          "แอปจำเป็นต้องเข้าถึงคลังรูปภาพเพื่ออัปโหลดเอกสาร",
          [{ text: "ตกลง" }]
        );
      }
    };
    
    requestPermission();
  }, []);

  // แสดงข้อความเมื่อมีรูปถ่ายที่สแกนมาแล้ว
  useEffect(() => {
    if (routeParams.documents?.driverLicense || routeParams.documents?.vehicleWithPlate) {
      Toast.show({
        type: 'success',
        text1: 'นำเข้ารูปภาพสำเร็จ',
        text2: 'รูปภาพที่สแกนได้ถูกนำเข้าระบบแล้ว',
      });
    }
  }, [routeParams.documents]);

  // ฟังก์ชันคำนวณความคืบหน้าของการอัปโหลด
  const calculateUploadProgress = () => {
    const requiredDocs = ['driverLicense', 'vehicleWithPlate', 'vehicleRegistration', 'idCard'];
    const uploadedCount = requiredDocs.filter(doc => documents[doc]).length;
    return Math.round((uploadedCount / requiredDocs.length) * 100);
  };

  // ฟังก์ชันเลือกรูปภาพจากคลังรูปภาพ
  const handleSelectImage = async (docType) => {
    // ถ้าเป็นเอกสารที่มีรูปอยู่แล้วจากการสแกน ให้แสดงแจ้งเตือนก่อน
    if ((docType === 'driverLicense' || docType === 'vehicleWithPlate') && documents[docType]) {
      Alert.alert(
        "คุณต้องการเปลี่ยนรูปภาพหรือไม่?",
        "คุณมีรูปภาพที่สแกนไว้แล้ว ต้องการเปลี่ยนเป็นรูปใหม่หรือไม่?",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "เปลี่ยน", onPress: () => selectImageFromGallery(docType) }
        ]
      );
      return;
    }
    
    // เลือกรูปภาพตามปกติ
    selectImageFromGallery(docType);
  };

  const selectImageFromGallery = async (docType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: docType === 'profilePhoto' ? [1, 1] : [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // อัปเดตเอกสาร
        setDocuments(prev => ({
          ...prev,
          [docType]: selectedImage.uri
        }));
        
        // เริ่มการประมวลผล OCR ถ้าเป็นเอกสารที่รองรับ
        if (docType === 'driverLicense') {
          processDriverLicenseOCR(selectedImage.uri);
        } else if (docType === 'vehicleWithPlate') {
          processLicensePlateOCR(selectedImage.uri);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'ไม่สามารถเลือกรูปภาพได้ โปรดลองอีกครั้ง',
      });
    }
  };

  // ประมวลผล OCR สำหรับใบขับขี่
  const processDriverLicenseOCR = async (imageUri) => {
    setProcessingOCR(prev => ({ ...prev, driverLicense: true }));
    
    try {
      const result = await OCRService.readThaiDriverLicense(imageUri);
      
      if (result.success) {
        setOcrData(prev => ({ ...prev, driverLicense: result.data }));
        
        // แสดงข้อความสำเร็จ
        Toast.show({
          type: 'success',
          text1: 'อ่านข้อมูลสำเร็จ',
          text2: 'ระบบได้ดึงข้อมูลจากใบขับขี่เรียบร้อยแล้ว',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'ไม่สามารถอ่านข้อมูลได้',
          text2: 'โปรดตรวจสอบว่าภาพชัดเจนและเป็นใบขับขี่ที่ถูกต้อง',
        });
      }
    } catch (error) {
      console.error('Error processing driver license OCR:', error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล',
      });
    } finally {
      setProcessingOCR(prev => ({ ...prev, driverLicense: false }));
    }
  };

  // ประมวลผล OCR สำหรับป้ายทะเบียนรถ
  const processLicensePlateOCR = async (imageUri) => {
    setProcessingOCR(prev => ({ ...prev, vehicleWithPlate: true }));
    
    try {
      const result = await OCRService.readLicensePlate(imageUri);
      
      if (result.success) {
        setOcrData(prev => ({ ...prev, vehicleWithPlate: result.data }));
        
        // แสดงข้อความสำเร็จ
        Toast.show({
          type: 'success',
          text1: 'อ่านข้อมูลสำเร็จ',
          text2: `ทะเบียน: ${result.data.licensePlate} ${result.data.province}`,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'ไม่สามารถอ่านป้ายทะเบียนได้',
          text2: 'โปรดตรวจสอบว่าภาพชัดเจนและป้ายทะเบียนอยู่ในภาพ',
        });
      }
    } catch (error) {
      console.error('Error processing license plate OCR:', error);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล',
      });
    } finally {
      setProcessingOCR(prev => ({ ...prev, vehicleWithPlate: false }));
    }
  };

  // ฟังก์ชันไปยังขั้นตอนถัดไป
  const handleNext = () => {
    // ตรวจสอบว่ามีเอกสารที่จำเป็นครบหรือไม่
    const requiredDocuments = ['driverLicense', 'vehicleWithPlate', 'vehicleRegistration', 'idCard'];
    const missingDocuments = requiredDocuments.filter(doc => !documents[doc]);
    
    if (missingDocuments.length > 0) {
      Alert.alert(
        'เอกสารไม่ครบถ้วน',
        'กรุณาอัปโหลดเอกสารที่จำเป็นทั้งหมด',
        [{ text: 'ตกลง' }]
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // เตรียมข้อมูลสำหรับส่งไปยังขั้นตอนถัดไป
      const combinedData = {
        ...routeParams,
        documents: {
          profilePhoto: documents.profilePhoto,
          driverLicense: documents.driverLicense,
          vehicleWithPlate: documents.vehicleWithPlate,
          vehicleRegistration: documents.vehicleRegistration,
          idCard: documents.idCard,
          bankBook: documents.bankBook,
        }
      };
      
      // ถ้ามีการอ่านข้อมูลจาก OCR สำเร็จ ให้เพิ่มข้อมูลเหล่านั้นด้วย
      if (ocrData.driverLicense) {
        combinedData.licenseNumber = combinedData.licenseNumber || ocrData.driverLicense.licenseNumber;
      }
      
      if (ocrData.vehicleWithPlate) {
        combinedData.licensePlate = combinedData.licensePlate || ocrData.vehicleWithPlate.licensePlate;
        combinedData.vehicleProvince = combinedData.vehicleProvince || ocrData.vehicleWithPlate.province;
      }
      
      // นำทางไปยังหน้าถัดไป
      navigation.navigate('RegisterVerification', combinedData);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  };

  // สร้างคำอธิบายสำหรับเอกสารที่มีการสแกนมาแล้ว
  const getDocumentDescription = (docType) => {
    if (docType === 'driverLicense' && routeParams.documents?.driverLicense) {
      return "อัปโหลดจากการสแกนใบขับขี่แล้ว";
    } else if (docType === 'vehicleWithPlate' && routeParams.documents?.vehicleWithPlate) {
      return "อัปโหลดจากการสแกนป้ายทะเบียนแล้ว";
    }
    
    return undefined;  // ใช้ค่า default
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader
        title="อัปโหลดเอกสาร"
        onBack={() => navigation.goBack()}
      />
      
      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps 
          currentStep={3} 
          totalSteps={4}
          stepTitles={['ข้อมูลเบื้องต้น', 'ข้อมูลส่วนตัว', 'อัปโหลดเอกสาร', 'ตั้งรหัสผ่าน']}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={tw`px-4 pb-20`}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              ...tw`text-gray-700`,
            }}>
              ความคืบหน้า
            </Text>
            <Text style={{
              fontFamily: FONTS.FAMILY.MEDIUM,
              ...tw`text-[${COLORS.PRIMARY}]`,
            }}>
              {calculateUploadProgress()}%
            </Text>
          </View>
          
          <View style={tw`w-full h-2 rounded-full bg-gray-200 overflow-hidden`}>
            <View 
              style={{
                ...tw`h-full rounded-full bg-[${COLORS.PRIMARY}]`,
                width: `${calculateUploadProgress()}%`,
              }}
            />
          </View>
          
          <Text style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.XS,
            ...tw`text-gray-500 mt-2`,
          }}>
            กรุณาอัปโหลดเอกสารที่มีเครื่องหมาย (*) ให้ครบ
          </Text>
        </View>
        
        <Text style={{
          fontFamily: FONTS.FAMILY.MEDIUM,
          fontSize: FONTS.SIZE.M,
          ...tw`text-gray-800 mb-4`,
        }}>
          เอกสารส่วนตัว
        </Text>
        
        {/* Profile photo */}
        <DocumentUploader
          label="profilePhoto"
          displayName="รูปโปรไฟล์"
          icon="account"
          imageUri={documents.profilePhoto}
          onPress={() => handleSelectImage('profilePhoto')}
          description="รูปสำหรับแสดงในโปรไฟล์ของคุณ (ไม่บังคับ)"
        />
        
        {/* ID Card */}
        <DocumentUploader
          label="idCard"
          displayName="บัตรประจำตัวประชาชน *"
          icon="card-account-details"
          imageUri={documents.idCard}
          onPress={() => handleSelectImage('idCard')}
        />
        
        {/* Driver License */}
        <DocumentUploader
          label="driverLicense"
          displayName="ใบขับขี่ *"
          icon="card-account-details-outline"
          imageUri={documents.driverLicense}
          onPress={() => handleSelectImage('driverLicense')}
          isProcessing={processingOCR.driverLicense}
          description={getDocumentDescription('driverLicense') || (ocrData.driverLicense ? "ระบบได้อ่านข้อมูลจากใบขับขี่เรียบร้อยแล้ว" : "ระบบจะอ่านข้อมูลจากใบขับขี่อัตโนมัติ")}
        />
        
        <Text style={{
          fontFamily: FONTS.FAMILY.MEDIUM,
          fontSize: FONTS.SIZE.M,
          ...tw`text-gray-800 mt-6 mb-4`,
        }}>
          เอกสารยานพาหนะ
        </Text>
        
        {/* Vehicle with license plate */}
        <DocumentUploader
          label="vehicleWithPlate"
          displayName="รูปรถพร้อมป้ายทะเบียน *"
          icon="car"
          imageUri={documents.vehicleWithPlate}
          onPress={() => handleSelectImage('vehicleWithPlate')}
          isProcessing={processingOCR.vehicleWithPlate}
          description={getDocumentDescription('vehicleWithPlate') || (ocrData.vehicleWithPlate ? `ทะเบียน: ${ocrData.vehicleWithPlate.licensePlate}` : "ระบบจะอ่านป้ายทะเบียนอัตโนมัติ")}
        />
        
        {/* Vehicle Registration */}
        <DocumentUploader
          label="vehicleRegistration"
          displayName="เล่มทะเบียนรถ *"
          icon="file-document-outline"
          imageUri={documents.vehicleRegistration}
          onPress={() => handleSelectImage('vehicleRegistration')}
        />
        
        <Text style={{
          fontFamily: FONTS.FAMILY.MEDIUM,
          fontSize: FONTS.SIZE.M,
          ...tw`text-gray-800 mt-6 mb-4`,
        }}>
          เอกสารทางการเงิน
        </Text>
        
        {/* Bank Book */}
        <DocumentUploader
          label="bankBook"
          displayName="สมุดบัญชีธนาคาร"
          icon="bank"
          imageUri={documents.bankBook}
          onPress={() => handleSelectImage('bankBook')}
          description="สำหรับการรับเงินจากลูกค้า (ไม่บังคับ)"
        />
      </ScrollView>
      
      <View style={tw`px-4 py-4 bg-white border-t border-gray-200`}>
        <AuthButton
          title="ถัดไป"
          onPress={handleNext}
          isLoading={isLoading}
          disabled={calculateUploadProgress() < 100}
        />
      </View>
      
      <Toast />
    </SafeAreaView>
  );
};

export default RegisterUploadScreen;