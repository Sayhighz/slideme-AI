import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Keyboard,
  Animated
} from 'react-native';
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
  const inputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(40);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  // Monitor keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Handle content size change for multi-line input
  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    
    // Limit the input height to avoid excessive expanding
    const newHeight = Math.min(Math.max(40, height), 100);
    
    // Only update if height changed to avoid unnecessary renders
    if (newHeight !== inputHeight) {
      setInputHeight(newHeight);
      
      // Animate the height change
      Animated.timing(animatedHeight, {
        toValue: newHeight - 40,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  };

  // Check if message has content to enable/disable send button
  const canSend = message.trim().length > 0;

  return (
    <Animated.View 
      style={[
        tw`flex-row items-center p-3 bg-white border-t border-gray-200`,
        styles.inputContainer,
        { paddingBottom: Platform.OS === 'ios' ? 3 + animatedHeight : 3 }
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[
          tw`flex-1 bg-gray-100 px-4 py-2 mx-2 rounded-full border border-gray-300`,
          { 
            fontFamily: FONTS.FAMILY.REGULAR,
            maxHeight: 100,
            minHeight: 40
          }
        ]}
        value={message}
        onChangeText={onChangeText}
        placeholder="พิมพ์ข้อความ..."
        placeholderTextColor="#999"
        multiline={true}
        onContentSizeChange={handleContentSizeChange}
        returnKeyType="default"
        blurOnSubmit={Platform.OS === 'ios' ? false : true}
      />

      <TouchableOpacity 
        style={[
          tw`p-3 rounded-full items-center justify-center`,
          styles.sendButton,
          canSend ? { backgroundColor: COLORS.PRIMARY } : { backgroundColor: COLORS.GRAY_400 }
        ]} 
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        <Icon name="send" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  }
});

export default ChatInput;