import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getRequest, postRequest } from "../../services/api";
import { API_ENDPOINTS, MESSAGES } from "../../constants";

// Import Components
import ServiceScreenWrapper from "../../components/job/ServiceScreen/ServiceScreenWrapper";
import OfferNotificationService from '../../services/OfferNotificationService';

export default function JobWorkingDropoffScreen({ route }) {
  const navigation = useNavigation();
  const { request_id, workStatus } = route.params || {};
  const { userData = {} } = route.params || {};

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);

  // Update service status to "dropoff_in_progress" when entering this screen
  useEffect(() => {
    const updateServiceStatus = async () => {
      if (!request_id || !userData?.driver_id || statusUpdated) {
        return;
      }
      
      try {
        const response = await postRequest(API_ENDPOINTS.JOBS.UPDATE_STATUS, {
          request_id,
          driver_id: userData.driver_id,
          status: 'delivery_in_progress'
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
          if (response.Result && response.Result.length > 0) {
            setRequest(response.Result[0]);
          } else {
            const { Message, Status, ...requestData } = response;
            setRequest(requestData);
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
  }, [request_id]);

  // บันทึกและจัดการ active request ID
  useEffect(() => {
    // บันทึก request_id ที่กำลังทำงานอยู่
    if (request_id) {
      OfferNotificationService.setActiveRequestId(request_id);
    }
    
    // เมื่อออกจากหน้านี้
    return () => {
      // ตรวจสอบว่ากำลังไปหน้า CarUploadDropOffConfirmation หรือไม่
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // ถ้าไปหน้า CarUploadDropOffConfirmation ไม่ต้องล้าง active request id
        if (e.data.action.type === 'NAVIGATE' && 
            e.data.action.payload?.name === 'CarUploadDropOffConfirmation') {
          return;
        }
        
        // ถ้าไปหน้า HomeMain หลังจากจบงาน ก็ให้ล้าง active request id
        OfferNotificationService.setActiveRequestId(null);
      });
      
      return unsubscribe;
    };
  }, [request_id, navigation]);

  // Complete request and finish the job
  const completeRequest = async () => {
    try {
      // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
      if (!request_id || !userData?.driver_id) {
        console.error("Missing required data:", { request_id, driver_id: userData?.driver_id });
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลที่จำเป็นสำหรับการจบงาน");
        return;
      }
  
      // บันทึก log เพื่อตรวจสอบข้อมูลที่จะส่ง
      console.log("Completing request with data:", {
        request_id,
        driver_id: userData.driver_id
      });
  
      // First update status to 'completed'
      const updateResponse = await postRequest(API_ENDPOINTS.JOBS.UPDATE_STATUS, {
        request_id,
        driver_id: userData.driver_id,
        status: 'completed'
      });
  
      console.log("Update status response:", updateResponse);
      
      if (!updateResponse || !updateResponse.Status) {
        throw new Error(updateResponse?.Error || "ไม่สามารถอัปเดตสถานะได้");
      }
      
      // Then call the complete_request endpoint
      console.log(request)
      const response = await postRequest(
        API_ENDPOINTS.JOBS.COMPLETE_REQUEST,
        {
          request_id: request_id,
          driver_id: userData.driver_id
        }
      );
      
      console.log("Complete request response:", response);
  
      if (response && response.Status) {
        Alert.alert(
          "สำเร็จ", 
          MESSAGES.SUCCESS.COMPLETE, 
          [{ text: "ตกลง", onPress: () => navigation.navigate("HomeMain") }]
        );
        if (__DEV__) {
          const DevSettings = require('react-native').DevSettings;
          DevSettings.reload();
        }
      } else {
        // แสดงข้อความข้อผิดพลาดที่ได้รับจาก API หรือข้อความเริ่มต้น
        Alert.alert("ข้อผิดพลาด", response?.Error || "ไม่สามารถจบงานได้");
      }
    } catch (error) {
      console.error("Error completing request:", error);
      
      // แสดงข้อความข้อผิดพลาดที่เฉพาะเจาะจงจาก response หากมี
      const errorMessage = error.response?.data?.Error || 
                           error.message || 
                           MESSAGES.ERRORS.CONNECTION;
      
      Alert.alert("ข้อผิดพลาด", errorMessage);
    }
  };

  // Handle next step based on work status
  const checkWorkStatus = () => {
    if (workStatus) {
      // If workStatus is true, it means photos have been uploaded, complete job
      completeRequest();
    } else {
      // If workStatus is not defined or false, go to photo upload first
      navigation.navigate("CarUploadDropOffConfirmation", { 
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
      return 4; // At dropoff with photos taken
    }
    return 3; // Going to dropoff
  };

  // Get button title based on status
  const getButtonTitle = () => {
    return workStatus ? "ยืนยันการส่งรถและจบงาน" : "ยืนยันถึงจุดส่งรถ";
  };

  // Get confirmation dialog details
  const getConfirmationTitle = () => {
    return workStatus ? "ยืนยันการส่งรถและจบงาน" : "ยืนยันถึงจุดส่งรถ";
  };

  const getConfirmationMessage = () => {
    return workStatus 
      ? "คุณต้องการยืนยันการส่งรถและจบงานใช่หรือไม่?"
      : "คุณต้องการยืนยันถึงจุดส่งรถใช่หรือไม่?";
  };

  return (
    <ServiceScreenWrapper
      isLoading={loading}
      error={error}
      serviceData={request}
      userData={userData}
      isDropoff={true}
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