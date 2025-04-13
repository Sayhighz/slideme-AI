import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking
} from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONTS, COLORS } from "../../../constants";

const CustomerHeader = ({ 
  customer, 
  onCall, 
  onChat, 
  tripDetails = null 
}) => {
  // Generate a display name from customer data
  const getCustomerName = () => {
    if (customer?.customer_name) {
      return customer.customer_name;
    } 
    
    if (customer?.first_name || customer?.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    
    return "ลูกค้า";
  };

  const handleCall = () => {
    const phone = customer?.customer_phone || customer?.phone_number;
    if (phone) {
      onCall(phone);
    } else {
      Alert.alert("หมายเลขโทรศัพท์", "หมายเลขโทรศัพท์ไม่พร้อมใช้งาน");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.customerInfo}>
          <Icon name="account-circle" size={24} color={COLORS.GRAY_600} style={tw`mr-2`} />
          <Text style={styles.customerName}>
            คุณ {getCustomerName()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Icon name="call" size={16} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={onChat}
          >
            <Icon name="chat" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Details Section (optional) */}
      {tripDetails && (
        <View style={styles.tripDetails}>
          <View style={styles.tripDetailItem}>
            <Icon name="directions-car" size={14} color={COLORS.GRAY_600} style={tw`mr-1`} />
            <Text style={styles.tripDetailText}>
              {tripDetails.vehicleType || "รถสไลด์"}
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.tripDetailItem}>
            <Icon name="straighten" size={14} color={COLORS.GRAY_600} style={tw`mr-1`} />
            <Text style={styles.tripDetailText}>
              {tripDetails.distance || "ไม่ระบุระยะทาง"}
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.tripDetailItem}>
            <Icon name="schedule" size={14} color={COLORS.GRAY_600} style={tw`mr-1`} />
            <Text style={styles.tripDetailText}>
              {tripDetails.duration || "ไม่ระบุเวลา"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
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
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 16,
    color: COLORS.GRAY_800,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  chatButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  tripDetails: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDetailText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 12,
    color: COLORS.GRAY_600,
  },
  separator: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.GRAY_400,
    borderRadius: 2,
    marginHorizontal: 8,
  },
});

export default CustomerHeader;