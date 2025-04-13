import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
    <View style={[
      tw`flex-row items-center justify-between bg-white p-4 border-b border-gray-200`,
      styles.headerContainer
    ]}>
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity 
          onPress={onBackPress}
          style={tw`p-1`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text 
          style={[
            tw`ml-3 text-lg text-gray-800`, 
            { fontFamily: FONTS.FAMILY.MEDIUM }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title || 'ลูกค้า'}
        </Text>
      </View>
      
      {phoneNumber && (
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: COLORS.PRIMARY }
          ]}
          onPress={onCallPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="phone" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  }
});

export default ChatHeader;