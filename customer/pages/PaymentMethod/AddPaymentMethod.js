import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import tw from "twrnc";
import { IP_ADDRESS } from "../../config";
import { UserContext } from "../../UserContext";
import { useNavigation } from "@react-navigation/native";

const AddMethod = ({ route }) => {
  const { onRefresh } = route.params || {};
  const { userData } = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);

  const [methodName, setMethodName] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const navigation = useNavigation();

  const paymentOptions = [
    { label: "Visa", value: "Visa" },
    { label: "Mastercard", value: "Mastercard" },
    { label: "PayPal", value: "PayPal" },
    { label: "Bank Transfer", value: "Bank Transfer" },
  ];

  const handleExpirationDateChange = (input) => {
    let formattedInput = input.replace(/\D/g, "");
    if (formattedInput.length > 2) {
      formattedInput = `${formattedInput.slice(0, 2)}/${formattedInput.slice(2)}`;
    }
    setCardExpiry(formattedInput);
  };

  const handleSubmit = async () => {
    if (!methodName || !cardholderName || !cardNumber || !cardExpiry || !cardCvv) {
      Alert.alert("Error", "โปรดกรอกข้อมูลให้ครบ");
      return;
    }

    const payload = {
      customer_id: userData.customer_id,
      method_name: methodName,
      card_number: cardNumber,
      card_expiry: cardExpiry,
      card_cvv: cardCvv,
      cardholder_name: cardholderName,
      is_default: 0, // ค่าเริ่มต้นไม่ใช่บัตรหลัก
    };

    try {
      const response = await fetch(`http://${IP_ADDRESS}:4000/payment/payment-method/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "บันทึกช่องทางการชำระเงินสำเร็จ");
        if (onRefresh) onRefresh();
        navigation.goBack();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.Error || "บันทึกช่องทางการชำระเงินไม่สำเร็จ");
      }
    } catch (error) {
      Alert.alert("Error", "เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const renderPaymentOption = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setMethodName(item.value);
        setModalVisible(false);
      }}
      style={tw`p-4 border-b border-gray-200`}
    >
      <Text style={[tw`text-lg`, styles.customFont]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={tw`flex-1 p-5 bg-gray-100 mt-17`}>
      <Text style={[tw`text-2xl mb-5`, styles.customFont]}>เพิ่มช่องทางการชำระเงิน</Text>

      <Text style={[tw`text-lg mt-2`, styles.customFont]}>ประเภท</Text>
      <TouchableOpacity
        style={tw`border border-gray-300 rounded mt-1 p-3 flex-row justify-between items-center`}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[tw`text-lg`, styles.customFont]}>
          {methodName ? paymentOptions.find((opt) => opt.value === methodName)?.label : "เลือกประเภทการชำระเงิน"}
        </Text>
        <Icon name="chevron-down" size={16} />
      </TouchableOpacity>

      <Text style={[tw`text-lg mt-4`, styles.customFont]}>ชื่อผู้ถือบัตร</Text>
      <TextInput
        style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
        placeholder="ชื่อผู้ถือบัตร"
        value={cardholderName}
        onChangeText={setCardholderName}
        placeholderTextColor="#9CA3AF"
      />

      <Text style={[tw`text-lg mt-4`, styles.customFont]}>หมายเลขบัตร</Text>
      <TextInput
        style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
        placeholder="หมายเลขบัตร"
        keyboardType="numeric"
        maxLength={16}
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholderTextColor="#9CA3AF"
      />

      <Text style={[tw`text-lg mt-4`, styles.customFont]}>วันหมดอายุ</Text>
      <TextInput
        style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
        placeholder="MM/YYYY"
        value={cardExpiry}
        onChangeText={handleExpirationDateChange}
        maxLength={7}
        keyboardType="numeric"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={[tw`text-lg mt-4`, styles.customFont]}>CVV</Text>
      <TextInput
        style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
        placeholder="CVV"
        keyboardType="numeric"
        maxLength={3}
        value={cardCvv}
        onChangeText={setCardCvv}
        placeholderTextColor="#9CA3AF"
        secureTextEntry
      />

      <TouchableOpacity
        style={tw`bg-green-600 p-3 rounded mt-5`}
        onPress={handleSubmit}
      >
        <Text style={[tw`text-white text-center text-lg`, styles.customFont]}>บันทึก</Text>
      </TouchableOpacity>

      {/* Modal for selecting payment type */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white rounded-lg w-10/12`}>
            <FlatList
              data={paymentOptions}
              renderItem={renderPaymentOption}
              keyExtractor={(item) => item.value}
            />
            <TouchableOpacity
              style={tw`p-4 bg-gray-300 rounded-b-lg`}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[tw`text-center text-lg`, styles.customFont]}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  customFont: {
    fontFamily: "Mitr-Regular",
  },
  input: {
    fontFamily: "Mitr-Regular",
    height: Platform.select({ ios: 40, android: 50 }),
    color: "#000",
  },
});

export default AddMethod;
