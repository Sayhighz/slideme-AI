// src/screens/registration/DocumentScanScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import Toast from "react-native-toast-message";

// Import components
import AuthHeader from "../../components/auth/AuthHeader";
import AuthButton from "../../components/auth/AuthButton";
import RegistrationSteps from "../../components/auth/RegistrationSteps";
import AuthInput from "../../components/auth/AuthInput";
import DriverLicenseScanner from "../../components/auth/DriverLicenseScanner";
import LicensePlateScanner from "../../components/auth/LicensePlateScanner";
import DocumentUploader from "../../components/auth/DocumentUploader";

// Import services and constants
import { FONTS, COLORS, MESSAGES } from "../../constants";
import { uploadFile, postRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../constants";

const DocumentScanScreen = ({ navigation, route }) => {
  const { phoneNumber, selectedProvince, selectedVehicleType, password } =
    route.params || {};

  // ข้อมูลจากการสแกน
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idExpiryDate, setIdExpiryDate] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // รูปภาพเอกสาร
  const [documents, setDocuments] = useState({
    driverLicense: null, // รูปใบขับขี่
    vehicleWithPlate: null, // รูปรถพร้อมป้ายทะเบียน
    vehicleRegistration: null, // รูปเล่มทะเบียนรถ
  });

  // สถานะการโหลดและข้อผิดพลาด
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  // ตรวจสอบความครบถ้วนของฟอร์ม
  const validateForm = () => {
    const newErrors = {};

    // ตรวจสอบข้อมูลบุคคล
    if (!firstName) {
      newErrors.firstName = { message: "กรุณากรอกชื่อ" };
    }

    if (!lastName) {
      newErrors.lastName = { message: "กรุณากรอกนามสกุล" };
    }

    if (!idNumber) {
      newErrors.idNumber = { message: "กรุณากรอกเลขบัตรประชาชน" };
    } else if (!/^\d{13}$/.test(idNumber)) {
      newErrors.idNumber = {
        message: "เลขบัตรประชาชนไม่ถูกต้อง (ต้องมี 13 หลัก)",
      };
    }

    if (!birthDate) {
      newErrors.birthDate = { message: "กรุณากรอกวันเกิด" };
    }

    if (!idExpiryDate) {
      newErrors.idExpiryDate = { message: "กรุณากรอกวันหมดอายุใบขับขี่" };
    }

    if (!licenseNumber) {
      newErrors.licenseNumber = { message: "กรุณากรอกเลขที่ใบขับขี่" };
    }

    if (!licensePlate) {
      newErrors.licensePlate = { message: "กรุณากรอกป้ายทะเบียนรถ" };
    }

    // ตรวจสอบรูปภาพ
    if (!documents.driverLicense) {
      newErrors.driverLicense = { message: "กรุณาอัปโหลดรูปใบขับขี่" };
    }

    if (!documents.vehicleWithPlate) {
      newErrors.vehicleWithPlate = {
        message: "กรุณาอัปโหลดรูปรถพร้อมป้ายทะเบียน",
      };
    }

    if (!documents.vehicleRegistration) {
      newErrors.vehicleRegistration = {
        message: "กรุณาอัปโหลดรูปเล่มทะเบียนรถ",
      };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // คำนวณความคืบหน้าการอัปโหลด
  const calculateProgress = () => {
    let total = 0;
    let completed = 0;

    // ตรวจสอบข้อมูลบุคคล (7 ฟิลด์)
    if (firstName) completed++;
    if (lastName) completed++;
    if (idNumber) completed++;
    if (birthDate) completed++;
    if (idExpiryDate) completed++;
    if (licensePlate) completed++;
    if (licenseNumber) completed++;
    total += 7;

    // ตรวจสอบรูปภาพ (3 ไฟล์)
    if (documents.driverLicense) completed++;
    if (documents.vehicleWithPlate) completed++;
    if (documents.vehicleRegistration) completed++;
    total += 3;

    // คำนวณเปอร์เซ็นต์
    return Math.round((completed / total) * 100);
  };

  // จัดการข้อมูลจากการสแกนใบขับขี่
  const handleDriverLicenseScan = (data) => {
    console.log("Driver License Data:", data);

    if (data) {
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setIdNumber(data.idNumber || "");
      setBirthDate(data.birthDate || "");
      setIdExpiryDate(data.expireDate || "");
      setLicenseNumber(data.licenseNumber || "");

      Toast.show({
        type: "success",
        text1: "สแกนใบขับขี่สำเร็จ",
        text2: "ระบบได้กรอกข้อมูลให้อัตโนมัติแล้ว กรุณาตรวจสอบความถูกต้อง",
      });
    }
  };

  // จัดการข้อมูลจากการสแกนป้ายทะเบียน
  const handleLicensePlateScan = (data) => {
    console.log("License Plate Data:", data);

    if (data) {
      setLicensePlate(data.licensePlate || "");

      Toast.show({
        type: "success",
        text1: "สแกนป้ายทะเบียนสำเร็จ",
        text2: `ป้ายทะเบียน: ${data.licensePlate} ${
          data.province ? "จังหวัด" + data.province : ""
        }`,
      });
    }
  };

  // บันทึกรูปภาพใบขับขี่
  const handleDriverLicenseImage = (uri) => {
    setDocuments((prev) => ({
      ...prev,
      driverLicense: uri,
    }));
  };

  // บันทึกรูปภาพรถพร้อมป้ายทะเบียน
  const handleVehicleWithPlateImage = (uri) => {
    setDocuments((prev) => ({
      ...prev,
      vehicleWithPlate: uri,
    }));
  };

  // เลือกรูปภาพเล่มทะเบียนรถ
  const handleVehicleRegistrationImage = (uri) => {
    setDocuments((prev) => ({
      ...prev,
      vehicleRegistration: uri,
    }));
  };

  // ทำการอัปโหลดและลงทะเบียน
  // ทำการอัปโหลดและลงทะเบียน
const handleRegister = async () => {
  if (!validateForm()) {
    Toast.show({
      type: "error",
      text1: "ข้อมูลไม่ครบถ้วน",
      text2: "กรุณากรอกข้อมูลและอัปโหลดเอกสารให้ครบถ้วน",
    });
    return;
  }

  setIsLoading(true);
  setUploadProgress(10);

  try {
    // 1. สร้าง FormData สำหรับอัปโหลดไฟล์
    const formData = new FormData();

    // เพิ่มข้อมูลพื้นฐาน (ตามข้อกำหนด API)
    formData.append("phone_number", phoneNumber);
    formData.append("password", password);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("license_plate", licensePlate);
    formData.append("province", selectedProvince);
    
    // ข้อมูลเพิ่มเติมที่ไม่บังคับ
    if (birthDate) {
      formData.append("birth_date", birthDate);
    }
    
    // เพิ่ม vehicletype_id ที่ได้จากหน้าก่อนหน้า
    formData.append("vehicletype_id", selectedVehicleType);
    
    // ข้อมูลเพิ่มเติมสำหรับการตรวจสอบ (ไม่อยู่ในข้อกำหนด API แต่อาจจะใช้ในการประมวลผลเพิ่มเติม)
    if (idNumber) {
      formData.append("id_number", idNumber);
    }
    
    if (licenseNumber) {
      formData.append("license_number", licenseNumber);
    }
    
    if (idExpiryDate) {
      formData.append("id_expiry_date", idExpiryDate);
    }

    setUploadProgress(20);

    // เพิ่มรูปใบขับขี่ (ต้องการโดย API)
    if (documents.driverLicense) {
      const driverLicenseFile = {
        uri: documents.driverLicense,
        type: "image/jpeg",
        name: "thai_driver_license.jpg",
      };
      formData.append("thai_driver_license", driverLicenseFile);
    }

    setUploadProgress(40);

    // เพิ่มรูปรถพร้อมป้ายทะเบียน (ต้องการโดย API)
    if (documents.vehicleWithPlate) {
      const vehicleWithPlateFile = {
        uri: documents.vehicleWithPlate,
        type: "image/jpeg",
        name: "car_with_license_plate.jpg",
      };
      formData.append("car_with_license_plate", vehicleWithPlateFile);
    }

    setUploadProgress(60);

    // เพิ่มรูปเล่มทะเบียนรถ (ต้องการโดย API)
    if (documents.vehicleRegistration) {
      const vehicleRegistrationFile = {
        uri: documents.vehicleRegistration,
        type: "image/jpeg",
        name: "vehicle_registration.jpg",
      };
      formData.append("vehicle_registration", vehicleRegistrationFile);
    }

    setUploadProgress(80);

    // 2. ส่งข้อมูลไปยัง API เพื่อลงทะเบียน
    console.log("Sending registration data to API:", API_ENDPOINTS.AUTH.REGISTER);
    const response = await uploadFile(API_ENDPOINTS.AUTH.REGISTER, formData);

    setUploadProgress(100);

    console.log("Registration Response:", response);

    if (response.Status) {
      // ลงทะเบียนสำเร็จ - นำผู้ใช้ไปยังหน้าแสดงสถานะการตรวจสอบ
      Toast.show({
        type: "success",
        text1: "ส่งข้อมูลสำเร็จ",
        text2: "กรุณารอการตรวจสอบและอนุมัติจากทีมงาน",
      });
      
      navigation.navigate("VerificationStatus", {
        driverId: response.driver_id,
        phoneNumber: phoneNumber,
        name: `${firstName} ${lastName}`,
        password: password
      });
    } else {
      // ลงทะเบียนไม่สำเร็จ
      Alert.alert(
        "ลงทะเบียนไม่สำเร็จ",
        response.Error || "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองอีกครั้ง"
      );
    }
  } catch (error) {
    console.error("Registration Error:", error);
    Alert.alert(
      "เกิดข้อผิดพลาด",
      "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองอีกครั้ง"
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <AuthHeader title="อัปโหลดเอกสาร" onBack={() => navigation.goBack()} />

      <View style={tw`px-4 pt-4`}>
        <RegistrationSteps
          currentStep={2}
          totalSteps={3}
          stepTitles={["ข้อมูลเบื้องต้น", "อัปโหลดเอกสาร", "ตั้งรหัสผ่าน"]}
        />
      </View>

      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={tw`p-4 pb-16`}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress indicator */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.REGULAR,
                  ...tw`text-gray-700`,
                }}
              >
                ความคืบหน้า
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  ...tw`text-[${COLORS.PRIMARY}]`,
                }}
              >
                {calculateProgress()}%
              </Text>
            </View>

            <View
              style={tw`w-full h-2 rounded-full bg-gray-200 overflow-hidden`}
            >
              <View
                style={{
                  ...tw`h-full rounded-full bg-[${COLORS.PRIMARY}]`,
                  width: `${calculateProgress()}%`,
                }}
              />
            </View>
          </View>

          <Animatable.View animation="fadeIn" duration={600}>
            <Text
              style={{
                fontFamily: FONTS.FAMILY.MEDIUM,
                fontSize: FONTS.SIZE.L,
                ...tw`text-gray-800 mb-4 text-center`,
              }}
            >
              สแกนและอัปโหลดเอกสาร
            </Text>

            <Text
              style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.S,
                ...tw`text-gray-600 mb-6 text-center`,
              }}
            >
              ขั้นตอนนี้จะช่วยให้คุณสามารถสแกนเอกสารและกรอกข้อมูลได้อย่างรวดเร็ว
            </Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={600} delay={200}>
            {/* ส่วนสแกนใบขับขี่ */}
            <View style={tw`mb-6`}>
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  fontSize: FONTS.SIZE.M,
                  ...tw`text-gray-800 mb-4 border-l-4 border-[${COLORS.PRIMARY}] pl-2`,
                }}
              >
                1. สแกนใบขับขี่
              </Text>

              <DriverLicenseScanner
                onScanSuccess={handleDriverLicenseScan}
                onImageSelected={handleDriverLicenseImage}
                style={tw`mb-4`}
              />

              <View
                style={tw`bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4`}
              >
                <Text
                  style={{
                    fontFamily: FONTS.FAMILY.MEDIUM,
                    fontSize: FONTS.SIZE.S,
                    ...tw`text-gray-800 mb-2`,
                  }}
                >
                  ข้อมูลจากใบขับขี่
                </Text>

                <AuthInput
                  label="ชื่อ*"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="ชื่อ"
                  error={errors.firstName}
                  style="mb-2"
                />

                <AuthInput
                  label="นามสกุล*"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="นามสกุล"
                  error={errors.lastName}
                  style="mb-2"
                />

                <AuthInput
                  label="เลขบัตรประชาชน*"
                  value={idNumber}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setIdNumber(text);
                    }
                  }}
                  placeholder="เลขบัตรประชาชน 13 หลัก"
                  keyboardType="numeric"
                  maxLength={13}
                  error={errors.idNumber}
                  style="mb-2"
                />

                <AuthInput
                  label="เลขที่ใบขับขี่*"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholder="เลขที่ใบขับขี่"
                  error={errors.licenseNumber}
                  style="mb-2"
                />

                <AuthInput
                  label="วันเกิด (YYYY-MM-DD)*"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="วันเกิด เช่น 1990-01-01"
                  error={errors.birthDate}
                  style="mb-2"
                />

                <AuthInput
                  label="วันหมดอายุใบขับขี่ (YYYY-MM-DD)*"
                  value={idExpiryDate}
                  onChangeText={setIdExpiryDate}
                  placeholder="วันหมดอายุ เช่น 2025-01-01"
                  error={errors.idExpiryDate}
                />
              </View>
            </View>

            {/* ส่วนสแกนป้ายทะเบียน */}
            <View style={tw`mb-6`}>
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  fontSize: FONTS.SIZE.M,
                  ...tw`text-gray-800 mb-4 border-l-4 border-[${COLORS.PRIMARY}] pl-2`,
                }}
              >
                2. สแกนรถและป้ายทะเบียน
              </Text>

              <LicensePlateScanner
                onScanSuccess={handleLicensePlateScan}
                onImageSelected={handleVehicleWithPlateImage}
                style={tw`mb-4`}
              />

              <View
                style={tw`bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4`}
              >
                <Text
                  style={{
                    fontFamily: FONTS.FAMILY.MEDIUM,
                    fontSize: FONTS.SIZE.S,
                    ...tw`text-gray-800 mb-2`,
                  }}
                >
                  ข้อมูลทะเบียนรถ
                </Text>

                <AuthInput
                  label="ป้ายทะเบียนรถ*"
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="ป้ายทะเบียนรถ เช่น กข 1234"
                  error={errors.licensePlate}
                />
              </View>
            </View>

            {/* ส่วนอัปโหลดเล่มทะเบียนรถ */}
            <View style={tw`mb-8`}>
              <Text
                style={{
                  fontFamily: FONTS.FAMILY.MEDIUM,
                  fontSize: FONTS.SIZE.M,
                  ...tw`text-gray-800 mb-4 border-l-4 border-[${COLORS.PRIMARY}] pl-2`,
                }}
              >
                3. อัปโหลดเล่มทะเบียนรถ
              </Text>

              <DocumentUploader
                label="vehicleRegistration"
                displayName="เล่มทะเบียนรถ*"
                icon="file-document-outline"
                imageUri={documents.vehicleRegistration}
                onImageSelected={handleVehicleRegistrationImage}
                isProcessing={false}
                description="อัปโหลดรูปถ่ายเล่มทะเบียนรถให้เห็นข้อมูลชัดเจน"
              />
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ส่วนล่าง */}
      <View style={tw`px-4 py-4 bg-white border-t border-gray-200`}>
        {isLoading ? (
          <View style={tw`items-center`}>
            <Text
              style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.S,
                ...tw`text-gray-700 mb-2`,
              }}
            >
              กำลังอัปโหลดและลงทะเบียน... {uploadProgress}%
            </Text>
            <View style={tw`w-full h-2 bg-gray-200 rounded-full mb-4`}>
              <View
                style={{
                  ...tw`h-full rounded-full bg-[${COLORS.PRIMARY}]`,
                  width: `${uploadProgress}%`,
                }}
              />
            </View>
          </View>
        ) : (
          <AuthButton
            title="ลงทะเบียน"
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={calculateProgress() < 70}
          />
        )}
      </View>

      <Toast />
    </SafeAreaView>
  );
};

export default DocumentScanScreen;
