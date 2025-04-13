import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Linking,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import tw from 'twrnc';

// Import services
import ChatService from '../../services/ChatService';

// Import components
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import ChatHeader from '../../components/chat/ChatHeader';
import NewMessageIndicator from '../../components/chat/NewMessageIndicator';
import ScrollToBottomButton from '../../components/chat/ScrollToBottomButton';
import { COLORS } from '../../constants';

const ChatScreen = ({ route, navigation }) => {
  // Extract parameters from route
  const { room_id, user_name, phoneNumber } = route.params || {};
  
  // Set current user ID (in this case, driver)
  const currentUserId = 'driver';
  
  // State for messages and UI
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [atBottom, setAtBottom] = useState(true);
  const [newMessage, setNewMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for FlatList and animation
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load messages and setup socket connection on mount
  useEffect(() => {
    const setupChat = async () => {
      try {
        // Join room
        ChatService.joinRoom(room_id, currentUserId);
        
        // Load previous messages
        const savedMessages = await ChatService.loadMessages(room_id);
        setMessages(savedMessages);
        
        // Setup message listener
        ChatService.onReceiveMessage((data) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, data];
            // Save updated messages to AsyncStorage
            ChatService.saveMessages(room_id, updatedMessages);
            return updatedMessages;
          });
          
          // Show "new message" animation if not at bottom
          if (!atBottom) {
            setNewMessage(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        });
      } catch (error) {
        console.error('Error setting up chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupChat();
    
    // Cleanup socket listeners on unmount
    return () => {
      ChatService.removeListeners();
    };
  }, [room_id, atBottom, fadeAnim]);

  // Handle sending messages
  const sendMessage = () => {
    if (message.trim()) {
      const newMessageObj = {
        message: message.trim(),
        sender: currentUserId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update local state immediately for better UX
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newMessageObj];
        // Save updated messages to AsyncStorage
        ChatService.saveMessages(room_id, updatedMessages);
        return updatedMessages;
      });
      
      // Send message via socket
      ChatService.sendMessage(room_id, currentUserId, message.trim());
      
      // Clear input field
      setMessage('');
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    }
  };

  // Handle scroll events to detect when at bottom
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    setAtBottom(isAtBottom);
    
    if (isAtBottom && newMessage) {
      setNewMessage(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
      setAtBottom(true);
      setNewMessage(false);
    }
  };

  // Handle phone call
  const handleCall = () => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch(error => {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโทรได้ในขณะนี้');
      });
    } else {
      Alert.alert('หมายเลขโทรศัพท์', 'หมายเลขโทรศัพท์ไม่พร้อมใช้งาน');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={tw`flex-1`} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <ChatHeader
          title={`${user_name || 'ลูกค้า'}`}
          onBackPress={() => navigation.goBack()}
          onCallPress={handleCall}
          phoneNumber={phoneNumber}
        />
        
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `msg-${index}`}
          renderItem={({ item }) => (
            <ChatMessage
              message={item.message}
              sender={item.sender}
              currentUserId={currentUserId}
              timestamp={item.timestamp}
            />
          )}
          onScroll={handleScroll}
          onContentSizeChange={() => {
            // Auto scroll to bottom on first load and when a new message is added
            if ((isLoading && messages.length > 0) || atBottom) {
              setTimeout(scrollToBottom, 100);
            }
          }}
          style={tw`flex-1 px-3`}
          contentContainerStyle={tw`pb-2 pt-2`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        {/* New Message Indicator */}
        <NewMessageIndicator
          visible={newMessage && !atBottom}
          fadeAnim={fadeAnim}
          onPress={scrollToBottom}
        />
        
        {/* Scroll to Bottom Button */}
        <ScrollToBottomButton
          visible={!atBottom && messages.length > 10}
          onPress={scrollToBottom}
        />
        
        {/* Message Input */}
        <ChatInput
          message={message}
          onChangeText={setMessage}
          onSend={sendMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;