import React from 'react';
import { 
  FlatList, 
  Text, 
  View, 
  ActivityIndicator, 
  RefreshControl,
  Image
} from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';
import JobHistoryItem from './JobHistoryItem';

const JobHistoryList = ({ 
  jobHistory, 
  onSelectJob, 
  loading, 
  onRefresh, 
  refreshing,
  onLoadMore,
  hasMoreData,
  selectedStatus
}) => {
  // Footer component for pagination loader
  const renderFooter = () => {
    if (!hasMoreData) return null;
    
    return (
      <View style={tw`py-4 flex items-center justify-center`}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={[tw`text-gray-500 mt-2`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
          กำลังโหลดข้อมูลเพิ่มเติม...
        </Text>
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading && jobHistory.length === 0) {
      return (
        <View style={tw`flex-1 justify-center items-center py-12`}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={[tw`text-gray-500 mt-4`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
            กำลังโหลดข้อมูล...
          </Text>
        </View>
      );
    }
    
    const emptyMessage = selectedStatus === 'all' 
      ? 'ไม่มีประวัติการทำงาน' 
      : selectedStatus === 'completed' 
        ? 'ไม่มีประวัติงานที่เสร็จสมบูรณ์' 
        : 'ไม่มีประวัติงานที่ถูกยกเลิก';
    
    return (
      <View style={tw`flex-1 justify-center items-center py-16`}>
        {/* <Image 
          source={require('../../assets/images/empty-history.png')} 
          style={tw`w-32 h-32 opacity-60`}
          resizeMode="contain"
        /> */}
        <Text 
          style={[
            tw`text-gray-500 text-lg mt-4`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {emptyMessage}
        </Text>
        <Text 
          style={[
            tw`text-gray-400 text-center px-12 mt-2`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ดึงข้อมูลลงเพื่อรีเฟรช
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={jobHistory}
      keyExtractor={(item) => (item.request_id || item.id || `${item.request_date}-${item.request_time}`).toString()}
      renderItem={({ item }) => (
        <JobHistoryItem job={item} onPress={() => onSelectJob(item)} />
      )}
      contentContainerStyle={jobHistory.length === 0 ? tw`flex-1` : tw`py-2`}
      ListEmptyComponent={renderEmptyList}
      ListFooterComponent={renderFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={[COLORS.PRIMARY]}
          tintColor={COLORS.PRIMARY}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

export default JobHistoryList;