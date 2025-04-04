import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import tw from "twrnc";
import { FONTS } from "../../constants";

export default function SortModal({ visible, setSortCriteria, sortCriteria, onClose }) {
  const sortOptions = [
    { label: "ล่าสุด-เก่า", value: "latest" },
    { label: "เก่า-ล่าสุด", value: "oldest" },
    { label: "ระยะรับรถใกล้กับจุดส่งที่สุด", value: "shortest" },
    { label: "ระยะส่งรถไกลกับจุดรับที่สุด", value: "longest" },
  ];

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
            เลือกการเรียงลำดับ
          </Text>
          
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                tw`p-2 rounded-lg mb-2`, 
                sortCriteria === option.value ? tw`bg-blue-500` : tw`bg-gray-200`
              ]}
              onPress={() => {
                setSortCriteria(option.value);
                onClose();
              }}
            >
              <Text 
                style={[
                  tw`text-center ${sortCriteria === option.value ? "text-white" : "text-black"}`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          
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