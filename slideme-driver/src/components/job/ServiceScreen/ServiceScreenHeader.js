import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTS, COLORS } from "../../../constants";

const ServiceScreenHeader = ({ 
  onBack,
  onReport,
  onCancel,
  isDropoff = false,
  hideCancel = false
}) => {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon name="arrow-back" size={24} color={COLORS.GRAY_800} />
        </TouchableOpacity>
      )}

      <View style={styles.actionButtons}>
        {!hideCancel && !isDropoff && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onCancel || (() => Alert.alert("ยกเลิกงาน", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้"))}
          >
            <Text style={styles.actionText}>ยกเลิกงาน</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onReport || (() => Alert.alert("แจ้งปัญหา", "กรุณาติดต่อผู้ดูแลระบบสำหรับปัญหานี้"))}
        >
          <Text style={styles.actionText}>แจ้งปัญหา</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  actionText: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 14,
    color: COLORS.PRIMARY,
  }
});

export default ServiceScreenHeader;