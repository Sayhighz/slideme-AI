// src/screens/job/CarUploadDropoffConfirmationScreen.js
import React from 'react';
import { API_ENDPOINTS } from '../../constants';

// Import shared component
import CarPhotoUploadScreen from '../../components/upload/CarPhotoUploadScreen';

const CarUploadDropoffConfirmationScreen = ({ route }) => {
  const { request_id, userData } = route.params || {};

  return (
    <CarPhotoUploadScreen
      title="ถ่ายรูปรถหลังให้บริการ"
      description="กรุณาถ่ายรูปรถทั้ง 4 ด้านหลังการให้บริการ เพื่อเป็นหลักฐานยืนยันสภาพรถเมื่อส่งมอบ"
      uploadType="การส่งรถ"
      request_id={request_id}
      userData={userData}
      uploadEndpoint={API_ENDPOINTS.UPLOAD.UPLOAD_AFTER}
      nextScreen="JobWorkingDropoff"
      extraNotes="หมายเหตุ: รูปถ่ายเหล่านี้จะถูกนำไปใช้เป็นหลักฐานในกรณีที่มีข้อพิพาทเกี่ยวกับสภาพรถหลังการส่งมอบ"
    />
  );
};

export default CarUploadDropoffConfirmationScreen;