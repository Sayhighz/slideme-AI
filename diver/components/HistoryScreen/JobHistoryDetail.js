import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function JobHistoryDetail({ job, visible, onClose }) {
  if (!job) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-4/5 p-9 bg-white rounded-lg`}>
          <Text style={[styles.globalText, tw`text-lg mb-4 text-center`]}>รายละเอียดงาน</Text>
          <Text style={styles.globalText}><Icon name="map-marker" size={20} color="green" /> ต้นทาง</Text>
          <Text style={[styles.globalText, tw`text-gray-500 mb-2`]}>{job.origin}</Text>
          <Text style={styles.globalText}><Icon name="map-marker" size={20} color="red" /> ปลายทาง</Text>
          <Text style={[styles.globalText, tw`text-gray-500 mb-2`]}>{job.destination}</Text>
          <Text style={styles.globalText}>รายได้: ฿{job.profit}</Text>
          <Text style={styles.globalText}>สถานะ: {job.status}</Text>
          <TouchableOpacity style={tw`mt-6 bg-[#60B876] p-3 rounded items-center`} onPress={onClose}>
            <Text style={[styles.globalText, tw`text-white`]}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});
