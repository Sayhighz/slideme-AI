// CustomText.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';

const customText = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Mitr-Regular', // Ensure this matches your loaded font
  },
});

export default customText;
