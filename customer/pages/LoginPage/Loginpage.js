// LoginPage.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import SignupPage from '../SignupPage/SignupPage';
import tw, { style } from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context'; // ใช้ SafeAreaView จาก react-native-safe-area-contex

function LoginPage({ onLogin }) {
    const [showSignupContent, setshowSignupContent] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const { width: screenWidth } = Dimensions.get('window');
    const { width } = Dimensions.get("window");
const dynamicFontSize = (size) => Math.max(16, (size * width) / 375);

    const animateFade = (showMain) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            setshowSignupContent(showMain);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleNext = () => animateFade(false);
    const handleBack = () => animateFade(true);

    return (
        <SafeAreaView style={tw`flex-1 bg-white relative`} edges={['top']}>
            <View style={tw`flex-1 justify-center items-center `}>
                <View style={[tw`rounded-lg items-center w-full h-full `]}>
                    {!showSignupContent && (
                        <TouchableOpacity
                            style={tw`absolute top-4 left-4 p-2 z-10`}
                            onPress={handleBack}
                            accessible={true}
                            accessibilityLabel="Go Back"
                        >
                            <Icon name="arrow-left" size={20} color="#000" />
                        </TouchableOpacity>
                    )}

                    <View style={tw`p-2 items-center justify-center mt-6 `}>
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

                    <Animated.View
                        style={[
                            tw`border-2 border-[#60B876] w-full flex-4 justify-start bg-[#60B876] items-center shadow-md shadow-black`,
                            {
                                opacity: fadeAnim,
                                height: screenWidth < 400 ? '80%' : '80%',
                                borderTopLeftRadius: 30, // Adjust the value as per your requirement
                                borderTopRightRadius: 30,
                                borderBottomLeftRadius: 0, // Ensure bottom corners are not rounded
                                borderBottomRightRadius: 0
                            }
                        ]}
                    >

                        {showSignupContent ? (
                            <View style={tw`flex justify-center items-center mt-5 w-full`}>
                                <Text style={[styles.globalText, tw`text-xl text-white text-center `]}>
                                    เรียกรถสไลด์ได้ง่าย ๆ ในไม่กี่คลิก!
                                </Text>
                                <TouchableOpacity
                                    style={tw`w-[50%] bg-transparent border-2 border-white py-3 rounded-lg mt-50`}
                                    onPress={handleNext}
                                // accessible={true}
                                // accessibilityLabel="Start Using"
                                >
                                    <Text style={[styles.globalText, tw`text-white text-lg text-center`]}>เริ่มต้นใช้งาน</Text>
                                </TouchableOpacity>

                                <Text style={[styles.globalText, tw`mt-2 text-xs text-white`]}>
                                    ข้อมูลติดต่อ/ช่วยเหลือ
                                </Text>
                            </View>

                        ) : (
                            <SignupPage onLogin={onLogin} onBack={handleBack} />
                        )}
                    </Animated.View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    globalText: {
        fontFamily: 'Mitr-Regular', // กำหนดฟอนต์ที่คุณต้องการ
    },
});

export default LoginPage;
