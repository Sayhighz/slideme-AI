import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import tw from "twrnc";
import { IP_ADDRESS } from "../../config";
import { UserContext } from "../../UserContext";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

// Utility functions
const formatThaiDate = (dateString) => {
  const monthsThai = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const date = new Date(dateString);
  const day = date.getDate();
  const month = monthsThai[date.getMonth()];
  const year = date.getFullYear() + 543 - 2500;
  return `${day} ${month} ${year}`;
};

const mapServiceStatus = (status) => {
  switch (status) {
    case "completed":
      return "สำเร็จ";
    case "cancelled":
      return "ยกเลิก";
    default:
      return "กำลังดำเนินการ";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return { icon: "check-circle", color: "#28a745", bgColor: "#d4edda" };
    case "cancelled":
      return { icon: "times-circle", color: "#dc3545", bgColor: "#f8d7da" };
    default:
      return { icon: "hourglass-half", color: "#ffc107", bgColor: "#fff3cd" };
  }
};

const formatNumberWithCommas = (number) => {
  return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const HistoryPage = () => {
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [serviceHistoryData, setServiceHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userData } = useContext(UserContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://${IP_ADDRESS}:4000/customer/service_history_customer?customer_id=${userData.user_id}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setServiceHistoryData(Array.isArray(data.Result) ? data.Result : []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Initial fetch

    // Set interval for data refresh every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    // Cleanup interval when component unmounts
    return () => clearInterval(intervalId);
  }, [userData.user_id]);

  const filteredData = serviceHistoryData.filter((item) => {
    if (filter === "completed") return item.service_status === "completed";
    if (filter === "cancelled") return item.service_status === "cancelled";
    return true;
  });

  const toggleFilterMenu = () => {
    setFilterMenuVisible(!filterMenuVisible);
  };

  const applyFilter = (selectedFilter) => {
    setFilter(selectedFilter);
    setFilterMenuVisible(false);
  };

  const openModal = (item) => {
    if (!item) {
      console.warn("Item is null or undefined");
      return;
    }
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const { icon, color, bgColor } = getStatusIcon(item.service_status);

    return (
      <TouchableOpacity onPress={() => openModal(item)}>
        <View
          style={tw`bg-white rounded-lg p-4 mb-4 shadow flex-row items-center`}
        >
          <View
            style={[
              tw`items-center justify-center mr-4`,
              {
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: bgColor,
              },
            ]}
          >
            <Icon name={icon} size={24} color={color} />
          </View>
          <View>
            <Text style={[tw`text-lg`, styles.customFont]}>
              {item.vehicle_type || "ไม่ระบุ"}
            </Text>
            <Text style={[tw`text-gray-600`, styles.customFont]}>
              วันที่: {formatThaiDate(item.date)}
            </Text>
            <Text style={[tw`text-gray-600`, styles.customFont]}>
              สถานะ: {mapServiceStatus(item.service_status)}
            </Text>
            <Text style={[tw`text-gray-600`, styles.customFont]}>
              ค่าบริการ:{" "}
              {item.service_charge
                ? formatNumberWithCommas(item.service_charge)
                : "0"}{" "}
              บาท
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>กำลังโหลดรายการ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <>
      <HeaderWithBackButton
        title="ประวัติการใช้บริการ"
        showBackButton={false}
      />
      <View style={tw`flex-1 bg-gray-100`}>
        {/* Filter Button */}
        <TouchableOpacity
          style={[
            tw`absolute z-50 bottom-6 right-6 bg-white rounded-full shadow`,
            {
              width: 60,
              height: 60,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
          onPress={toggleFilterMenu}
        >
          <Icon name="filter" size={24} color="#60B876" />
        </TouchableOpacity>

        {/* Filter Menu Modal */}
        <Modal
          transparent={true}
          visible={filterMenuVisible}
          animationType="fade"
          onRequestClose={toggleFilterMenu}
        >
          <TouchableOpacity
            style={tw`flex-1 bg-black bg-opacity-50`}
            onPress={toggleFilterMenu}
          />
          <View
            style={tw`absolute bottom-20 right-6 bg-white rounded-lg shadow p-4`}
          >
            <TouchableOpacity
              style={tw`flex-row items-center mb-2`}
              onPress={() => applyFilter("all")}
            >
              <Icon name="list" size={20} color="#60B876" style={tw`mr-2`} />
              <Text style={tw`text-black text-lg`}>ทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-row items-center mb-2`}
              onPress={() => applyFilter("completed")}
            >
              <Icon
                name="check-circle"
                size={20}
                color="#28a745"
                style={tw`mr-2`}
              />
              <Text style={tw`text-black text-lg`}>สำเร็จ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-row items-center`}
              onPress={() => applyFilter("cancelled")}
            >
              <Icon
                name="times-circle"
                size={20}
                color="#dc3545"
                style={tw`mr-2`}
              />
              <Text style={tw`text-black text-lg`}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* FlatList */}
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            return item && item.id ? item.id.toString() : `index-${index}`;
          }}
          contentContainerStyle={tw`pb-15`}
        />

        {selectedItem && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
              <View style={tw`bg-white rounded-lg p-6 w-11/12`}>
                <Text style={[styles.customFont,tw`text-xl font-bold mb-4`]}>
                  {selectedItem.vehicle_type || "ไม่ระบุ"}
                </Text>
                <Text style={[styles.customFont,tw`text-gray-700 mb-4`]}>
                  วันที่: {formatThaiDate(selectedItem.date)}
                </Text>
                <Text style={[styles.customFont,tw`text-gray-700 mb-4`]}>
                  สถานะ: {mapServiceStatus(selectedItem.service_status)}
                </Text>
                <Text style={[styles.customFont,tw`text-gray-700 mb-4`]}>
                  ค่าบริการ: {formatNumberWithCommas(selectedItem.service_charge)} บาท
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={tw`bg-[#60B876] py-2 px-4 rounded-lg`}
                >
                  <Text style={[styles.customFont,tw`text-white text-center`]}>ปิดหน้าต่าง</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  customFont: {
    fontFamily: "Mitr-Regular",
  },
});

export default HistoryPage;
