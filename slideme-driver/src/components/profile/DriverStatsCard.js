import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';
import { formatCurrency } from '../../utils/formatters';

const DriverStatsCard = ({ driverId }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    completionRate: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverStats = async () => {
      if (!driverId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getRequest(`driver/getinfo?driver_id=${driverId}`);
        if (response && response.Status && response.Result.length > 0) {
          // In a real app, you might want to fetch more detailed stats
          // For now, we're using placeholder values or assuming the API returns these
          const driverInfo = response.Result[0];
          setStats({
            totalTrips: driverInfo.total_trips || 0,
            totalEarnings: driverInfo.total_earnings || 0,
            completionRate: driverInfo.completion_rate || 0,
            avgRating: driverInfo.avg_rating || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching driver stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverStats();
  }, [driverId]);

  if (loading) {
    return (
      <View style={tw`bg-white p-4 rounded-lg shadow-sm mb-4`}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={tw`bg-white p-4 rounded-lg shadow-sm mb-4`}>
      <Text style={[tw`text-lg mb-3`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
        สถิติการทำงาน
      </Text>
      
      <View style={tw`flex-row flex-wrap -mx-2`}>
        <View style={tw`w-1/2 p-2`}>
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              งานทั้งหมด
            </Text>
            <Text 
              style={[
                tw`text-xl mt-1 text-gray-800`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {stats.totalTrips} งาน
            </Text>
          </View>
        </View>
        
        <View style={tw`w-1/2 p-2`}>
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              รายได้รวม
            </Text>
            <Text 
              style={[
                tw`text-xl mt-1 text-[${COLORS.PRIMARY}]`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {formatCurrency(stats.totalEarnings)}
            </Text>
          </View>
        </View>
        
        <View style={tw`w-1/2 p-2`}>
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              อัตราการเสร็จสิ้น
            </Text>
            <Text 
              style={[
                tw`text-xl mt-1 text-blue-500`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {stats.completionRate}%
            </Text>
          </View>
        </View>
        
        <View style={tw`w-1/2 p-2`}>
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <Text style={[tw`text-gray-500`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              คะแนนเฉลี่ย
            </Text>
            <Text 
              style={[
                tw`text-xl mt-1 text-yellow-500`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {stats.avgRating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DriverStatsCard;