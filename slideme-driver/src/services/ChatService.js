import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config';

// Create socket instance
const socket = io(SOCKET_URL);

/**
 * Chat Service to handle socket communication
 */
const ChatService = {
  /**
   * Join a chat room
   * @param {string} roomId - The chat room ID
   * @param {string} userId - The current user ID
   */
  joinRoom: (roomId, userId) => {
    socket.emit('joinRoom', { room_id: roomId, user_id: userId });
  },

  /**
   * Send a message to the room
   * @param {string} roomId - The chat room ID
   * @param {string} userId - The user ID
   * @param {string} message - The message to send
   */
  sendMessage: (roomId, userId, message) => {
    socket.emit('sendMessage', { room_id: roomId, user_id: userId, message });
  },

  /**
   * Listen for incoming messages
   * @param {Function} callback - Function to call when a message is received
   */
  onReceiveMessage: (callback) => {
    socket.on('receiveMessage', (data) => {
      callback(data);
    });
  },

  /**
   * Remove listeners when component unmounts
   */
  removeListeners: () => {
    socket.off('receiveMessage');
  },

  /**
   * Save messages to AsyncStorage
   * @param {string} roomId - The chat room ID
   * @param {Array} messages - Array of messages
   */
  saveMessages: async (roomId, messages) => {
    try {
      const storageKey = `chat_messages_${roomId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to AsyncStorage:', error);
    }
  },

  /**
   * Load messages from AsyncStorage
   * @param {string} roomId - The chat room ID
   * @returns {Promise<Array>} - Array of messages
   */
  loadMessages: async (roomId) => {
    try {
      const storageKey = `chat_messages_${roomId}`;
      const cachedMessages = await AsyncStorage.getItem(storageKey);
      return cachedMessages ? JSON.parse(cachedMessages) : [];
    } catch (error) {
      console.error('Error loading messages from AsyncStorage:', error);
      return [];
    }
  }
};

export default ChatService;