import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const StatusItem = ({ title, amount, icon }) => {
  return (
    <View style={styles.statusItem}>
      <Ionicons name={icon} size={60} color="#60B876" />
      <View style={styles.statusTextContainer}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusAmount}>{amount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginHorizontal: 20,
  },
  statusTextContainer: {
    marginLeft: 10,
  },
  statusTitle: {
    fontSize: 15,
    color: 'gray',
    fontFamily: 'Mitr-Medium',
  },
  statusAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#60B876',
    fontFamily: 'Mitr-Medium',
  },
});

export default StatusItem;
