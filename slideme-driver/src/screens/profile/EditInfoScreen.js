import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import tw from 'twrnc';
import { getRequest, postRequest } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from '../../constants';
import { formatDate } from '../../utils/formatters';

// Import Components
import HeaderWithBackButton from '../../components/common/HeaderWithBackButton';

const EditInfoScreen = ({ navigation, route }) => {
  const { userData = {} } = route.params || {};
  
  const [formData, setFormData] = useState({
    id_expiry_date: '',
    email: '',
    license_plate: '',
    address: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.driver_id) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setLoading(false);
        return;
      }

      try {
        const response = await getRequest(`${API_ENDPOINTS.DRIVER.PROFILE.GET}/${userData.driver_id}`);
        if (response.Status) {
          const user = response;
          setFormData({
            id_expiry_date: formatDate(user.id_expiry_date) || '',
            email: user.email || '',
            license_plate: user.license_plate || '',
            address: user.address || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userData?.driver_id]);

  // Function to validate date format (YYYY-MM-DD)
  const validateDateFormat = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
  };

  // Function to format date input
  const handleDateChange = (text) => {
    // Format input as user types to YYYY-MM-DD
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      // Handle year
      formatted = cleaned.substring(0, 4);
      
      // Add first dash and month
      if (cleaned.length > 4) {
        formatted += '-' + cleaned.substring(4, 6);
        
        // Add second dash and day
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, 8);
        }
      }
    }

    setFormData(prev => ({ ...prev, id_expiry_date: formatted }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate date format
    if (formData.id_expiry_date && !validateDateFormat(formData.id_expiry_date)) {
      Alert.alert('ข้อผิดพลาด', 'โปรดใส่วันที่ในรูปแบบที่ถูกต้อง (ปปปป-ดด-วว)');
      return;
    }

    if (!userData?.driver_id) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        driver_id: userData.driver_id,
        ...formData
      };

      const response = await postRequest(API_ENDPOINTS.DRIVER.PROFILE.UPDATE, requestData);

      if (response && response.Status) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', [
          { text: 'ตกลง', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('ข้อผิดพลาด', response.Error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('ข้อผิดพลาด', MESSAGES.ERRORS.CONNECTION);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white justify-center items-center`}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
      ]}
    >
      <HeaderWithBackButton
        showBackButton={true}
        title="แก้ไขข้อมูล"
        onPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView 
          style={tw`flex-1 px-4`}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Fields */}
          <View style={tw`mb-4`}>
            <Text 
              style={[
                tw`text-gray-700 mb-2`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              วันหมดอายุใบขับขี่ (ปปปป-ดด-วว)
            </Text>
            <TextInput
              style={[
                tw`border border-gray-300 rounded-lg p-3 mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
              placeholder="2025-12-31"
              value={formData.id_expiry_date}
              onChangeText={handleDateChange}
              maxLength={10}
            />

            <Text 
              style={[
                tw`text-gray-700 mb-2`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              อีเมล (ถ้ามี)
            </Text>
            <TextInput
              style={[
                tw`border border-gray-300 rounded-lg p-3 mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
              placeholder="example@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text 
              style={[
                tw`text-gray-700 mb-2`, 
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
            >
              ทะเบียนรถ
            </Text>
            <TextInput
              style={[
                tw`border border-gray-300 rounded-lg p-3 mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}
              placeholder="กข 1234"
              value={formData.license_plate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate: text }))}
            />

          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={tw`px-4 py-4 bg-white border-t border-gray-200`}>
          <TouchableOpacity
            style={[
              tw`bg-[${COLORS.PRIMARY}] py-3 rounded-lg`, 
              submitting && tw`opacity-70`
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text 
                style={[
                  tw`text-white text-center`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                บันทึกการเปลี่ยนแปลง
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditInfoScreen;