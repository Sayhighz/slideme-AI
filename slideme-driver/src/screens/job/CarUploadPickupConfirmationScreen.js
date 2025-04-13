// src/screens/job/CarUploadPickupConfirmationScreen.js
import React from 'react';
import { API_ENDPOINTS } from '../../constants';

// Import shared component
import CarPhotoUploadScreen from '../../components/upload/CarPhotoUploadScreen';

const CarUploadPickupConfirmationScreen = ({ route }) => {
  const { request_id, userData } = route.params || {};

  return (
    <CarPhotoUploadScreen
      title="ถ่ายรูปรถก่อนให้บริการ"
      description="กรุณาถ่ายรูปรถทั้ง 4 ด้านก่อนการให้บริการ เพื่อเป็นหลักฐานในการตรวจสอบสภาพรถ"
      uploadType="การรับรถ"
      request_id={request_id}
      userData={userData}
      uploadEndpoint={API_ENDPOINTS.UPLOAD.UPLOAD_BEFORE}
      nextScreen="JobWorkingPickup"
      extraNotes="สำคัญ: รูปถ่ายจะถูกเก็บเป็นหลักฐานสำหรับการตรวจสอบสภาพรถ และไม่สามารถแก้ไขได้ภายหลัง"
    />
  );
};

export default CarUploadPickupConfirmationScreen;