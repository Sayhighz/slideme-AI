import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobPriceInput = ({ offeredPrice, onPriceChange, onConfirm, disabled = false }) => {
  const formatPrice = (text) => {
    // Remove any non-digit characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    
    // Add commas for thousands
    if (cleanedText) {
      const number = parseInt(cleanedText, 10);
      return number.toLocaleString();
    }
    return cleanedText;
  };

  const handleChangeText = (text) => {
    const formattedPrice = formatPrice(text);
    onPriceChange(formattedPrice);
  };

  return (
    <View style={[tw`mt-4 p-4 bg-white rounded-xl`, styles.container]}>
      <Text 
        style={[
          tw`text-gray-800 mb-3`, 
          { fontFamily: FONTS.FAMILY.MEDIUM, fontSize: FONTS.SIZE.M }
        ]}
      >
        กำหนดราคา
      </Text>
      
      <View style={[tw`bg-gray-50 rounded-xl p-4 mb-6`, styles.priceContainer]}>
        <Text 
          style={[
            tw`text-gray-500 mb-2`, 
            { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }
          ]}
        >
          ราคาที่คุณต้องการเสนอ (บาท)
        </Text>
        
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3`}>
            <Icon name="cash" size={20} color={COLORS.PRIMARY} />
          </View>
          
          <TextInput
            style={[
              tw`flex-1 border-b-2 border-gray-300 py-2 text-lg ${disabled ? "bg-gray-100 text-gray-500" : "bg-transparent text-gray-800"}`, 
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
            placeholder="0"
            placeholderTextColor={COLORS.GRAY_400}
            keyboardType="numeric"
            value={offeredPrice}
            onChangeText={handleChangeText}
            editable={!disabled}
          />
          
          <Text 
            style={[
              tw`text-lg ml-2 text-gray-700`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ฿
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          tw`bg-[${COLORS.PRIMARY}] rounded-xl p-4 items-center ${disabled ? "opacity-50" : ""}`,
          styles.submitButton
        ]}
        onPress={onConfirm}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center`}>
          <Icon name="cash-check" size={20} color="white" style={tw`mr-2`} />
          <Text 
            style={[
              tw`text-white text-lg`, 
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
          >
            ยื่นข้อเสนอ
          </Text>
        </View>
      </TouchableOpacity>
      
      <Text 
        style={[
          tw`text-gray-500 text-center mt-3 text-xs`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        หมายเหตุ: ราคาที่เสนอควรคำนึงถึงระยะทางและประเภทของรถ
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  priceContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  submitButton: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 6,
  }
});

export default JobPriceInput;