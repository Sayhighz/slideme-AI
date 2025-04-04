import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * ChatHeader Component
 * 
 * @param {Object} props
 * @param {string} props.title - The customer name or title
 * @param {Function} props.onBackPress - Function to handle back button press
 * @param {Function} props.onCallPress - Function to handle call button press
 * @param {string} props.phoneNumber - Phone number to call
 */
const ChatHeader = ({ title, onBackPress, onCallPress, phoneNumber }) => {
  return (
    <View style={tw`flex-row items-center justify-between bg-white p-4 shadow-md border-b border-gray-200`}>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity onPress={onBackPress}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text 
          style={[
            tw`ml-4 text-lg`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {title || 'ลูกค้า'}
        </Text>
      </View>
      
      {phoneNumber && (
        <TouchableOpacity
          style={tw`bg-[${COLORS.PRIMARY}] w-10 h-10 rounded-full items-center justify-center`}
          onPress={onCallPress}
        >
          <MaterialIcons name="phone" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChatHeader;