import React from 'react';
import { View, Text, TextInput } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * Reusable input component for authentication screens
 * 
 * @param {Object} props
 * @param {string} props.label - Label text for the input
 * @param {string} props.value - Current value of the input
 * @param {Function} props.onChangeText - Function to call when text changes
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.keyboardType='default'] - Keyboard type (numeric, email-address, etc.)
 * @param {boolean} [props.secureTextEntry=false] - Whether to hide text entry (for passwords)
 * @param {Object} [props.error] - Error object with message
 * @param {Object} [props.style] - Additional styles
 * @param {number} [props.maxLength] - Maximum length of input
 */
const AuthInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  style,
  maxLength,
  editable = true,
}) => {
  return (
    <View style={tw`mb-4 ${style}`}>
      {label && (
        <Text 
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.M,
            ...tw`text-gray-700 mb-1`
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        editable={editable}
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          ...tw`border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-800`,
          ...(error && tw`border-red-500`),
        }}
      />
      {error && (
        <Text 
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.S,
            ...tw`text-red-500 mt-1`
          }}
        >
          {error.message}
        </Text>
      )}
    </View>
  );
};

export default AuthInput;