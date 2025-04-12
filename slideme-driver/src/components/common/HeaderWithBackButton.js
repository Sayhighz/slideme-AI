import React from 'react';
import { View, TouchableOpacity, Text, StatusBar, Platform, SafeAreaView } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { FONTS, DIMENSIONS } from "../../constants";

/**
 * Improved header component with back button
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showBackButton - Whether to show the back button
 * @param {string} props.title - Title text to display
 * @param {Function} props.onPress - Function to call when back button is pressed
 * @param {string} props.rightIcon - Optional right icon name
 * @param {Function} props.onRightPress - Optional function for right icon press
 */
const HeaderWithBackButton = ({ 
  showBackButton, 
  title, 
  onPress, 
  rightIcon,
  onRightPress,
  titleStyle
}) => {
  // Calculate proper top padding based on the platform
  const statusBarHeight = Platform.OS === 'ios' 
    ? DIMENSIONS.STATUS_BAR_HEIGHT 
    : StatusBar.currentHeight || 0;

  return (
    <SafeAreaView style={tw`bg-white`}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View 
        style={[
          tw`flex-row items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200`,
          { paddingTop: statusBarHeight + (Platform.OS === 'ios' ? 8 : 12) }
        ]}
      >
        <View style={tw`flex-row items-center flex-1`}>
          {showBackButton && (
            <TouchableOpacity 
              onPress={onPress}
              style={tw`p-1 mr-2`}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Icon name="arrow-left" size={26} color="#333" />
            </TouchableOpacity>
          )}
          
          <Text 
            style={[
              tw`text-xl text-gray-800`, 
              { 
                fontFamily: FONTS.FAMILY.MEDIUM,
                flex: 1,
                paddingRight: rightIcon ? 26 : 0
              },
              titleStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightPress}
            style={tw`p-1`}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Icon name={rightIcon} size={26} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HeaderWithBackButton;