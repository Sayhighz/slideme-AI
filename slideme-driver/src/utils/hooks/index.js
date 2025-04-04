import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

// Hook สำหรับเรียกใช้งาน location
export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return { location, errorMsg };
};

// Hook สำหรับดึงข้อมูลรายได้วันนี้
export const useTodayProfit = (driverId) => {
  const [profitToday, setProfitToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchProfitToday = async () => {
        try {
          setLoading(true);
          const data = await getRequest(`${API_ENDPOINTS.DRIVER.EARNINGS.TODAY}?driver_id=${driverId}&period=day`);
          setProfitToday(data.Status && data.profit_today ? data.profit_today : 0);
          setError(null);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะดึงข้อมูลรายได้วันนี้:", error);
          setError("ไม่สามารถดึงข้อมูลรายได้วันนี้ได้");
          setProfitToday(0);
        } finally {
          setLoading(false);
        }
      };

      if (driverId) {
        fetchProfitToday();
      }
    }, [driverId])
  );

  return { profitToday, loading, error };
};

// Hook สำหรับดึงคะแนนของผู้ขับ
export const useDriverScore = (driverId) => {
  const [driverScore, setDriverScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchDriverScore = async () => {
        try {
          setLoading(true);
          const data = await getRequest(`${API_ENDPOINTS.DRIVER.PROFILE.GET_STATS}/${driverId}`);
          setDriverScore(data.Status && data.average_rating ? data.average_rating : 0);
          setError(null);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะดึงคะแนนของผู้ขับ:", error);
          setError("ไม่สามารถดึงคะแนนของผู้ขับได้");
          setDriverScore(0);
        } finally {
          setLoading(false);
        }
      };

      if (driverId) {
        fetchDriverScore();
      }
    }, [driverId])
  );

  return { driverScore, loading, error };
};