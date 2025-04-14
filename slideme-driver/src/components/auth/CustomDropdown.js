import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Picker
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

/**
 * CustomDropdown - คอมโพเนนต์สำหรับการเลือกข้อมูลจากรายการ
 * @param {string} label - ชื่อฟิลด์
 * @param {Array} items - รายการข้อมูล [{label: string, value: string}]
 * @param {string} value - ค่าที่เลือก
 * @param {Function} onValueChange - ฟังก์ชันเมื่อมีการเปลี่ยนค่า
 * @param {Object} error - ข้อผิดพลาด
 * @param {string} placeholder - ข้อความที่แสดงเมื่อยังไม่ได้เลือกค่า
 */
const CustomDropdown = ({
  label,
  items = [],
  value,
  onValueChange,
  error,
  placeholder = 'เลือกรายการ'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // หาค่า label ที่จะแสดงจากค่า value ที่เลือก
  const getSelectedLabel = () => {
    const selected = items.find(item => item.value === value);
    return selected ? selected.label : placeholder;
  };

  // สำหรับ Android ใช้ Picker ของ React Native
  if (Platform.OS === 'android') {
    return (
      <View style={tw`mb-4`}>
        <Text
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.M,
            ...tw`text-gray-700 mb-1`,
          }}
        >
          {label}
        </Text>
        
        <View 
          style={[
            tw`border-2 rounded-lg overflow-hidden`,
            error ? tw`border-red-500` : tw`border-gray-300`,
          ]}
        >
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            mode="dropdown"
            style={styles.androidPicker}
          >
            <Picker.Item label={placeholder} value="" color="#999" />
            {items.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
        
        {error && (
          <Text 
            style={{
              fontFamily: FONTS.FAMILY.REGULAR,
              fontSize: FONTS.SIZE.S,
              ...tw`text-red-500 mt-1`,
            }}
          >
            {error.message}
          </Text>
        )}
      </View>
    );
  }

  // สำหรับ iOS ใช้ Modal กับ TouchableOpacity
  return (
    <View style={tw`mb-4`}>
      <Text
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          fontSize: FONTS.SIZE.M,
          ...tw`text-gray-700 mb-1`,
        }}
      >
        {label}
      </Text>
      
      <TouchableOpacity
        style={[
          tw`border-2 rounded-lg flex-row items-center justify-between px-4 py-3`,
          error ? tw`border-red-500` : tw`border-gray-300`,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: 16,
            color: value ? '#333' : '#999',
          }}
        >
          {getSelectedLabel()}
        </Text>
        <Icon name="chevron-down" size={24} color="#666" />
      </TouchableOpacity>
      
      {error && (
        <Text 
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            fontSize: FONTS.SIZE.S,
            ...tw`text-red-500 mt-1`,
          }}
        >
          {error.message}
        </Text>
      )}
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Icon name="check" size={20} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  androidPicker: {
    height: 50,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    fontSize: 18,
    color: '#333',
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#f8f8f8',
  },
  optionText: {
    fontFamily: FONTS.FAMILY.REGULAR,
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    color: COLORS.PRIMARY,
  },
});

export default CustomDropdown;