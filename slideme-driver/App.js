import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { styles } from './src/styles/common';

export default function App() {
  // โหลดฟอนต์
  const [fontsLoaded] = useFonts({
    'Mitr-Regular': require('./src/assets/fonts/Mitr-Regular.ttf'),
    'Mitr-Bold': require('./src/assets/fonts/Mitr-Bold.ttf'),
    'Mitr-Light': require('./src/assets/fonts/Mitr-Light.ttf'),
    'Mitr-ExtraLight': require('./src/assets/fonts/Mitr-ExtraLight.ttf'),
    'Mitr-Medium': require('./src/assets/fonts/Mitr-Medium.ttf'),
    'Mitr-SemiBold': require('./src/assets/fonts/Mitr-SemiBold.ttf')
  });

  // แสดง loading screen ระหว่างโหลดฟอนต์
  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#60B876" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}