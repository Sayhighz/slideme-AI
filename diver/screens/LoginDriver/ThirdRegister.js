import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Button,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import SubmitButton from '../../components/SubmitButton';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';

const ThirdRegister = ({ navigation, route }) => {
  const [isTestModalVisible, setTestModalVisible] = useState(false);
  const [isTestCompleted, setTestCompleted] = useState(false);

  const handleTestPress = () => {
    setTestModalVisible(true);
  };

  const handleTestComplete = () => {
    setTestModalVisible(false);
    setTestCompleted(true);
  };

  const handleBackPress = () => {
    navigation.navigate('SecondRegister');
  };

  const handleNextPress = () => {
    if (isTestCompleted) {
      navigation.navigate('FourthRegister', {
        ...route.params,
      });
      console.log('Test completed');
    } else {
      Alert.alert('แจ้งเตือน', 'กรุณาทำแบบทดสอบให้เสร็จก่อน');
    }
  };

  return (
    <>
      <HeaderWithBackButton showBackButton={true} title="ขั้นตอนที่ 2 จาก 3" onPress={handleBackPress}/>
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={tw`p-4`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          <View style={tw``}>
            <Text style={[styles.globalText, tw`text-2xl mb-4`]}>อบรมและทำแบบทดสอบ</Text>
            <View style={tw`bg-black h-60 w-full rounded-lg mb-10 justify-center items-center`}>
              <Icon name="videocam-outline" size={40} color="#fff" />
            </View>

            <TouchableOpacity
              style={tw`bg-white w-full p-4 rounded-lg border border-gray-300`}
              onPress={handleTestPress}
            >
              <View style={tw`flex-row justify-center items-center`}>
                <Text style={[styles.globalText, tw`text-lg text-center text-gray-700`]}>
                  ทำแบบทดสอบ
                </Text>
                {isTestCompleted && (
                  <MaterialIcons name="check-circle" size={24} color="#60B876" style={tw`ml-2`} />
                )}
              </View>
            </TouchableOpacity>

            <Text style={[styles.globalText, tw`text-sm text-gray-600 mt-2`]}>
              รายละเอียด และเงื่อนไขในการทำแบบทดสอบฯ
            </Text>
          </View>
        </ScrollView>

      

        {/* Modal for Test */}
        <Modal visible={isTestModalVisible} animationType="slide" transparent={true}>
          <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
            <View style={tw`bg-white w-10/12 p-6 rounded-lg`}>
              <Text style={[styles.globalText, tw`text-lg mb-4`]}>SLIDEME TEST</Text>
              <Text style={[styles.globalText, tw`text-base mb-4`]}>เนื้อหาของแบบทดสอบ...</Text>

              <Button title="เสร็จสิ้น" onPress={handleTestComplete} />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
      <SubmitButton title="ถัดไป" onPress={handleNextPress} disabled={!isTestCompleted}/>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: 'Mitr-Regular', // Custom font
  },
});

export default ThirdRegister;
