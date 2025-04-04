import React from 'react';
import { FlatList, Text, View, ActivityIndicator, RefreshControl } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';
import JobHistoryItem from './JobHistoryItem';

const JobHistoryList = ({ jobHistory, onSelectJob, loading, onRefresh, refreshing }) => {
  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={tw`flex-1 justify-center items-center py-8`}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }
    
    return (
      <View style={tw`flex-1 justify-center items-center mt-10`}>
        <Text 
          style={[
            tw`text-gray-500 text-lg`,
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ไม่มีประวัติการทำงาน
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={jobHistory}
      keyExtractor={(item, index) => (item.id || item.request_id || index).toString()}
      renderItem={({ item }) => (
        <JobHistoryItem job={item} onPress={() => onSelectJob(item)} />
      )}
      contentContainerStyle={jobHistory.length === 0 ? tw`flex-1` : tw`py-2`}
      ListEmptyComponent={renderEmptyList}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={[COLORS.PRIMARY]}
          tintColor={COLORS.PRIMARY}
        />
      }
    />
  );
};

export default JobHistoryList;