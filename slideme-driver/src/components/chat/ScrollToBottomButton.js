import React from 'react';
import { TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { COLORS } from '../../constants';

/**
 * ScrollToBottomButton Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the button is visible
 * @param {Function} props.onPress - Function to scroll to the bottom
 */
const ScrollToBottomButton = ({ visible, onPress }) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        tw`absolute bottom-20 right-4 z-10`,
        styles.container
      ]}
    >
      <TouchableOpacity
        style={[
          tw`p-3 rounded-full items-center justify-center`,
          styles.button
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon name="chevron-down" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  button: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.GRAY_700,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  }
});

export default ScrollToBottomButton;