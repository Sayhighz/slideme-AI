import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/th";

import tw, { style } from "twrnc";
import { useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TextInput, Menu, Provider } from "react-native-paper";
import { Provider as PaperProvider } from "react-native-paper";
import { IP_ADDRESS } from "../../config";
import { ScrollView } from "react-native-gesture-handler";
import { UserContext } from "../../UserContext";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SubmitButton from "../../components/SubmitButton";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";


dayjs.locale("th");
export default function Order({ navigation, bookmark }) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [showPicker, setShowPicker] = useState(false); // แสดงหน้าตัวเลือกวันที่
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [moreDetail, setMoreDetail] = useState("");
  const [preMoreDetail, setPreMoreDetail] = useState("");
  const [category, setCategory] = useState("");
  const [menuVisible, setMenuVisible] = useState(false); // แสดงตัวเลือกรถ
  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(UserContext);

  const { width, height } = Dimensions.get("window");
  const responsiveWidth = width * 0.9;
  const responsiveHeight = height * 0.2;
  const userId = userData?.user_id;

  useEffect(() => {
    console.log("userId:", userId);
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/customer/getuserbookmarks?user_id=${userId}`
      );
      const data = await response.json();
      if (data.Status) {
        setBookmarks(data.Result);
      } else {
        console.error(data.Error);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error.message);
    }
    setLoading(false);
  };

  const handleRequestFromBookmark = async (selectedBookmark) => {
    // Prepare the request payload using bookmark data

    if (!confirmOrigin) {
      alert("จากตําแหน่งต้องไม่เว้นว่าง, กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const requestData = {
      customer_id: userId, // User ID จาก useContext
      request_time: formatDateToMySQL(new Date()), // Current time
      pickup_lat: selectedBookmark.pickup_lat, // Extract from bookmark
      pickup_long: selectedBookmark.pickup_long, // Extract from bookmark
      location_from: selectedBookmark.location_from, // Extract from bookmark
      dropoff_lat: selectedBookmark.dropoff_lat, // Extract from bookmark
      dropoff_long: selectedBookmark.dropoff_long, // Extract from bookmark
      location_to: selectedBookmark.location_to, // Extract from bookmark
      vehicle_type: selectedBookmark.vahicle_type, // Extract from bookmark
      booking_time: formatDateToMySQL(new Date()), // Assuming immediate booking
      customer_message: null, // Optional field
    };

    console.log("Request data:", requestData);

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/request/add_request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData && responseData.request_id) {
        Alert.alert(
          "Request submitted successfully!",
          "",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate(
                  "ChooseOffer",
                  {
                    request_id: responseData.request_id,
                  },
                  setModalVisible(false)
                );
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        alert("Request submitted, but no request ID was returned.");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request. Please try again.");
    }
  };

  const openModal = () => {
    setModalVisible(true);
    fetchBookmarks();
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const onChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormattedDate(dayjs(selectedDate).format("DD/MM/YYYY HH:mm"));
    }
  };

  const handlePress = () => {
    setShowModal2(true);
  };

  const handleRequestSubmit = () => {
    setMoreDetail(preMoreDetail);
    setShowModal2(false);
    console.log(moreDetail);
  };

  const confirmDate = () => {
    setShowPicker(false);
    const formattedDate = dayjs(date)
    .add(543, 'year') // 
    .format(`DD/MM/YYYY HH:mm`);
  setFormattedDate(formattedDate);
  };

  const renderIOSDatePicker = () => {
    const { width } = Dimensions.get("window");
    const buttonWidth = width * 0.35;
    const responsiveHeight = height * 0.2;

    return (
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)} // Close modal when requested
      >
        <View
          style={[
            { height: height * 0.5 },
            tw`flex-1 justify-center items-center bg-[rgba(0,0,0,0.90)] `,
          ]}
        >
          <View
            style={[
              tw`flex p-4 rounded-lg `,
              { maxWidth: width * 0.9, height: height * 0.7 },
            ]}
          >
            {/* DateTimePicker */}
            <View
              style={[
                { height: responsiveHeight },
                tw`flex-row justify-center items-center`,
              ]}
            >
              <DateTimePicker
                mode="datetime"
                display="calendar"
                value={date}
                onChange={onChange}
                locale="th"
                style={[{ height: responsiveHeight }, tw`text-white`]}
                minimumDate={new Date()}
                maximumDate={new Date("2024-12-31")}
                textColor="white"
              />
            </View>

            {/* Buttons */}

            <View style={[tw`flex-row mt-4 gap-4 `]}>
              <TouchableOpacity
                onPress={() => {
                  setDate(new Date());
                }}
                style={[
                  tw`items-center top-80 border border-blue-500 py-2 rounded-full bg-white`,
                  { width: buttonWidth },
                ]}
              >
                <Text style={tw`text-blue-500 text-lg font-medium text-center`}>
                  ล้างข้อมูล
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDate}
                style={[
                  tw`items-center top-80 bg-blue-500 py-2 rounded-full`,
                  { width: buttonWidth },
                ]}
              >
                <Text style={tw`text-white text-lg font-semibold text-center`}>
                  ยืนยัน
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAndroidDatePicker = () => {
    return (
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View
          style={tw`flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]`}
        >
          <View style={tw`w-75 p-5 bg-white rounded-lg`}>
            <Text style={tw`text-center text-lg font-semibold mb-4`}>
              โปรดเลือกวันและเวลา
            </Text>

            {/* Button to Open Date Picker */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                onPressIn={() => setShowDatePicker(true)}
                style={tw`p-2 mb-4 bg-blue-500 rounded-lg text-center`}
                placeholder="Select Date"
                value={formattedDate}
                onChangeText={date}
                editable={false}
                underlineColor="transparent"
              />
            </TouchableOpacity>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="calendar"
                onChange={handleDateChange}
                minimumDate={new Date()} // Restricts selection to dates after this
                maximumDate={new Date("2024-12-31")} // Restricts selection to dates before this
              />
            )}

            {/* Button to Open Time Picker */}
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <TextInput
                onPressIn={() => setShowTimePicker(true)}
                style={tw`p-2 mb-4 bg-green-500 rounded-lg text-center`}
                placeholder="Select Time"
                value={formattedTime}
                onChangeText={time}
                editable={false}
                underlineColor="transparent"
              />
            </TouchableOpacity>

            {/* Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="clock"
                onChange={handleDateChange}
              />
            )}

            {/* Button to Close Modal */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={tw`mt-4 p-2 bg-red-500 rounded-lg`}
            >
              <Text style={tw`text-white text-center`}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormattedDate(formatDate(selectedDate));
      setFormattedTime(formatTime(selectedDate));
      console.log(date);
    }
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const route = useRoute();
  const origin = route.params?.origin || "โปรดระบุต้นทาง";
  const destination = route.params?.destination || "โปรดระบุปลายทาง";
  const confirmOrigin = route.params?.confirmOrigin;
  const confirmDestination = route.params?.confirmDestination;

  const formatDate = (rawDate) => {
    //     let date = new Date(rawDate);

    //     let year = date.getFullYear();
    //     let month = date.getMonth() + 1;
    //     let day = date.getDate();

    //     month = month < 10 ? "0" + month : month;
    //     day = day < 10 ? "0" + day : day;
    //     return `${day}-${month}-${year}`;
    let date = dayjs(rawDate);
    let thaiYear = date.year() + 543;
    return date.format(`D MMMM ${thaiYear}`);
  };

  const formatTime = (rawDate) => {
    return dayjs(rawDate).format("HH:mm");
  };

  const categoryOptions = [
    { label: "Mini Slide Car", value: "mini" },
    { label: "Standard Slide Car", value: "standard" },
    { label: "Heavy Duty Slide Car", value: "heavy" },
    { label: "Special Slide Car", value: "special" },
  ];

  const selectCategory = (label) => {
    setCategory(label);
    setMenuVisible(false); // Close the menu after selecting a category
  };

  const formatDateToMySQL = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  const handleSubmitRequest = async () => {
    // Validation logic
    if (!confirmOrigin || !confirmDestination || !category) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!origin || !destination || !category) {
      alert(
        "Please fill in all mandatory fields: Pickup Location, Dropoff Location, and Vehicle Type."
      );
      return;
    }

    // Construct the request data object
    const requestData = {
      customer_id: userId, // Replace with the appropriate customer ID
      request_time: formatDateToMySQL(new Date()), // Replace with actual selection
      pickup_lat: origin.latitude, // Replace with actual latitude
      pickup_long: origin.longitude, // Replace with actual longitude
      location_from: confirmOrigin,
      dropoff_lat: destination.latitude, // Replace with actual latitude
      dropoff_long: destination.longitude, // Replace with actual longitude
      location_to: confirmDestination,
      vehicletype_id: 1,
      booking_time: formattedDate
        ? formatDateToMySQL(date)
        : formatDateToMySQL(new Date()), // Assuming formattedDate is used for booking time
      customer_message: moreDetail || null, // Include the optional field if provided
    };

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:4000/request/add_request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData && responseData.request_id) {
        Alert.alert(
          "คุณได้ส่งคําร้องเรียบร้อยแล้ว",
          "",
          [
            {
              text: "ตกลง",
              onPress: () => {
                navigation.navigate("ChooseOffer", {
                  request_id: responseData.request_id,
                  customer_id_request: responseData.customer_id, //add by night
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        alert("คำร้องส่งไม่สําเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request. Please try again.");
    }
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };
  

  return (
    <PaperProvider>
      <View style={tw`flex-1 items-center`}>
        <HeaderWithBackButton
        showBackButton={true}
        title="กรอกข้อมูลการให้บริการ"
        onPress={() => navigation.goBack()}
      />
        <View style={tw`flex-1 mt-2`}>
      <Text style={[styles.globalText, tw`text-sm ml-4 text-gray-500`]}>คุณต้องการให้ไปส่งที่ไหน?</Text>
      <TouchableOpacity
        style={[
          { width: responsiveWidth, height: height * 0.11 },
          tw`p-2 mb-4 mt-1 justify-around bg-white rounded-lg border border-gray-300 shadow-xl `,
        ]}
        onPress={() => navigation.navigate("Mapdetail")}
      >
        {/* Origin Row */}
        <View style={[tw`flex-row px-4 items-center`]}>
          <MaterialIcons name="place" size={24} color="red" />
          <Text style={[styles.globalText, tw`text-black ml-2`]}>ต้นทาง </Text>
          <Text style={[styles.globalText, tw`text-gray-500 ml-1`]}
          >
            {truncateText(confirmOrigin) || "โปรดระบุต้นทาง"}
          </Text>
        </View>

        {/* Divider Line */}
        <View style={tw`border-t border-gray-300 my-2`} />

        {/* Destination Row */}
        <View style={[tw`flex-row px-4 items-center`]}>
          <MaterialIcons name="place" size={24} color="green" />
          <Text style={[styles.globalText, tw`text-black ml-2`]}>ปลายทาง </Text>
          <Text style={[styles.globalText, tw`text-gray-500 ml-1`]}>
            {truncateText(confirmDestination) || "โปรดระบุปลายทาง"}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={tw`flex items-center justify-center`}>
  <TouchableOpacity
    onPress={() =>
      Platform.OS === "ios" ? setShowPicker(true) : setShowModal(true)
    }
    style={[
      { width: responsiveWidth, height: height * 0.13 },
      tw`flex-col items-center bg-white p-4 rounded-lg border border-gray-300`,
    ]}
  >
    {/* Icon */}
    <MaterialIcons
      name="date-range"
      size={35}
      color="#60B876"
      style={tw`mb-2`} // Adds spacing below the icon
    />

    {/* Text */}
    <Text
      style={[
        styles.globalText,
        tw`text-gray-700 text-lg text-center`, // Center-align the text
      ]}
    >
      {formattedDate === ""
        ? "โปรดระบุวันเวลาที่ต้องการ"
        : `${formattedDate}`}
    </Text>
  </TouchableOpacity>
</View>


          {Platform.OS === "ios" && showPicker && renderIOSDatePicker()}
          {Platform.OS === "android" && renderAndroidDatePicker()}

          <View style={[tw`w-full items-center mt-4`]}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              mode="elevated"
              anchor={
                <TouchableOpacity
                  onPress={() => setMenuVisible(true)}
                  style={[
                    { width: responsiveWidth, height: height * 0.13 },
                    tw`flex-col items-center justify-center bg-white p-4 rounded-lg border border-gray-300 shadow-xl mb-4`,
                  ]}
                >
                  <FontAwesome5
                    name="car"
                    size={30}
                    color="black"
                    style={tw`mb-2`}
                  />
                  <Text style={[styles.globalText, tw`text-lg text-gray-700`]}>
                    {category ? category : "เลือกประเภทรถสไลด์"}
                  </Text>
                </TouchableOpacity>
              }
              style={tw`w-70 rounded items-center`}
            >
              {categoryOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => selectCategory(option.label)}
                  title={option.label}
                  style={tw`bg-white`}
                />
              ))}
            </Menu>
          </View>

          <View>
          <TouchableOpacity
            style={[
              { width: responsiveWidth, height: height * 0.14 },
              tw`flex-row items-center bg-white rounded-lg border border-gray-300 h-13 shadow-xl p-4`,
            ]}
            onPress={handlePress}
          >
            {/* Icon */}
            <MaterialIcons
              name="message"
              size={24}
              color="#60B876" // Delivery app green
              style={tw`mr-3`} // Adds spacing to the right of the icon
            />

            {/* Text */}
            <Text
              style={[
                styles.globalText,
                tw`flex-1 text-gray-600 text-sm text-left`, // Adjusted for proper alignment
              ]}
            >
              {moreDetail ? moreDetail : "ข้อความถึงคนขับ..."}
            </Text>
          </TouchableOpacity>


            <Modal
              transparent={true}
              visible={showModal2}
              animationType="fade"
              onRequestClose={() => setShowModal2(false)}
            >
              <View
                style={tw`flex-1 justify-center items-center bg-black bg-opacity-50 `}
              >
                <View style={tw`w-80 p-4 bg-white rounded-lg `}>
                  <TextInput
                    style={[
                      styles.globalText,
                      tw`p-2 mb-4 bg-white rounded-lg border border-gray-300 h-40 shadow-lg`,
                    ]}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    mode="outlined"
                    value={preMoreDetail}
                    onChangeText={setPreMoreDetail}
                    underlineColor="transparent"
                    multiline={true}
                    textAlignVertical="top"
                    maxLength={255}
                  />
                  <View style={tw`flex-row justify-center gap-5`}>
                    <TouchableOpacity
                      title="Close"
                      onPress={() =>
                        preMoreDetail
                          ? setPreMoreDetail("")
                          : setShowModal2(false)
                      }
                      style={tw`bg-red-500 rounded-lg w-25 py-2`}
                    >
                      <Text style={[styles.globalText,tw`text-white text-center`]}>{preMoreDetail ? "ล้างข้อมูล" : "ปิด"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      title="Submit"
                      onPress={handleRequestSubmit}
                      style={tw`bg-[#60B876] rounded-lg w-25 py-2`}
                    >
                      <Text style={[styles.globalText,tw`text-white text-center`]}>ยันยัน</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </View>
      <SubmitButton
        onPress={handleSubmitRequest}
        title="ยืนยัน"
      />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 4, backgroundColor: "#F2FFF3" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", marginLeft: 10 },
  subtitle: { fontSize: 14, color: "gray" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  datePicker: {
    height: 40,
    flex: 1,
  },
  globalText: {
    fontFamily: "Mitr-Regular",
  },

  optionText: { marginLeft: 10, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
