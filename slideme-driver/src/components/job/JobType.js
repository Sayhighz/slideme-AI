import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobType = ({ type }) => {
  // Vehicle type icons based on type name
  const getVehicleIcon = () => {
    if (type.includes("รถหรู") || type.includes("luxury")) {
      return "car-sports";
    } else if (type.includes("ฉุกเฉิน") || type.includes("emergency")) {
      return "ambulance";
    } else if (type.includes("ขนาดใหญ่") || type.includes("heavy")) {
      return "truck";
    } else {
      return "car-hatchback";
    }
  };

  return (
    <View style={[tw`mt-4 p-4 bg-white rounded-xl`, styles.container]}>
      <Text 
        style={[
          tw`text-gray-800 mb-3`, 
          { fontFamily: FONTS.FAMILY.MEDIUM, fontSize: FONTS.SIZE.M }
        ]}
      >
        ประเภทการขนส่ง
      </Text>
      
      <View style={[tw`flex-row items-center p-3 bg-blue-50 rounded-lg border border-blue-100`, styles.typeContainer]}>
        <View style={tw`w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3`}>
          <Icon name={getVehicleIcon()} size={20} color={COLORS.SECONDARY} />
        </View>
        <Text 
          style={[
            tw`text-gray-700 flex-1`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {type}
        </Text>
      </View>
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
  typeContainer: {
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

export default JobType;