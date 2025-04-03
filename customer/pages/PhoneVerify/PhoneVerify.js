// PhoneVerify.js
import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, TextInput, Keyboard, TouchableWithoutFeedback, Alert , StyleSheet , Dimensions} from 'react-native';
import tw from 'twrnc';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useContext } from 'react'; // Import useContext
import { UserContext } from '../../UserContext'; // Import UserContext

function PhoneVerify({ onLogin }) {
    const { setUserData } = useContext(UserContext);
    const route = useRoute();
    const navigation = useNavigation();
    const { phoneNumber, otp: initialOtp, isExistingUser, userDetails } = route.params;
    const [otp, setOtp] = useState(['', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState(initialOtp); // Store current OTP
    const [cooldown, setCooldown] = useState(0); // Cooldown state

    const { width: screenWidth } = Dimensions.get('window');
    const { width } = Dimensions.get("window");
    const dynamicFontSize = (size) => Math.max(16, (size * width) / 375);

    const otpRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef()]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer); // Cleanup on unmount
    }, [cooldown]);

    const handleOtpChange = (index, value) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < otpRefs.current.length - 1) otpRefs.current[index + 1].current.focus();
        else if (!value && index > 0) otpRefs.current[index - 1].current.focus();
    };

    const handleLoginClick = () => {
        const enteredOtp = otp.join('');
        if (enteredOtp === generatedOtp.toString()) {
            if (isExistingUser) {
                if (userDetails) {
                    const { customer_id, phone_number, email, username, first_name, last_name, role } = userDetails;
                    console.log('User Detailsss:', {
                        customer_id,
                        phone_number,
                        email,
                        username,
                        first_name,
                        last_name,
                        role,
                    });

                    // Save user details to UserContext
                    setUserData({
                        customer_id,
                        phone_number,
                        email,
                        username,
                        first_name,
                        last_name,
                        role,
                    });
                }

                onLogin(); // Trigger the login process
            } else {
                navigation.navigate('InfoCustomer', { phoneNumber });
            }
        } else {
            Alert.alert("OTP ไม่ถูกต้อง", "กรุณาตรวจสอบ OTP อีกครั้ง");
        }
    };
    
    const handleResendClick = () => {
        if (cooldown === 0) {
            const newOtp = Math.floor(1000 + Math.random() * 9000);
            setGeneratedOtp(newOtp); // Update OTP state
            Alert.alert("New OTP Code", `OTP: ${newOtp}`);
            setCooldown(1); // Reset cooldown
        }
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={tw`flex-1 bg-white`}>
                <View style={tw`flex-1 justify-center items-center mt-5`}>
                    <View style={tw`p-4 items-center justify-center`}>
                    <Text
              style={[
                styles.globalText,
                tw.style("text-center", {
                  fontSize: dynamicFontSize(52),
                  color: "#60B876",
                  lineHeight: dynamicFontSize(58),
                }),
              ]}
            >
              SLIDE
            </Text>
            <Text
              style={[
                styles.globalText,
                tw.style("text-center", {
                  fontSize: dynamicFontSize(80),
                  color: "#60B876",
                  lineHeight: dynamicFontSize(88),
                }),
              ]}
            >
              ME
            </Text>
                    </View>
                </View>

                <View style={tw`flex-2 items-center p-5`}>
                    <Text style={[styles.globalText ,tw`mb-4 text-lg`]}>กรอกรหัส OTP CODE</Text>
                    <View style={tw`flex-row justify-center mb-4`}>
                        {otp.map((code, index) => (
                            <TextInput
                                key={index}
                                ref={otpRefs.current[index]}
                                style={[styles.globalText,tw`border-2 rounded-lg w-12 h-12 text-center text-lg mx-2`]}
                                maxLength={1}
                                keyboardType="numeric"
                                value={code}
                                onChangeText={(value) => handleOtpChange(index, value)}
                            />
                        ))}
                    </View>
                    <View style={tw`flex-row justify-between w-full px-10`}>
                        <Text style={[styles.globalText , tw`text-blue-500`]} onPress={navigation.goBack}>แก้ไขเบอร์โทร ?</Text>
                        <Text
                            style={[tw`${cooldown > 0 ? 'text-gray-400' : 'text-blue-500'}`, styles.globalText]}
                            onPress={handleResendClick}
                        >
                            {cooldown > 0 ? `ส่งรหัสอีกครั้งใน ${cooldown} วินาที` : "ส่งรหัสอีกครั้ง"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[tw`bg-[#60B876] rounded-lg mt-8 w-3/4 p-3`, !isOtpComplete && tw`bg-gray-400`]}
                        onPress={handleLoginClick}
                        disabled={!isOtpComplete}
                    >
                        <Text style={[styles.globalText , tw`text-white text-center`]}>ยืนยัน</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    globalText: {
      fontFamily: 'Mitr-Regular',
      fontSize: 16,
    },
  });

export default PhoneVerify;
