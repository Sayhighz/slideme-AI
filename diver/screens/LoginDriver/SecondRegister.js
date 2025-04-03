import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import SubmitButton from '../../components/SubmitButton';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';

const SecondRegister = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [idExpiryDate, setIdExpiryDate] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const handleNextPress = () => {
    if (
      !name ||
      !lastName ||
      !idNumber ||
      !birthDate ||
      !idExpiryDate ||
      !licensePlate
    ) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^\d{4}-\d{2}-\d{2}$/.test(idExpiryDate)) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกวันที่ในรูปแบบ YYYY-MM-DD');
      return;
    }

    navigation.navigate('ThirdRegister', {
      ...route.params,
      name,
      lastName,
      idNumber,
      birthDate,
      idExpiryDate,
      licensePlate,
    });

    console.log(
      `Name: ${name}, ID Number: ${idNumber}, Birth Date: ${birthDate}, ID Expiry Date: ${idExpiryDate}, License Plate: ${licensePlate}`
    );
  };

  const handleBackPress = () => {
    navigation.navigate('FirstRegister');
  };

  const enforceDateFormat = (value) => {
    // Automatically format the date to `YYYY-MM-DD`
    const formattedValue = value.replace(/[^0-9]/g, '') // Remove non-numeric characters
      .replace(/(\d{4})(\d{0,2})(\d{0,2})/, (match, year, month, day) => {
        let result = year;
        if (month) result += '-' + month;
        if (day) result += '-' + day;
        return result;
      });
    return formattedValue.substring(0, 10); // Restrict length to `YYYY-MM-DD`
  };

  return (
    <>
    <HeaderWithBackButton
      showBackButton={true}
      title="ขั้นตอนที่ 1 จาก 3"
      onPress={handleBackPress}
    />
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

          {/* Form Content */}
          <View style={tw`flex-1 ml-3`}>
            <Text style={[styles.globalText, tw`text-3xl mb-4`]}>สร้างบัญชีของคุณ</Text>
            <Text style={[styles.globalText, tw`text-lg mb-2`]}>ข้อมูลทั่วไป</Text>

            <Text style={[styles.globalText, tw`text-sm`]}>ชื่อ (ตามบัตรประชาชน)*</Text>
            <TextInput
              placeholder="ชื่อ (ตามบัตรประชาชน)"
              style={[styles.input, tw`mb-4`]}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.globalText, tw`text-sm`]}>นามสกุล (ตามบัตรประชาชน)*</Text>
            <TextInput
              placeholder="นามสกุล (ตามบัตรประชาชน)"
              style={[styles.input, tw`mb-4`]}
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={[styles.globalText, tw`text-sm`]}>เลขประจำตัวประชาชน*</Text>
            <TextInput
              placeholder="เลขประจำตัวประชาชน"
              style={[styles.input, tw`mb-4`]}
              keyboardType="numeric"
              value={idNumber}
              maxLength={13}
              onChangeText={setIdNumber}
            />

            <Text style={[styles.globalText, tw`text-sm`]}>วันเกิด (YYYY-MM-DD)*</Text>
            <TextInput
              placeholder="วันเกิด (YYYY-MM-DD)"
              style={[styles.input, tw`mb-4`]}
              value={birthDate}
              onChangeText={(value) => setBirthDate(enforceDateFormat(value))}
              maxLength={10}
            />

            <Text style={[styles.globalText, tw`text-sm`]}>วันที่หมดอายุใบขับขี่ (YYYY-MM-DD)*</Text>
            <TextInput
              placeholder="วันที่หมดอายุใบขับขี่ (YYYY-MM-DD)"
              style={[styles.input, tw`mb-4`]}
              value={idExpiryDate}
              onChangeText={(value) => setIdExpiryDate(enforceDateFormat(value))}
              maxLength={10}
            />

            {/* New Section for Vehicle Information */}
            <Text style={[styles.globalText, tw`text-lg mb-4`]}>เพิ่มข้อมูลยานพาหนะ</Text>
            <Text style={[styles.globalText, tw`text-sm`]}>ป้ายทะเบียนรถ*</Text>
            <TextInput
              placeholder="ป้ายทะเบียนรถ"
              style={[styles.input, tw`mb-4`]}
              value={licensePlate}
              maxLength={7}
              onChangeText={setLicensePlate}
            />
          </View>
          <View style={tw`h-20`}></View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SubmitButton onPress={handleNextPress} title="ถัดไป" />
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: 'Mitr-Regular',
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Mitr-Regular',
  },
});

export default SecondRegister;
