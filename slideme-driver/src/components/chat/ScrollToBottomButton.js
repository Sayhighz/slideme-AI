import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

/**
 * ScrollToBottomButton Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the button is visible
 * @param {Function} props.onPress - Function to scroll to the bottom
 */
const ScrollToBottomButton = ({ visible, onPress }) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={tw`absolute bottom-20 right-4 bg-gray-700 p-3 rounded-full`}
      onPress={onPress}
    >
      <Icon name="chevron-down" size={24} color="#fff" />
    </TouchableOpacity>
  );
};

export default ScrollToBottomButton;