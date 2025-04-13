import React from "react";
import {
  View,
  Text,
  StyleSheet
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTS, COLORS } from "../../../constants";

const JobDetailsSection = ({ 
  locationDetails, 
  customerMessage,
  estimatedPrice = null,
  isDropoff = false 
}) => {
  return (
    <View style={styles.container}>
      {/* Optional Price Section (mainly for pickup) */}
      {estimatedPrice && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาประมาณการ</Text>
          <Text style={styles.priceValue}>
            {typeof estimatedPrice === 'string' 
              ? estimatedPrice 
              : `฿${estimatedPrice.toLocaleString('th-TH')}`}
          </Text>
        </View>
      )}

      {/* Location Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon 
            name={isDropoff ? "place" : "my-location"} 
            size={20} 
            color={COLORS.PRIMARY}
            style={styles.sectionIcon} 
          />
          <Text style={styles.sectionTitle}>
            {isDropoff ? "รายละเอียดจุดส่งรถ" : "รายละเอียดจุดรับรถ"}
          </Text>
        </View>
        <Text style={styles.locationText}>
          {locationDetails || "ไม่มีข้อมูลเพิ่มเติม"}
        </Text>
      </View>

      {/* Customer Message */}
      <View style={[styles.section, styles.messageSection]}>
        <View style={styles.sectionHeader}>
          <Icon 
            name="message" 
            size={20} 
            color={COLORS.PRIMARY}
            style={styles.sectionIcon} 
          />
          <Text style={styles.sectionTitle}>
            ข้อความจากลูกค้า
          </Text>
        </View>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {customerMessage || "ไม่มีข้อความเพิ่มเติมจากลูกค้า"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  priceLabel: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 16,
    color: COLORS.GRAY_800,
  },
  priceValue: {
    fontFamily: FONTS.FAMILY.BOLD || FONTS.FAMILY.MEDIUM,
    fontSize: 18,
    color: COLORS.PRIMARY,
  },
  section: {
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
  messageSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 16,
    color: COLORS.GRAY_800,
  },
  locationText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 14,
    color: COLORS.GRAY_600,
    lineHeight: 20,
  },
  messageBox: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  messageText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 14,
    color: COLORS.GRAY_700,
    lineHeight: 20,
  }
});

export default JobDetailsSection;