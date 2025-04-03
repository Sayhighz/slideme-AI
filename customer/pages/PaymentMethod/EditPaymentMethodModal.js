import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import tw from "twrnc";
import { IP_ADDRESS } from "../../config";

const EditPaymentMethodModal = ({
  visible,
  onClose,
  onSave,
  accountName,
  setAccountName,
  accountNumber,
  setAccountNumber,
  paymentType,
  setPaymentType,
  expirationDate,
  setExpirationDate,
  paymentMethodId,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const paymentOptions = [
    { label: "บัตรเครดิต", value: "credit_card", icon: "credit-card" },
    { label: "บัตรเดบิต", value: "debit_card", icon: "credit-card" },
  ];

  const handleExpirationDateChange = (input) => {
    let formattedInput = input.replace(/\D/g, "");
    if (formattedInput.length > 2) {
      formattedInput = `${formattedInput.slice(0, 2)}/${formattedInput.slice(
        2
      )}`;
    }
    setExpirationDate(formattedInput);
  };

  const handleSave = async () => {
    if (!paymentType || !accountName || !accountNumber || !expirationDate) {
      Alert.alert("Error", "โปรดกรอกข้อมูลให้ครบ");
      return;
    }

    setIsSaving(true);
    const payload = {
      payment_type: paymentType,
      card_number: accountNumber,
      account_name: accountName,
      expiration_date: expirationDate,
      payment_method_id: Number(paymentMethodId),
    };

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/auth/update_payment_method`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "แก้ไขช่องทางการชำระเงินสําเร็จ");
        onSave();
        onClose();
      } else {
        Alert.alert("Error", "แก้ไขช่องทางการชำระเงินไม่สําเร็จ");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณต้องการลบช่องทางการชำระเงินใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ใช่",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://${IP_ADDRESS}:3000/auth/disable_payment_method`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    payment_method_id: Number(paymentMethodId),
                  }),
                }
              );

              if (response.ok) {
                Alert.alert("Success", "ลบช่องทางการชำระเงินสําเร็จ");
                onSave();
                onClose();
              } else {
                Alert.alert("Error", "ลบช่องทางการชำระเงินไม่สําเร็จ");
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred: " + error.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderDropdownItem = ({ item }) => (
    <TouchableOpacity
      style={tw`p-3 flex-row items-center border-b border-gray-300`}
      onPress={() => {
        setPaymentType(item.value);
        setDropdownVisible(false);
      }}
    >
      <Icon name={item.icon} size={20} color="#007bff" style={tw`mr-3`} />
      <Text style={[tw`text-lg`, styles.customFont]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={tw`flex-1 justify-center items-center bg-gray-800 bg-opacity-50`}
      >
        <View style={tw`w-11/12 bg-white p-5 rounded`}>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={[tw`flex-row items-center p-2 mt-[-1.30rem] rounded`]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Icon name="arrow-left" size={16} color="black" />
            </TouchableOpacity>
            <Text style={[tw`text-2xl mb-5`, styles.customFont]}>
              แก้ไขช่องทางการชำระเงิน
            </Text>
            <View />
          </View>

          <Text style={[tw`text-lg mt-2`, styles.customFont]}>ประเภท</Text>
          <TouchableOpacity
            style={tw`border border-gray-300 rounded mt-1 p-3 flex-row justify-between items-center`}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={[tw`text-lg`, styles.customFont]}>
              {paymentOptions.find((opt) => opt.value === paymentType)?.label ||
                "เลือกประเภทการชำระเงิน"}
            </Text>
            <Icon name="chevron-down" size={16} />
          </TouchableOpacity>

          {dropdownVisible && (
            <Modal transparent={true} animationType="fade">
              <View
                style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
              >
                <View style={tw`w-10/12 bg-white rounded-lg`}>
                  <FlatList
                    data={paymentOptions}
                    renderItem={renderDropdownItem}
                    keyExtractor={(item) => item.value}
                  />
                  <TouchableOpacity
                    style={tw`p-4 bg-gray-300 rounded-b-lg`}
                    onPress={() => setDropdownVisible(false)}
                  >
                    <Text style={[tw`text-center text-lg`, styles.customFont]}>
                      ปิด
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          <Text style={[tw`text-lg mt-4`, styles.customFont]}>ชื่อบัญชี</Text>
          <TextInput
            style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
            placeholder="ชื่อบัญชี"
            value={accountName}
            onChangeText={setAccountName}
          />

          <Text style={[tw`text-lg mt-4`, styles.customFont]}>
            หมายเลขบัญชี
          </Text>
          <TextInput
            style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
            placeholder="เลขบัญชี"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={setAccountNumber}
            maxLength={4}
          />

          <Text style={[tw`text-lg mt-4`, styles.customFont]}>วันหมดอายุ</Text>
          <TextInput
            style={[tw`border border-gray-300 p-2 rounded mt-1`, styles.input]}
            placeholder="MM/YY"
            value={expirationDate}
            onChangeText={handleExpirationDateChange}
            maxLength={5}
            keyboardType="numeric"
          />

          <View style={tw`flex-row justify-between mt-5`}>
            <TouchableOpacity
              style={[
                tw`flex-row items-center p-2 rounded bg-red-600`,
                styles.button,
              ]}
              onPress={handleDelete}
              disabled={isSaving}
            >
              <Icon name="trash" size={16} color="white" style={tw`mr-2`} />
              <Text style={[styles.customFont, tw`text-white text-lg`]}>
                ปิดการใช้งาน
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw`flex-row items-center p-2 rounded bg-green-600`,
                styles.button,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="save" size={16} color="white" style={tw`mr-2`} />
                  <Text style={[styles.customFont, tw`text-white text-lg`]}>
                    บันทึก
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  customFont: {
    fontFamily: "Mitr-Regular",
  },
  input: {
    fontFamily: "Mitr-Regular",
    color: "#000",
  },
  button: {
    minWidth: 80,
    marginHorizontal: 5,
    paddingHorizontal: 8,
  },
});

export default EditPaymentMethodModal;
