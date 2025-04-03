import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Button, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { IP_ADDRESS } from "../../config";
import { UserContext } from '../../UserContext';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';

const MessageBoxScreen = () => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const { userData } = useContext(UserContext);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://${IP_ADDRESS}:3000/auth/getAllNotifications`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('The requested resource was not found. Please check the endpoint.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          throw new Error(`Unexpected response type: ${contentType}. Response: ${textResponse}`);
        }
  
        const data = await response.json();
        console.log('Fetched data:', data);
  
        if (data.Status && Array.isArray(data.Result)) {
          setMessages(data.Result);
        } else {
          console.error('Unexpected data structure:', data);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages();
  }, []);
  
  const filteredMessages = messages.filter((message) => {
    if (filter === 'all') return true;
    return message.type === filter;
  });

  const openModal = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMessage(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <View style={tw`flex-row items-center p-4 bg-white mb-2 rounded shadow`}>
        <View
          style={[
            tw`items-center justify-center mr-3`,
            {
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: item.type === 'discount' ? '#fef3c7' : '#e0f2fe',
            },
          ]}
        >
          <Icon
            name={item.type === 'discount' ? 'tag' : 'newspaper'}
            size={30}
            color={item.type === 'discount' ? '#f59e0b' : '#3b82f6'}
          />
        </View>
        <View style={tw`flex-1`}>
          <Text style={[styles.globalText,tw`text-lg`]} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={[styles.globalText,tw`text-sm mt-2 text-gray-600`]} numberOfLines={3} ellipsizeMode="tail">
            {item.message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <HeaderWithBackButton showBackButton={false} title="กล่องข้อความ" />
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      {/* Filter Buttons */}
      <View style={tw`bg-[#60B876]`}>
        <View style={tw`flex-row justify-around p-3`}>
          <TouchableOpacity
            style={filter === 'all' ? tw`border-b-2 border-white` : tw`opacity-70`}
            onPress={() => setFilter('all')}
          >
            <View style={tw`flex-row items-center`}>
              <Icon name="filter-variant" size={20} color="white" style={tw`mr-2`} />
              <Text style={[styles.globalText, tw`text-white text-lg`]}>ทั้งหมด</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={filter === 'discount' ? tw`border-b-2 border-white` : tw`opacity-70`}
            onPress={() => setFilter('discount')}
          >
            <View style={tw`flex-row items-center`}>
              <Icon name="tag" size={20} color="white" style={tw`mr-2`} />
              <Text style={[styles.globalText, tw`text-white text-lg`]}>คูปองส่วนลด</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={filter === 'news' ? tw`border-b-2 border-white` : tw`opacity-70`}
            onPress={() => setFilter('news')}
          >
            <View style={tw`flex-row items-center`}>
              <Icon name="newspaper" size={20} color="white" style={tw`mr-2`} />
              <Text style={[styles.globalText, tw`text-white text-lg`]}>ข่าวสาร</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Section */}
      <View style={tw`p-5`}>
        {loading ? (
          <ActivityIndicator color="#60B876" />
        ) : (
          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={tw`pb-15`}
          />
        )}
      </View>

      {/* Modal for Message Details */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={tw`flex-1 justify-center items-center bg-gray-800 bg-opacity-50`}>
          <View style={tw`w-11/12 bg-white p-5 rounded`}>
            {selectedMessage && (
              <>
                <View style={tw`flex-row items-center`}>
                  <View
                    style={[
                      tw`items-center justify-center mr-3`,
                      {
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: selectedMessage.type === 'discount' ? '#fef3c7' : '#e0f2fe',
                      },
                    ]}
                  >
                    <Icon
                      name={selectedMessage.type === 'discount' ? 'tag' : 'newspaper'}
                      size={30}
                      color={selectedMessage.type === 'discount' ? '#f59e0b' : '#3b82f6'}
                    />
                  </View>
                  <Text style={[styles.globalText, tw`text-2xl`]}>{selectedMessage.title}</Text>
                </View>
                <Text style={[styles.globalText, tw`text-lg mb-5`]}>{selectedMessage.message}</Text>
                {selectedMessage.type === 'discount' && (
                  <Text style={[styles.globalText, tw`text-lg mb-5 text-green-600`]}>
                    โค้ดส่วนลด: {selectedMessage.discount_code}
                  </Text>
                )}
                <Button title="Close" color={'#60B876'} onPress={closeModal} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: 'Mitr-Regular',
  },
});

export default MessageBoxScreen;
