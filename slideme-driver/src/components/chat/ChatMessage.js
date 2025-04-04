import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * ChatMessage Component
 * 
 * @param {Object} props
 * @param {string} props.message - The text content of the message
 * @param {string} props.sender - The sender ID of the message
 * @param {string} props.currentUserId - The current user's ID (to determine message alignment)
 * @param {string} [props.timestamp] - Optional timestamp for the message
 */
const ChatMessage = ({ message, sender, currentUserId, timestamp }) => {
  const isCurrentUser = sender === currentUserId;

  return (
    <View
      style={[
        tw`m-2 rounded-xl max-w-3/4 px-4 py-3 shadow-sm`,
        isCurrentUser
          ? tw`bg-[${COLORS.PRIMARY}] self-end`
          : tw`bg-white self-start border border-gray-200`,
      ]}
    >
      <Text
        style={[
          { fontFamily: FONTS.FAMILY.REGULAR },
          tw`text-sm`,
          isCurrentUser ? tw`text-white` : tw`text-gray-700`,
        ]}
      >
        {message}
      </Text>
      
      {timestamp && (
        <Text
          style={[
            { fontFamily: FONTS.FAMILY.REGULAR, fontSize: 10 },
            tw`mt-1 text-right`,
            isCurrentUser ? tw`text-white text-opacity-70` : tw`text-gray-500`,
          ]}
        >
          {timestamp}
        </Text>
      )}
    </View>
  );
};

export default ChatMessage;