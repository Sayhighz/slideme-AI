import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS, MESSAGES } from '../../constants';

const LogoutConfirmation = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={tw`flex-1 bg-black/50 justify-center items-center`}>
        <View style={tw`w-4/5 bg-white rounded-lg p-5`}>
          <Text 
            style={[
              tw`text-lg mb-4 text-center`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ยืนยันการออกจากระบบ
          </Text>
          <Text 
            style={[
              tw`text-base mb-6 text-center text-gray-600`,
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {MESSAGES.CONFIRM.LOGOUT}
          </Text>
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-300 rounded-md py-2 mr-2 items-center`}
              onPress={onCancel}
            >
              <Text 
                style={[
                  tw`text-base text-black`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ยกเลิก
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-red-500 rounded-md py-2 ml-2 items-center`}
              onPress={onConfirm}
            >
              <Text 
                style={[
                  tw`text-base text-white`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                ออกจากระบบ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmation;