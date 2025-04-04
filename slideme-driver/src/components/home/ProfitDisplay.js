import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { formatCurrency } from '../../utils/formatters';
import { useTodayProfit } from '../../utils/hooks';

const ProfitDisplay = ({ driverId }) => {
  const { profitToday } = useTodayProfit(driverId);

  return (
    <View
      style={tw`flex-row justify-around w-19/20 mx-auto mt-4 p-4 bg-white shadow-md rounded-lg border border-gray-300`}
    >
      <View style={tw`items-center`}>
        <Text style={[tw`text-2xl text-[#60B876]`, { fontFamily: 'Mitr-Regular' }]}>
          {formatCurrency(profitToday)}
        </Text>
        <Text style={[tw`text-gray-600`, { fontFamily: 'Mitr-Regular' }]}>
          รายได้วันนี้
        </Text>
      </View>
    </View>
  );
};

export default ProfitDisplay;