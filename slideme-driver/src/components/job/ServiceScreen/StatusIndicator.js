import React from "react";
import {
  View,
  Text,
  StyleSheet
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTS, COLORS } from "../../../constants";

const StatusIndicator = ({ 
  currentStep = 1, // 1: going to pickup, 2: at pickup, 3: going to dropoff, 4: at dropoff
  uploadPhotosComplete = false
}) => {
  // สถานะของงาน
  const steps = [
    { id: 1, label: "ไปรับรถ", icon: "directions-car" },
    { id: 2, label: "ถึงจุดรับรถ", icon: "local-taxi", subStep: "ถ่ายรูปรถ" },
    { id: 3, label: "ไปส่งรถ", icon: "trending-up" },
    { id: 4, label: "ถึงจุดส่งรถ", icon: "place", subStep: "ถ่ายรูปรถ" }
  ];

  // ดึงสถานะปัจจุบัน
  const getCurrentStatus = () => {
    const currentStep = steps.find(step => step.id === currentStep) || steps[0];
    return currentStep;
  };

  const status = getCurrentStatus();

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {/* Progress Line */}
        <View style={styles.progressLine}>
          <View style={[styles.progressCompleted, { width: `${(Math.min(currentStep, 4) - 1) * 33.33}%` }]} />
        </View>
        
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepItem}>
              <View 
                style={[
                  styles.stepCircle, 
                  step.id <= currentStep ? styles.stepActive : styles.stepInactive
                ]}
              >
                <Icon 
                  name={step.icon} 
                  size={16} 
                  color={step.id <= currentStep ? 'white' : COLORS.GRAY_400}
                />
              </View>
              <Text 
                style={[
                  styles.stepLabel,
                  step.id <= currentStep ? styles.stepLabelActive : styles.stepLabelInactive
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressLine: {
    height: 4,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 2,
    marginBottom: 12,
    position: 'relative',
    marginHorizontal: 18,
  },
  progressCompleted: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
    left: 0,
    top: 0,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: '25%',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  stepInactive: {
    backgroundColor: COLORS.GRAY_200,
  },
  stepLabel: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 10,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.FAMILY.MEDIUM,
  },
  stepLabelInactive: {
    color: COLORS.GRAY_600,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusTitle: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 16,
    color: COLORS.GRAY_800,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabelContainer: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 18,
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  subStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subStepIcon: {
    marginRight: 4,
  },
  subStepText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 13,
  },
  statusActions: {
    flexDirection: 'row',
  },
})

export default StatusIndicator;