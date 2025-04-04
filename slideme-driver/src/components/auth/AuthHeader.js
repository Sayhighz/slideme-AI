import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { FONTS } from '../../constants';

/**
 * Header component for authentication screens
 * 
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {Function} [props.onBack] - Function to call when back button is pressed
 * @param {boolean} [props.showBackButton=true] - Whether to show back button
 */
const AuthHeader = ({
  title,
  onBack,
  showBackButton = true
}) => {
  return (
    <View style={tw`flex-row items-center p-4 pt-12 bg-white`}>
      {showBackButton && onBack && (
        <TouchableOpacity 
          onPress={onBack} 
          style={tw`mr-4`}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      )}
      
      <Text 
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.XL,
          ...tw`text-gray-800`,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default AuthHeader;