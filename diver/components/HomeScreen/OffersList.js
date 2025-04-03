import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

const OffersList = ({ offersData, loading, handleOfferPress }) => {
  // ตัดข้อความยาวให้สั้นลง
  const truncateText = (text, maxLength = 8) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // แปลงตัวเลขให้มี comma คั่นหลัก
  const formatNumberWithCommas = (number) => {
    if (isNaN(number)) return number;
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // แสดงสถานะของข้อเสนอในรูปแบบข้อความพร้อมสี
  const getFormattedStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <Text style={[styles.globalText, tw`text-yellow-500 text-xs`]}>
            รออนุมัติ
          </Text>
        );
      case "accepted":
        return (
          <Text style={[styles.globalText, tw`text-green-500 text-xs`]}>
            อยู่ระหว่างการทำงาน
          </Text>
        );
      default:
        return <Text style={styles.globalText}>{status}</Text>;
    }
  };

  // Render function สำหรับแต่ละรายการข้อเสนอ
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleOfferPress(item)}>
      <View style={tw`p-2 bg-white rounded-lg mb-2 shadow-md border border-gray-300 mx-3 flex-row justify-between`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-1`}>
            <Icon name="map-marker" size={13} color="gray" />
            <Text style={[styles.globalText, tw`text-xs ml-1`]}>
              {truncateText(item.location_from)}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Icon name="map-marker" size={13} color="gray" />
            <Text style={[styles.globalText, tw`text-xs ml-1`]}>
              {truncateText(item.location_to)}
            </Text>
          </View>
        </View>
        <View style={tw`flex-1 justify-center items-center`}>
          {getFormattedStatus(item.offer_status)}
          <Text style={[styles.globalText, tw`text-xs mt-1`]}>
            {truncateText(item.vehicle_type)}
          </Text>
        </View>
        <View style={tw`flex-1 justify-center items-end`}>
          <Text style={[styles.globalText, tw`text-blue-500 text-xs`]}>
            ราคาที่เสนอ
          </Text>
          <Text style={[styles.globalText, tw`text-xs mt-1`]}>
            {item.offered_price
              ? `฿${formatNumberWithCommas(item.offered_price)}`
              : "N/A"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={tw`w-19/20 mx-auto mt-4 p-4`}>
        <Text style={[styles.globalText, tw`text-gray-600 text-xl mb-2 text-center`]}>
          รายการเสนอราคา
        </Text>
      </View>
      <FlatList
        data={offersData}
        keyExtractor={(item) => item.offer_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.globalText, tw`text-center text-gray-500`]}>
              กำลังโหลด...
            </Text>
          ) : (
            <Text style={[styles.globalText, tw`text-center text-gray-500`]}>
              ไม่มีข้อมูลเสนอราคา
            </Text>
          )
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default OffersList;
