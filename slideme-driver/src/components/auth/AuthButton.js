import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * Reusable button component for authentication screens
 * 
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {boolean} [props.isLoading=false] - Whether to show loading indicator
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.secondary=false] - Whether button is secondary style
 * @param {string} [props.style] - Additional style for the button
 */
const AuthButton = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  secondary = false,
  style,
}) => {
  const buttonStyle = secondary
    ? tw`bg-gray-200 border border-gray-300`
    : tw`bg-[${COLORS.PRIMARY}]`;

  const textStyle = secondary
    ? tw`text-gray-800`
    : tw`text-white`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{
        ...tw`w-full py-3 rounded-lg items-center justify-center ${style}`,
        ...buttonStyle,
        ...(disabled && tw`opacity-50`),
      }}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={secondary ? COLORS.PRIMARY : 'white'} 
        />
      ) : (
        <Text 
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.M,
            ...textStyle,
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default AuthButton;