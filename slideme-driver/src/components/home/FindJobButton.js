import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  Platform, 
  Alert,
  ToastAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { COLORS, FONTS } from '../../constants';

const FindJobButton = ({ onPress, disabled = false, disabledMessage = "" }) => {
  const insets = useSafeAreaInsets();
  
  // คำนวณ bottom padding ให้เหมาะสมกับอุปกรณ์
  const bottomPadding = Math.max(16, insets.bottom);
  
  // สร้าง shadow style ตามแพลตฟอร์ม
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  });

  // ฟังก์ชันแสดงข้อความเตือนเมื่อปุ่มถูกปิด
  const handleDisabledPress = () => {
    if (disabledMessage) {
      if (Platform.OS === 'ios') {
        Alert.alert("ไม่สามารถค้นหางานได้", disabledMessage);
      } else {
        ToastAndroid.show(disabledMessage, ToastAndroid.LONG);
      }
    }
  };

  // กำหนดสีตามสถานะของปุ่ม
  const buttonColor = disabled ? COLORS.GRAY_500 : COLORS.PRIMARY;

  return (
    <View style={[
      tw`absolute left-0 right-0 items-center z-10`,
      { bottom: bottomPadding }
    ]}>
      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-center py-3.5 px-8 rounded-full`,
          { backgroundColor: buttonColor },
          shadowStyle
        ]}
        activeOpacity={disabled ? 0.9 : 0.7}
        onPress={disabled ? handleDisabledPress : onPress}
      >
        <Icon 
          name={disabled ? "block-helper" : "magnify"} 
          size={26} 
          color={COLORS.WHITE} 
        />
        <Text style={[
          tw`text-white text-lg font-semibold ml-3`,
          { fontFamily: FONTS.FAMILY.MEDIUM }
        ]}>
          {disabled ? "ไม่สามารถค้นหางานได้" : "ค้นหางาน"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FindJobButton;