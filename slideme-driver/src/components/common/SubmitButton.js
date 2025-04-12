import React from "react";
import { TouchableOpacity, Text, View, Platform, SafeAreaView, ActivityIndicator } from "react-native";
import tw from "twrnc";
import { FONTS, COLORS } from "../../constants";

/**
 * Improved submit button component that works across iOS and Android
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} props.title - Button text
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.loading - Whether to show loading indicator
 * @param {string} props.backgroundColor - Custom background color (optional)
 * @param {Object} props.style - Additional style for the button container
 * @param {boolean} props.secondary - Whether to use secondary style
 */
const SubmitButton = ({ 
  onPress, 
  title, 
  disabled = false, 
  loading = false,
  backgroundColor,
  style,
  secondary = false
}) => {
  // Determine button background color
  const bgColor = disabled 
    ? "bg-gray-400" 
    : secondary 
      ? "bg-white" 
      : backgroundColor 
        ? `bg-[${backgroundColor}]` 
        : "bg-green-500"; // Use COLORS.PRIMARY directly as a class color

  // Determine text color
  const textColor = disabled 
    ? "text-gray-200" 
    : secondary 
      ? "text-green-500" 
      : "text-white";
  
  // Border style for secondary button
  const borderStyle = secondary ? "border border-green-500" : "";

  return (
    <SafeAreaView style={tw`bg-white border-t border-gray-300`}>
      <View style={[
        tw`w-full p-4 bg-white`,
        Platform.OS === 'ios' ? tw`pb-6` : tw`pb-4`,
        style
      ]}>
        <TouchableOpacity
          style={[
            tw`items-center justify-center w-full h-14 rounded-lg ${bgColor} ${borderStyle}`,
          ]}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={secondary ? COLORS.PRIMARY : "#ffffff"} 
            />
          ) : (
            <Text 
              style={[
                tw`${textColor} text-lg font-semibold`,
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}
            >
              {title}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SubmitButton;