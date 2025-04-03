import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Animated,
  Alert,
  Linking,
} from "react-native";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from "twrnc";
import { IP_ADDRESS } from "../../config";
import { useNavigation } from "@react-navigation/native";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";
const socket = io(`http://${IP_ADDRESS}:4000`);

export default function ChatScreen({ route }) {
  const { room_id, user_name, phoneNumber } = route.params;
  const user_id = "customer"; // Current user ID
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [atBottom, setAtBottom] = useState(true); // Check if user is at the bottom
  const [newMessage, setNewMessage] = useState(false); // Show new message indicator
  const navigation = useNavigation();
  const flatListRef = useRef(null); // Ref for FlatList
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for new message notification

  // Key for AsyncStorage
  const storageKey = `chat_messages_${room_id}`;

  useEffect(() => {
    // Join room on component mount
    socket.emit("joinRoom", { room_id, user_id });

    // Listen for incoming messages
    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, data];
        saveMessagesToStorage(updatedMessages); // Save to AsyncStorage
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

    // Load messages from AsyncStorage
    loadMessagesFromStorage();

    return () => {
      socket.off("receiveMessage"); // Clean up listener
    };
  }, [room_id, user_id, atBottom]);

  const sendMessage = () => {
    if (message.trim()) {
      // Emit the message to the server
      socket.emit("sendMessage", { room_id, user_id, message });

      // Clear input field
      setMessage("");
    }
  };

  // Save messages to AsyncStorage
  const saveMessagesToStorage = async (messages) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to AsyncStorage:", error);
    }
  };

  // Load messages from AsyncStorage
  const loadMessagesFromStorage = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem(storageKey);
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }
    } catch (error) {
      console.error("Error loading messages from AsyncStorage:", error);
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const bottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setAtBottom(bottom);
    if (bottom) {
      setNewMessage(false); // Hide new message indicator when at bottom
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setAtBottom(true);
    setNewMessage(false);
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url);
    } else {
      Alert.alert("หมายเลขโทรศัพท์", "หมายเลขโทรศัพท์ไม่พร้อมใช้งาน");
    }
  };


  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-[#f5f7fa]`} behavior="padding">
      {/* Header */}
      <HeaderWithBackButton
      showBackButton={true}
        title={`คุณ ${user_name}`}
        onPress={() => navigation.goBack()}
      />
      <View style={tw`absolute right-7 top-15`}>
      <TouchableOpacity
                  style={tw`bg-[#60B876] w-10 h-10 rounded-full flex items-center justify-center mx-1`}
                  onPress={() => handleCall(phoneNumber)}
                >
                  <Icon name="phone" size={15} color="white" />
                </TouchableOpacity>
        </View>

      {/* Message List */}
      <FlatList
        data={messages}
        ref={flatListRef} // Ref for scrolling
        onScroll={handleScroll} // Handle scroll events
        renderItem={({ item }) => (
          <View
            style={[
              tw`m-2 rounded-xl max-w-3/4 px-4 py-3 shadow-sm`,
              item.sender === user_id
                ? tw`bg-[#60B876] self-end`
                : tw`bg-white self-start border border-gray-200`,
            ]}
          >
            <Text
              style={[
                styles.globalText,
                tw`text-sm`,
                item.sender === user_id ? tw`text-white` : tw`text-gray-700`,
              ]}
            >
              {item.message}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={tw`flex-1 px-4`}
        contentContainerStyle={tw`py-2`}
      />

      {/* New Message Notification */}
      {newMessage && !atBottom && (
        <Animated.View
          style={[
            tw`absolute bottom-23  left-33 bg-red-600 px-4 py-2 rounded-full`,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.globalText, tw`text-white text-sm`]}>ข้อความใหม่!</Text>
        </Animated.View>
      )}

      {/* Scroll to Bottom Icon */}
      {!atBottom && (
        <TouchableOpacity
          style={tw`absolute bottom-20 right-4 bg-gray-700 p-3 rounded-full`}
          onPress={scrollToBottom}
        >
          <Icon name="chevron-down" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Input and Action Buttons */}
      <View style={tw`flex-row items-center p-3 bg-white border-t border-gray-200`}>
        {/* Input */}
        <TextInput
          style={[
            styles.globalText,
            tw`flex-1 bg-gray-100 px-4 py-3 mx-2 rounded-full border border-gray-300`,
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="พิมพ์ข้อความ..."
          placeholderTextColor="#999"
        />

        {/* Send Icon */}
        <TouchableOpacity style={tw`p-3 bg-[#60B876] rounded-full`} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
