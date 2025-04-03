import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import tw from 'twrnc';
import { IP_ADDRESS } from '../../config';
import SubmitButton from '../../components/SubmitButton';

const SixRegister = ({ navigation, route }) => {
  const {
    phoneNumber,
    selectedProvince,
    selectedVehicleType,
    name,
    lastName,
    idNumber,
    birthDate,
    idExpiryDate,
    licensePlate,
  } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    fetch(`http://${IP_ADDRESS}:3000/auth/register_driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        first_name: name,
        last_name: lastName,
        id_number: idNumber,
        birth_date: birthDate,
        id_expiry_date: idExpiryDate,
        license_plate: licensePlate,
        password,
        province: selectedProvince,
        vehicle_type: selectedVehicleType,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Status) {
          Alert.alert('สำเร็จ', 'การสมัครเสร็จสมบูรณ์');
          navigation.navigate('HomeLogin');
        } else {
          Alert.alert('ข้อผิดพลาด', data.Error);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={tw`p-4 pt-20`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={tw`mx-auto w-10/12`}>
            {/* Header */}
            <Text style={[styles.globalText, tw`text-2xl mb-2 text-center`]}>
              ยินดีด้วย !
            </Text>
            <Text style={[styles.globalText, tw`text-sm text-center text-gray-600 mb-8`]}>
              บัญชีของคุณได้รับการยืนยันแล้ว
            </Text>

            {/* Password creation form */}
            <Text style={[styles.globalText, tw`text-lg mb-4`]}>สร้างรหัสผ่าน</Text>
            <TextInput
              style={[
                styles.globalText,
                tw`border border-gray-400 p-3 mb-4 rounded-lg`,
              ]}
              placeholder="รหัสผ่าน"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={[
                styles.globalText,
                tw`border border-gray-400 p-3 mb-8 rounded-lg`,
              ]}
              placeholder="ยืนยันรหัสผ่าน"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
      <SubmitButton onPress={handleRegister} title="ยืนยัน" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: 'Mitr-Regular', // Custom font
  },
});

export default SixRegister;
