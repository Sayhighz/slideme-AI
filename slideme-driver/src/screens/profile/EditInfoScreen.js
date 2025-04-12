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
  StyleSheet,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRequest, postRequest, uploadFile } from '../../services/api';
import { API_ENDPOINTS, FONTS, COLORS, MESSAGES } from '../../constants';
import { formatDate } from '../../utils/formatters';
import { isValidEmail, isValidDate, isFutureDate, isValidLicensePlate } from '../../utils/validators';
import { IMAGE_URL } from '../../config';

// Import Components
import HeaderWithBackButton from '../../components/common/HeaderWithBackButton';

const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType, 
  maxLength, 
  error,
  icon,
  autoCapitalize = 'none',
  secureTextEntry = false,
  editable = true
}) => {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>
      
      <View style={[styles.inputContainer, error ? styles.inputError : null, !editable ? styles.inputDisabled : null]}>
        {icon && (
          <Icon name={icon} size={20} color={COLORS.GRAY_500} style={styles.inputIcon} />
        )}
        
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.GRAY_400}
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const EditInfoScreen = ({ navigation, route }) => {
  const { userData = {} } = route.params || {};
  
  const [formData, setFormData] = useState({
    id_expiry_date: '',
    email: '',
    license_plate: '',
    address: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Request permissions for image picker
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('ข้อผิดพลาด', 'ต้องการสิทธิ์ในการเข้าถึงคลังรูปภาพ');
        }
      }
    })();
  }, []);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.driver_id) {
        setGeneralError('ไม่พบข้อมูลผู้ใช้');
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
          
          if (user.profile_picture) {
            setProfileImage(`${IMAGE_URL}${user.profile_picture}`);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setGeneralError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      } finally {
        setLoading(false);
        // Animate content in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };

    fetchUserData();
  }, [userData?.driver_id]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    // Validate expiry date
    if (formData.id_expiry_date) {
      if (!isValidDate(formData.id_expiry_date)) {
        newErrors.id_expiry_date = 'รูปแบบวันที่ไม่ถูกต้อง (ปปปป-ดด-วว)';
      } else if (!isFutureDate(formData.id_expiry_date)) {
        newErrors.id_expiry_date = 'วันหมดอายุต้องเป็นวันที่ในอนาคต';
      }
    }
    
    // Validate license plate
    if (formData.license_plate && !isValidLicensePlate(formData.license_plate)) {
      newErrors.license_plate = 'ทะเบียนรถไม่ถูกต้อง';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    
    // Clear error when user is typing
    if (errors.id_expiry_date) {
      setErrors(prev => ({ ...prev, id_expiry_date: null }));
    }
  };

  // Handle text input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user is typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Upload profile image
  const uploadProfileImage = async () => {
    if (!profileImage || profileImage.startsWith(IMAGE_URL)) return null;
    
    try {
      const formData = new FormData();
      const filename = profileImage.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('profile_picture', {
        uri: profileImage,
        name: filename,
        type
      });
      
      formData.append('driver_id', userData.driver_id);
      
      const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.PROFILE_PICTURE, formData);
      
      if (uploadResponse.Status) {
        return uploadResponse.filename;
      }
      
      return null;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    // Validate form fields
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      // Upload profile image if changed
      let profilePicFilename = null;
      if (profileImage && !profileImage.startsWith(IMAGE_URL)) {
        profilePicFilename = await uploadProfileImage();
      }

      const requestData = {
        driver_id: userData.driver_id,
        ...formData
      };
      
      // Add profile picture if uploaded
      if (profilePicFilename) {
        requestData.profile_picture = profilePicFilename;
      }

      const response = await postRequest(API_ENDPOINTS.DRIVER.PROFILE.UPDATE, requestData);

      if (response && response.Status) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', [
          { text: 'ตกลง', onPress: () => navigation.goBack() }
        ]);
      } else {
        setGeneralError(response.Error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setGeneralError(MESSAGES.ERRORS.CONNECTION);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          showBackButton={true}
          title="แก้ไขข้อมูล"
          onPress={() => navigation.goBack()}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.ScrollView 
            style={[styles.scrollView, { opacity: fadeAnim }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* General Error Message */}
            {generalError && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={20} color="white" />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            {/* Profile Picture */}
            <View style={styles.profileImageContainer}>
              <View
                style={styles.profileImageWrapper}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Icon name="account" size={60} color={COLORS.GRAY_400} />
                  </View>
                )}
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
              
              <InputField
                label="อีเมล (ถ้ามี)"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="example@email.com"
                keyboardType="email-address"
                error={errors.email}
                icon="email-outline"
              />
              
              
              <Text style={styles.sectionTitle}>ข้อมูลยานพาหนะ</Text>
              
              <InputField
                label="ทะเบียนรถ"
                value={formData.license_plate}
                onChangeText={(text) => handleInputChange('license_plate', text)}
                placeholder="กข 1234"
                error={errors.license_plate}
                icon="car-outline"
                autoCapitalize="characters"
              />
              
              <InputField
                label="วันหมดอายุใบขับขี่ (ปปปป-ดด-วว)"
                value={formData.id_expiry_date}
                onChangeText={handleDateChange}
                placeholder="2025-12-31"
                error={errors.id_expiry_date}
                icon="calendar-outline"
                maxLength={10}
              />
            </View>
          </Animated.ScrollView>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>บันทึกการเปลี่ยนแปลง</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  errorBanner: {
    backgroundColor: COLORS.DANGER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginLeft: 8,
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: COLORS.GRAY_200,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    marginTop: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.FAMILY.REGULAR,
    color: COLORS.GRAY_700,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: 12,
    padding: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  inputDisabled: {
    backgroundColor: COLORS.GRAY_100,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: FONTS.FAMILY.REGULAR,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.FAMILY.MEDIUM || FONTS.FAMILY.REGULAR,
  },
});

export default EditInfoScreen;