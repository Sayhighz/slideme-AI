import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getRequest, postRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../constants";

// Import Components
import ServiceScreenWrapper from "../../components/job/ServiceScreen/ServiceScreenWrapper";
import OfferNotificationService from '../../services/OfferNotificationService';

export default function JobWorkingPickupScreen({ route }) {
  const navigation = useNavigation();
  const { request_id, workStatus } = route.params || {};
  const { userData = {} } = route.params || {};

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);

  // Update service status to "pickup_in_progress" when entering this screen
  useEffect(() => {
    const updateServiceStatus = async () => {
      if (!request_id || !userData?.driver_id || statusUpdated) {
        return;
      }
      
      try {
        const response = await postRequest(API_ENDPOINTS.JOBS.UPDATE_STATUS, {
          request_id,
          driver_id: userData.driver_id,
          status: 'pickup_in_progress'
        });
        
        if (response && response.Status) {
          console.log('Service status updated successfully:', response);
          setStatusUpdated(true);
        } else {
          console.warn('Failed to update service status:', response);
        }
      } catch (error) {
        console.error('Error updating service status:', error);
      }
    };

    updateServiceStatus();
  }, [request_id, userData?.driver_id, statusUpdated]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await getRequest(
          `${API_ENDPOINTS.JOBS.GET_DETAIL}?request_id=${request_id}`
        );
        
        if (response && response.Status) {
          let requestData;
          
          if (response.Result && response.Result.length > 0) {
            requestData = response.Result[0];
          } else {
            const { Message, Status, ...restData } = response;
            requestData = restData;
          }
          
          setRequest(requestData);
          
          // Check if status is already pickup_in_progress and navigate to dropoff
          if (requestData.status === 'delivery_in_progress') {
            // If already in delivery stage, navigate to dropoff
            navigation.navigate("JobWorkingDropoff", { 
              request_id,
              userData 
            });
          }
        } else {
          setRequest(null);
        }
        setError(null);
      } catch (err) {
        setError("ไม่สามารถดึงข้อมูลได้");
        console.error("Error fetching request details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (request_id) {
      fetchRequestDetails();
    }
  }, [request_id, navigation, userData]);

  // บันทึกและจัดการ active request ID
  useEffect(() => {
    // บันทึก request_id ที่กำลังทำงานอยู่
    if (request_id) {
      OfferNotificationService.setActiveRequestId(request_id);
    }
    
    // เมื่อออกจากหน้านี้
    return () => {
      // ตรวจสอบว่ากำลังไปหน้า JobWorkingDropoff หรือ CarUploadPickUpConfirmation หรือไม่
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // ถ้าไปหน้า JobWorkingDropoff หรือ CarUploadPickUpConfirmation ไม่ต้องล้าง active request id
        if (e.data.action.type === 'NAVIGATE' && 
            (e.data.action.payload?.name === 'JobWorkingDropoff' || 
             e.data.action.payload?.name === 'CarUploadPickUpConfirmation')) {
          return;
        }
        
        // ถ้าไปหน้าอื่น ให้ล้าง active request id
        OfferNotificationService.setActiveRequestId(null);
      });
      
      return unsubscribe;
    };
  }, [request_id, navigation]);

  // Handle next step based on work status
  const checkWorkStatus = async () => {
    if (workStatus) {
      try {
        // Update status to delivery_in_progress when moving from pickup to dropoff
        await postRequest(API_ENDPOINTS.JOBS.UPDATE_STATUS, {
          request_id,
          driver_id: userData.driver_id,
          status: 'delivery_in_progress'
        });
        
        // Navigate to dropoff screen
        navigation.navigate("JobWorkingDropoff", { 
          request_id,
          userData 
        });
      } catch (error) {
        console.error('Error updating service status to delivery_in_progress:', error);
        Alert.alert(
          "ข้อผิดพลาด",
          "เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง",
          [{ text: "ตกลง" }]
        );
      }
    } else {
      // If workStatus is not defined or false, go to photo upload first
      navigation.navigate("CarUploadPickUpConfirmation", { 
        request_id,
        userData
      });
    }
  };

  // Show confirmation dialog
  const confirmAction = () => {
    setIsModalVisible(true);
  };

  // Get current step based on workflow
  const getCurrentStep = () => {
    if (workStatus) {
      return 2; // At pickup with photos taken
    }
    return 1; // Going to pickup
  };

  // Get button title based on status
  const getButtonTitle = () => {
    return workStatus ? "ยืนยันการรับรถ" : "ยืนยันถึงจุดรับรถ";
  };

  // Get confirmation dialog details
  const getConfirmationTitle = () => {
    return workStatus ? "ยืนยันการรับรถ" : "ยืนยันถึงจุดรับรถ";
  };

  const getConfirmationMessage = () => {
    return workStatus 
      ? "คุณต้องการยืนยันการรับรถใช่หรือไม่?"
      : "คุณต้องการยืนยันถึงจุดรับรถใช่หรือไม่?";
  };

  return (
    <ServiceScreenWrapper
      isLoading={loading}
      error={error}
      serviceData={request}
      userData={userData}
      isDropoff={false}
      currentStep={getCurrentStep()}
      photosUploaded={workStatus}
      buttonTitle={getButtonTitle()}
      onConfirmAction={confirmAction}
      navigation={navigation}
      confirmationTitle={getConfirmationTitle()}
      confirmationMessage={getConfirmationMessage()}
      handleConfirm={checkWorkStatus}
      showConfirmDialog={isModalVisible}
      setShowConfirmDialog={setIsModalVisible}
    />
  );
}