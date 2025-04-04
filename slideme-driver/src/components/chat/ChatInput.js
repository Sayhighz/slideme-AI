import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * ChatInput Component
 * 
 * @param {Object} props
 * @param {string} props.message - The current message text
 * @param {Function} props.onChangeText - Function to handle text changes
 * @param {Function} props.onSend - Function to handle send button press
 */
const ChatInput = ({ message, onChangeText, onSend }) => {
  return (
    <View style={tw`flex-row items-center p-3 bg-white border-t border-gray-200`}>
      <TextInput
        style={[
          tw`flex-1 bg-gray-100 px-4 py-3 mx-2 rounded-full border border-gray-300`,
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
        value={message}
        onChangeText={onChangeText}
        placeholder="พิมพ์ข้อความ..."
        placeholderTextColor="#999"
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={onSend}
      />

      <TouchableOpacity 
        style={tw`p-3 bg-[${COLORS.PRIMARY}] rounded-full`} 
        onPress={onSend}
        disabled={!message.trim()}
      >
        <Icon name="send" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput;