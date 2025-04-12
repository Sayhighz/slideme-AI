import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS } from '../../constants';
import { formatCurrency } from '../../utils/formatters';

const AnimatedProgressBar = ({ value, color }) => {
  const [width] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(width, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value]);
  
  return (
    <View style={styles.progressContainer}>
      <Animated.View 
        style={[
          styles.progressFill, 
          { 
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: color
          }
        ]} 
      />
    </View>
  );
};

const StatCard = ({ icon, title, value, color, animatedValue = false, suffix = '' }) => {
  // รวม value และ suffix ทั้งหมดเข้าไปในส่วน Text component
  return (
    <View style={styles.statCardContainer}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>
          {value}{suffix}
        </Text>
        {animatedValue !== false && <AnimatedProgressBar value={animatedValue} color={color} />}
      </View>
    </View>
  );
};

const DriverStatsCard = ({ driverId }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    avgRating: 0,
    todayEarnings: 0,
    monthEarnings: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverStats = async () => {
      if (!driverId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getRequest(`${API_ENDPOINTS.DRIVER.PROFILE.GET_STATS}/${driverId}`);
        if (response.Status) {
          const driverInfo = response;
          
          // Calculate completion rate
          const completionRate = driverInfo.total_trips > 0 
            ? Math.round((driverInfo.completed_trips / driverInfo.total_trips) * 100) 
            : 0;
          
          setStats({
            totalTrips: driverInfo.total_trips || 0,
            completedTrips: driverInfo.completed_trips || 0,
            avgRating: driverInfo.average_rating || 0,
            todayEarnings: driverInfo.today_earnings || 0,
            monthEarnings: driverInfo.month_earnings || 0,
            completionRate,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>สถิติการทำงาน</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <StatCard 
            icon="car" 
            title="งานสำเร็จ" 
            value={stats.completedTrips}
            color={COLORS.SUCCESS} 
            suffix=" งาน"
          />
          
          <StatCard 
            icon="star" 
            title="คะแนนเฉลี่ย" 
            value={stats.avgRating}
            color="#FFC107" 
            suffix=""
          />
        </View>
        
        <View style={styles.statRow}>
          <StatCard 
            icon="check-circle" 
            title="อัตราความสำเร็จ" 
            value={`${stats.completionRate}%`}
            color={COLORS.INFO} 
            animatedValue={stats.completionRate}
            suffix=""
          />
          
          <StatCard 
            icon="wallet" 
            title="รายได้วันนี้" 
            value={formatCurrency(stats.todayEarnings).replace('฿', '')}
            color={COLORS.PRIMARY} 
            suffix=" บาท"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
    color: COLORS.TEXT_PRIMARY,
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default DriverStatsCard;