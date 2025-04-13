import React from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * NewMessageIndicator Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the indicator is visible
 * @param {Animated.Value} props.fadeAnim - Animation value for opacity
 * @param {Function} props.onPress - Function to scroll to the newest message
 */
const NewMessageIndicator = ({ visible, fadeAnim, onPress }) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        tw`absolute bottom-20 self-center bg-red-600 px-4 py-2 rounded-full items-center`,
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <TouchableOpacity 
        onPress={onPress}
        style={tw`flex-row items-center`}
        activeOpacity={0.8}
      >
        <Icon name="message-text" size={16} color="white" style={tw`mr-1`} />
        <Text 
          style={[
            tw`text-white text-sm`, 
            { fontFamily: FONTS.FAMILY.MEDIUM }
          ]}
        >
          ข้อความใหม่
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  }
});

export default NewMessageIndicator;