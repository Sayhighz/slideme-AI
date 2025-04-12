import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobInfo = ({ origin, destination, message }) => {
  return (
    <View style={[tw`p-4 bg-white mt-4 rounded-xl`, styles.container]}>
      {/* Path visualization */}
      <View style={[tw`absolute left-6 top-12 bottom-8`, styles.pathLine]} />
      
      {/* Origin */}
      <View style={tw`flex-row mb-6`}>
        <View style={[tw`items-center mr-3`]}>
          <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center`}>
            <Icon name="map-marker" size={20} color="green" />
          </View>
        </View>
        <View style={tw`flex-1`}>
          <Text 
            style={[
              tw`text-gray-500 text-xs mb-1`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ต้นทาง
          </Text>
          <Text 
            style={[
              tw`text-gray-800`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {origin}
          </Text>
        </View>
      </View>
      
      {/* Destination */}
      <View style={tw`flex-row mb-4`}>
        <View style={[tw`items-center mr-3`]}>
          <View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center`}>
            <Icon name="map-marker" size={20} color="red" />
          </View>
        </View>
        <View style={tw`flex-1`}>
          <Text 
            style={[
              tw`text-gray-500 text-xs mb-1`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ปลายทาง
          </Text>
          <Text 
            style={[
              tw`text-gray-800`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {destination}
          </Text>
        </View>
      </View>
      
      {/* Customer message */}
      {message && (
        <View style={[tw`mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200`, styles.messageContainer]}>
          <View style={tw`flex-row items-start`}>
            <Icon name="message-text-outline" size={20} color={COLORS.SECONDARY} style={tw`mt-1 mr-2`} />
            <View style={tw`flex-1`}>
              <Text 
                style={[
                  tw`text-gray-500 text-xs mb-1`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ข้อความจากลูกค้า
              </Text>
              <Text 
                style={[
                  tw`text-gray-700`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {message || "ไม่มีข้อความ"}
              </Text>
            </View>
          </View>
        </View>
      )}
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
  pathLine: {
    width: 2,
    backgroundColor: COLORS.GRAY_300,
    zIndex: -1,
  },
  messageContainer: {
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

export default JobInfo;