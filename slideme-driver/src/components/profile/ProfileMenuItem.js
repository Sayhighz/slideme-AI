import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * ProfileMenuItem Component
 * @param {Object} props
 * @param {string} props.label - Text to display for the menu item
 * @param {string} props.iconName - Name of the icon from MaterialCommunityIcons
 * @param {function} props.onPress - Function to call when the item is pressed
 * @param {boolean} props.isLast - Whether this is the last item (removes bottom border)
 * @param {boolean} props.isWarning - Whether to style this as a warning item (red color)
 */
const ProfileMenuItem = ({ 
  label, 
  iconName, 
  onPress, 
  isLast = false, 
  isWarning = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`flex-row items-center p-4 bg-white`,
        !isLast && tw`border-b border-gray-200`
      ]}
      onPress={onPress}
    >
      <Icon 
        name={iconName} 
        size={24} 
        color={isWarning ? COLORS.DANGER : COLORS.PRIMARY} 
        style={tw`mr-3`}
      />
      <Text
        style={[
          isWarning ? tw`text-red-500` : tw`text-gray-700`,
          { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
        ]}
      >
        {label}
      </Text>
      <View style={tw`flex-1 items-end`}>
        <Icon name="chevron-right" size={20} color={COLORS.GRAY_400} />
      </View>
    </TouchableOpacity>
  );
};

export default ProfileMenuItem;