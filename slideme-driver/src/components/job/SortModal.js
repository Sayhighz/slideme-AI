import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, BackHandler } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

export default function SortModal({ visible, setSortCriteria, sortCriteria, onClose }) {
  const sortOptions = [
    { 
      label: "ล่าสุด-เก่า", 
      value: "latest",
      icon: "clock-time-four-outline"
    },
    { 
      label: "เก่า-ล่าสุด", 
      value: "oldest",
      icon: "clock-time-four"
    },
    { 
      label: "ระยะรับรถใกล้กับจุดส่งที่สุด", 
      value: "shortest",
      icon: "map-marker-distance"
    },
    { 
      label: "ระยะส่งรถไกลกับจุดรับที่สุด", 
      value: "longest",
      icon: "map-marker-path"
    },
  ];
  
  // Animation values
  const [slideAnim] = useState(new Animated.Value(400));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Track selected value
  const [selectedValue, setSelectedValue] = useState(sortCriteria);

  useEffect(() => {
    if (visible) {
      setSelectedValue(sortCriteria);
      
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Handle back button
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (visible) {
            handleClose();
            return true;
          }
          return false;
        }
      );
      
      return () => backHandler.remove();
    } else {
      // Reset animations when modal is hidden
      slideAnim.setValue(400);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Handle close with animation
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Apply sort and close
  const applySort = () => {
    setSortCriteria(selectedValue);
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose} animationType="none">
      <Animated.View 
        style={[
          tw`flex-1 justify-end bg-black bg-opacity-50`,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={tw`flex-1`}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            tw`bg-white rounded-t-3xl p-6`,
            { transform: [{ translateY: slideAnim }] },
            styles.bottomSheet
          ]}
        >
          {/* Header */}
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text 
              style={[
                tw`text-gray-800 text-xl`, 
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}
            >
              เลือกการเรียงลำดับ
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color={COLORS.GRAY_600} />
            </TouchableOpacity>
          </View>
          
          {/* Description */}
          <Text 
            style={[
              tw`text-gray-500 mb-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            เลือกรูปแบบการเรียงลำดับงานที่แสดง
          </Text>
          
          {/* Sort options */}
          <View style={tw`mb-6`}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  tw`p-4 rounded-xl mb-2 flex-row justify-between items-center`, 
                  selectedValue === option.value 
                    ? tw`bg-blue-50 border border-blue-400` 
                    : tw`bg-gray-100 border border-gray-100`
                ]}
                onPress={() => setSelectedValue(option.value)}
                activeOpacity={0.7}
              >
                <View style={tw`flex-row items-center flex-1`}>
                  <Icon 
                    name={option.icon} 
                    size={24} 
                    color={selectedValue === option.value ? COLORS.SECONDARY : COLORS.GRAY_600} 
                  />
                  <Text 
                    style={[
                      tw`ml-2 text-base ${selectedValue === option.value ? "text-blue-600" : "text-gray-700"} flex-shrink`,
                      { 
                        fontFamily: selectedValue === option.value ? FONTS.FAMILY.MEDIUM : FONTS.FAMILY.REGULAR 
                      }
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                
                {selectedValue === option.value && (
                  <Icon name="check-circle" size={24} color={COLORS.SECONDARY} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Bottom buttons */}
          <View style={tw`flex-row`}>
            <TouchableOpacity 
              style={tw`flex-1 border border-gray-300 p-3 rounded-xl mr-2`} 
              onPress={handleClose}
            >
              <Text 
                style={[
                  tw`text-center text-gray-700`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ยกเลิก
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                tw`flex-1 bg-blue-500 p-3 rounded-xl ml-2`,
                styles.applyButton
              ]} 
              onPress={applySort}
            >
              <Text 
                style={[
                  tw`text-center text-white`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                เรียงลำดับ
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  applyButton: {
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  }
});