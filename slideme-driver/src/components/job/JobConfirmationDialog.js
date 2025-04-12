import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

const JobConfirmationDialog = ({ visible, message, onConfirm, onCancel }) => {
  // Animation value for scaling effect
  const [scaleAnim] = React.useState(new Animated.Value(0.9));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      // When modal becomes visible, animate in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animations when modal is hidden
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        style={[
          tw`flex-1 justify-center items-center bg-black bg-opacity-50`,
          { opacity: opacityAnim }
        ]}
      >
        <Animated.View 
          style={[
            tw`bg-white rounded-2xl w-4/5 overflow-hidden`,
            styles.dialogCard,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header */}
          <View style={tw`bg-[${COLORS.PRIMARY}] p-4 items-center`}>
            <View style={tw`w-16 h-16 rounded-full bg-white items-center justify-center mb-2`}>
              <Icon name="cash-check" size={32} color={COLORS.PRIMARY} />
            </View>
            <Text 
              style={[
                tw`text-white text-xl`, 
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}
            >
              ยืนยันการเสนอราคา
            </Text>
          </View>
          
          {/* Message */}
          <View style={tw`p-6`}>
            <Text 
              style={[
                tw`text-gray-700 text-center text-lg mb-6`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              {message}
            </Text>
            
            {/* Buttons */}
            <View style={tw`flex-row`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-200 py-3 rounded-xl mr-2 items-center`}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    tw`text-gray-700 text-base`, 
                    { fontFamily: FONTS.FAMILY.REGULAR }
                  ]}
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  tw`flex-1 bg-[${COLORS.PRIMARY}] py-3 rounded-xl ml-2 items-center`,
                  styles.confirmButton
                ]}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    tw`text-white text-base`, 
                    { fontFamily: FONTS.FAMILY.MEDIUM }
                  ]}
                >
                  ยืนยัน
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dialogCard: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmButton: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  }
});

export default JobConfirmationDialog;