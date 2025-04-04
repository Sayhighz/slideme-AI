import React from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { FONTS } from '../../constants';

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
        tw`absolute bottom-20 left-1/3 bg-red-600 px-4 py-2 rounded-full`,
        { opacity: fadeAnim }
      ]}
    >
      <TouchableOpacity onPress={onPress}>
        <Text 
          style={[
            tw`text-white text-sm`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ข้อความใหม่!
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NewMessageIndicator;