import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

/**
 * RegistrationSteps - คอมโพเนนต์สำหรับแสดงขั้นตอนการลงทะเบียน
 * @param {number} currentStep - ขั้นตอนปัจจุบัน (เริ่มจาก 1)
 * @param {number} totalSteps - จำนวนขั้นตอนทั้งหมด
 * @param {Array} stepTitles - ชื่อแต่ละขั้นตอน (optional) - ถ้าไม่มีจะแสดงเป็น "ขั้นตอนที่ 1" ฯลฯ
 */
const RegistrationSteps = ({ 
  currentStep, 
  totalSteps = 4,
  stepTitles = []
}) => {
  // ตรวจสอบค่า currentStep ให้อยู่ในช่วงที่ถูกต้อง
  const step = Math.min(Math.max(1, currentStep), totalSteps);
  
  // คำนวณความคืบหน้าเป็นเปอร์เซ็นต์
  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;
  
  return (
    <View style={tw`mb-6`}>
      <Text style={{
        fontFamily: FONTS.FAMILY.MEDIUM,
        fontSize: FONTS.SIZE.L,
        ...tw`text-gray-800 mb-4`,
      }}>
        {stepTitles[step - 1] || `ขั้นตอนที่ ${step} จาก ${totalSteps}`}
      </Text>
      
      <View style={tw`flex-row items-center mb-8`}>
        {[...Array(totalSteps)].map((_, index) => {
          // ตรวจสอบสถานะของแต่ละขั้น (completed, current, pending)
          const stepNumber = index + 1;
          const isCompleted = stepNumber < step;
          const isCurrent = stepNumber === step;
          const isPending = stepNumber > step;
          
          return (
            <React.Fragment key={index}>
              {/* Step circle */}
              <View style={[
                tw`rounded-full items-center justify-center`,
                styles.stepCircle,
                isCompleted ? styles.completedStep : 
                isCurrent ? styles.currentStep : 
                styles.pendingStep
              ]}>
                {isCompleted ? (
                  <Icon name="check" size={16} color="#fff" />
                ) : (
                  <Text style={{
                    fontFamily: FONTS.FAMILY.MEDIUM,
                    ...tw`text-xs`,
                    color: isCurrent ? '#fff' : COLORS.GRAY_500
                  }}>
                    {stepNumber}
                  </Text>
                )}
              </View>
              
              {/* Connecting line (ไม่แสดงหลังจากขั้นตอนสุดท้าย) */}
              {index < totalSteps - 1 && (
                <View style={tw`flex-1 h-1 mx-1`}>
                  <View style={[
                    tw`h-full rounded-full`,
                    isPending ? styles.pendingLine : styles.completedLine
                  ]} />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepCircle: {
    width: 28,
    height: 28,
    zIndex: 1
  },
  completedStep: {
    backgroundColor: COLORS.PRIMARY,
  },
  currentStep: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  pendingStep: {
    backgroundColor: COLORS.GRAY_200,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
  },
  completedLine: {
    backgroundColor: COLORS.PRIMARY,
  },
  pendingLine: {
    backgroundColor: COLORS.GRAY_300,
  }
});

export default RegistrationSteps;