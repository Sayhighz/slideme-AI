import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import SubmitButton from '../../components/SubmitButton';

const FifthRegister = ({ navigation, route }) => {
  const initialItems = [
    { label: 'กำลังตรวจสอบ\nข้อมูลเพิ่มเติม', isProcessing: true },
    { label: 'กำลังตรวจสอบ\nข้อมูลยานพาหนะ', isProcessing: true },
    { label: 'กำลังตรวจสอบ\nข้อมูลส่วนตัว', isProcessing: true },
    { label: 'อนุมัติ\nการอบรม', isProcessing: false },
    { label: 'อนุมัติ\nรูปใบขับขี่', isProcessing: false },
  ];

  const [items, setItems] = useState(initialItems);
  const [allApproved, setAllApproved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedItems = items.map((item) => ({
        ...item,
        isProcessing: false,
      }));
      setItems(updatedItems);
      setAllApproved(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView
        contentContainerStyle={tw`p-4 mx-auto w-10/12`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.globalText, tw`text-2xl mb-2 mt-10 text-center`]}>
          ขอบคุณสำหรับการลงทะเบียน
        </Text>
        <Text style={[styles.globalText, tw`text-sm text-center text-gray-600 mb-8`]}>
          ใช้เวลาในการตรวจสอบ 2-5 วันการ รายละเอียดเอกสารฯ
        </Text>

        {/* List of sections */}
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={tw`bg-white shadow-md border border-gray-300 w-full p-4 rounded-lg mb-4 flex-row justify-between items-center`}
            disabled
          >
            <Text style={[styles.globalText, tw`text-lg`]}>{item.label}</Text>
            {item.isProcessing ? (
              <ActivityIndicator size="small" color="#60B876" />
            ) : (
              <MaterialIcons name="check-circle" size={24} color="#60B876" />
            )}
          </TouchableOpacity>
        ))}
        <View style={tw`h-20`}></View>
      </ScrollView>

      {/* Fixed Complete Button */}

        {allApproved && (
          <SubmitButton
            onPress={() =>
              navigation.navigate('SixRegister', {
                ...route.params,
              })}
            title="เสร็จสิ้น"
          />
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: 'Mitr-Regular', // Use your custom font
  },
});

export default FifthRegister;
