import React from "react";
import { View, Text, StyleSheet } from "react-native";
import tw from "twrnc";

const ProfitDisplay = ({ profitToday }) => {
  // ฟังก์ชันแปลงค่าเงินให้เป็นรูปแบบที่ต้องการ
  const formatCurrency = (number) => {
    if (number == null || isNaN(number)) return "฿0.00";
    return `฿${Number(number)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <View
      style={tw`flex-row justify-around w-19/20 mx-auto mt-4 p-4 bg-white shadow-md rounded-lg border border-gray-300`}
    >
      <View style={tw`items-center`}>
        <Text style={[styles.globalText, tw`text-2xl text-[#60B876]`]}>
          {formatCurrency(profitToday)}
        </Text>
        <Text style={[styles.globalText, tw`text-gray-600`]}>
          รายได้วันนี้
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default ProfitDisplay;
