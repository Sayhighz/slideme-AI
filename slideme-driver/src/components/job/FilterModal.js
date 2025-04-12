import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, BackHandler } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

export default function FilterModal({ visible, setFilterDistance, filterDistance, onClose }) {
  // Available distance options with more choices
  const distanceOptions = [5, 10, 20, 50, 100];
  
  // Animation values
  const [slideAnim] = useState(new Animated.Value(400));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Track selected value to highlight it
  const [selectedValue, setSelectedValue] = useState(filterDistance);

  useEffect(() => {
    if (visible) {
      setSelectedValue(filterDistance);
      
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

  // Apply filter and close
  const applyFilter = () => {
    setFilterDistance(selectedValue);
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
        activeOpacity={1}
        onPress={handleClose}
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
              เลือกรัศมีค้นหางาน
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
            กำหนดระยะทางค้นหางานจากตำแหน่งปัจจุบันของคุณ
          </Text>
          
          {/* Distance options */}
          <View style={tw`mb-6`}>
            {distanceOptions.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  tw`p-4 rounded-xl mb-2 flex-row justify-between items-center`, 
                  selectedValue === distance 
                    ? tw`bg-[${COLORS.PRIMARY}]/10 border border-[${COLORS.PRIMARY}]` 
                    : tw`bg-gray-100 border border-gray-100`
                ]}
                onPress={() => setSelectedValue(distance)}
                activeOpacity={0.7}
              >
                <View style={tw`flex-row items-center`}>
                  <Icon 
                    name="map-marker-radius" 
                    size={24} 
                    color={selectedValue === distance ? COLORS.PRIMARY : COLORS.GRAY_600} 
                  />
                  <Text 
                    style={[
                      tw`ml-2 text-base ${selectedValue === distance ? `text-[${COLORS.PRIMARY}]` : "text-gray-700"}`,
                      { 
                        fontFamily: selectedValue === distance ? FONTS.FAMILY.MEDIUM : FONTS.FAMILY.REGULAR 
                      }
                    ]}
                  >
                    {distance} กิโลเมตร
                  </Text>
                </View>
                
                {selectedValue === distance && (
                  <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
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
                tw`flex-1 bg-[${COLORS.PRIMARY}] p-3 rounded-xl ml-2`,
                styles.applyButton
              ]} 
              onPress={applyFilter}
            >
              <Text 
                style={[
                  tw`text-center text-white`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                ใช้ตัวกรอง
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
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  }
});