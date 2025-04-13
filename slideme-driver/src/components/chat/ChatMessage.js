import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
        tw`m-2 rounded-xl max-w-3/4 px-4 py-3`,
        isCurrentUser
          ? [styles.currentUserBubble, { backgroundColor: COLORS.PRIMARY }]
          : [styles.otherUserBubble, tw`bg-white border border-gray-200`],
      ]}
    >
      <Text
        style={[
          { fontFamily: FONTS.FAMILY.REGULAR },
          tw`text-base`,
          isCurrentUser ? tw`text-white` : tw`text-gray-800`,
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

const styles = StyleSheet.create({
  currentUserBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  }
});

export default ChatMessage;