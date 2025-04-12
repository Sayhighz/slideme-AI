import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

const HistoryFilterModal = ({ visible, onClose, onSelect, selectedFilter }) => {
  const filters = [
    { id: 'all', label: 'ทั้งหมด', icon: 'view-list' },
    { id: 'completed', label: 'เสร็จสิ้น', icon: 'check-circle', color: COLORS.SUCCESS },
    { id: 'cancelled', label: 'ยกเลิก', icon: 'close-circle', color: COLORS.DANGER }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
        <View style={tw`bg-white rounded-t-3xl`}>
          {/* Header */}
          <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
            <Text 
              style={[
                tw`text-xl text-gray-800`,
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}
            >
              กรองตามสถานะ
            </Text>
            <TouchableOpacity 
              style={tw`h-10 w-10 rounded-full bg-gray-100 items-center justify-center`} 
              onPress={onClose}
            >
              <Icon name="close" size={24} color={COLORS.GRAY_700} />
            </TouchableOpacity>
          </View>
          
          {/* Filter options */}
          <View style={tw`px-6 pb-6`}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={tw`
                  flex-row items-center p-4 mb-3 
                  ${selectedFilter === filter.id ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'} 
                  rounded-xl
                `}
                onPress={() => onSelect(filter.id)}
              >
                <View 
                  style={tw`
                    h-12 w-12 rounded-full items-center justify-center mr-4
                    ${selectedFilter === filter.id ? 'bg-green-200' : 'bg-gray-200'}
                  `}
                >
                  <Icon 
                    name={filter.icon} 
                    size={24} 
                    color={
                      selectedFilter === filter.id ? 
                        COLORS.PRIMARY : 
                        filter.color || COLORS.GRAY_600
                    } 
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text 
                    style={[
                      tw`text-base`,
                      { 
                        fontFamily: FONTS.FAMILY.MEDIUM,
                        color: selectedFilter === filter.id ? COLORS.PRIMARY : COLORS.GRAY_700 
                      }
                    ]}
                  >
                    {filter.label}
                  </Text>
                  <Text 
                    style={[
                      tw`text-xs text-gray-500`,
                      { fontFamily: FONTS.FAMILY.REGULAR }
                    ]}
                  >
                    {filter.id === 'all' ? 'แสดงงานทั้งหมด' : 
                     filter.id === 'completed' ? 'แสดงเฉพาะงานที่เสร็จสิ้น' : 
                     'แสดงเฉพาะงานที่ถูกยกเลิก'}
                  </Text>
                </View>
                {selectedFilter === filter.id && (
                  <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Action buttons */}
          <View style={tw`flex-row p-4 border-t border-gray-200`}>
            <TouchableOpacity 
              style={tw`flex-1 bg-gray-200 p-4 rounded-xl mr-2 items-center`}
              onPress={onClose}
            >
              <Text 
                style={[
                  tw`text-gray-800`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                ยกเลิก
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={tw`flex-1 bg-[${COLORS.PRIMARY}] p-4 rounded-xl ml-2 items-center`}
              onPress={() => {
                if (selectedFilter) {
                  onSelect(selectedFilter);
                } else {
                  onSelect('all');
                }
              }}
            >
              <Text 
                style={[
                  tw`text-white`,
                  { fontFamily: FONTS.FAMILY.MEDIUM }
                ]}
              >
                กรอง
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default HistoryFilterModal;