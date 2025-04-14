import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

/**
 * PasswordStrengthMeter - แสดงความแข็งแรงของรหัสผ่าน
 * @param {string} password - รหัสผ่านที่ต้องการตรวจสอบ
 */
const PasswordStrengthMeter = ({ password }) => {
  // ถ้าไม่มีรหัสผ่าน ไม่ต้องแสดง
  if (!password) return null;
  
  // ตรวจสอบเงื่อนไขความแข็งแรงของรหัสผ่าน
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // นับจำนวนเงื่อนไขที่ผ่าน
  const criteria = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar];
  const metCriteria = criteria.filter(Boolean).length;
  
  // ประเมินความแข็งแรงของรหัสผ่าน
  let strengthInfo = { label: '', color: '', strength: 0 };
  
  if (metCriteria <= 2) {
    strengthInfo = { label: 'อ่อน', color: '#e74c3c', strength: 25 };
  } else if (metCriteria === 3) {
    strengthInfo = { label: 'ปานกลาง', color: '#f1c40f', strength: 50 };
  } else if (metCriteria === 4) {
    strengthInfo = { label: 'ดี', color: '#3498db', strength: 75 };
  } else {
    strengthInfo = { label: 'ดีมาก', color: COLORS.PRIMARY, strength: 100 };
  }
  
  return (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row justify-between mb-1`}>
        <Text style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.S,
          ...tw`text-gray-500`,
        }}>
          ความปลอดภัย
        </Text>
        
        <Text style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.S,
          color: strengthInfo.color,
        }}>
          {strengthInfo.label}
        </Text>
      </View>
      
      <View style={tw`w-full h-1 bg-gray-200 rounded-full overflow-hidden`}>
        <View 
          style={{
            ...tw`h-full rounded-full`,
            backgroundColor: strengthInfo.color,
            width: `${strengthInfo.strength}%`,
          }}
        />
      </View>
      
      <View style={tw`mt-3`}>
        {criteria.map((met, index) => {
          const criteriaTexts = [
            "อย่างน้อย 8 ตัวอักษร",
            "มีตัวอักษรพิมพ์ใหญ่ (A-Z)",
            "มีตัวอักษรพิมพ์เล็ก (a-z)",
            "มีตัวเลข (0-9)",
            "มีอักขระพิเศษ (!@#$%^&*)"
          ];
          
          return (
            <View key={index} style={tw`flex-row items-center mb-1`}>
              <View style={[
                tw`w-4 h-4 rounded-full mr-2`,
                met ? { backgroundColor: strengthInfo.color } : styles.uncheckedCircle
              ]}>
                {met && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={{
                fontFamily: FONTS.FAMILY.REGULAR,
                fontSize: FONTS.SIZE.XS,
                ...tw`text-gray-600`,
              }}>
                {criteriaTexts[index]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  uncheckedCircle: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5'
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14
  }
});

export default PasswordStrengthMeter;