import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

export default function FilterModal({ visible, setFilterDistance, filterDistance, onClose }) {
  // Available distance options
  const distanceOptions = [10, 20, 30, 50];

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-3/4 p-4 rounded-lg`}>
          <Text 
            style={[
              tw`text-lg text-center mb-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            เลือกระยะทาง
          </Text>
          
          {/* Distance options */}
          {distanceOptions.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                tw`p-2 rounded-lg mb-2`, 
                filterDistance === distance ? tw`bg-[${COLORS.PRIMARY}]` : tw`bg-gray-200`
              ]}
              onPress={() => {
                setFilterDistance(distance);
                onClose();
              }}
            >
              <Text 
                style={[
                  tw`text-center ${filterDistance === distance ? "text-white" : "text-black"}`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {distance} กิโลเมตร
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Close button */}
          <TouchableOpacity 
            style={tw`mt-4 bg-red-500 p-2 rounded-lg`} 
            onPress={onClose}
          >
            <Text 
              style={[
                tw`text-center text-white`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              ปิด
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}