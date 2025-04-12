import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobHeader = ({ distance, onBack }) => {
  return (
    <View style={[tw`flex-row items-center pt-12 pb-4 px-4 bg-white`, styles.headerContainer]}>
      <TouchableOpacity 
        onPress={onBack} 
        style={[
          tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3`,
          styles.backButton
        ]}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={22} color={COLORS.GRAY_700} />
      </TouchableOpacity>
      
      <View style={tw`flex-1`}>
        <Text 
          style={[
            tw`text-gray-500 text-sm`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ระยะทางโดยประมาณ
        </Text>
        <View style={tw`flex-row items-center`}>
          <Icon name="map-marker-distance" size={18} color={COLORS.PRIMARY} style={tw`mr-1`} />
          <Text 
            style={[
              tw`text-xl text-gray-800`, 
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
          >
            {distance}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  }
});

export default JobHeader;