import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterPersonalInfoScreen from '../screens/auth/RegisterPersonalInfoScreen';
import RegisterTrainingScreen from '../screens/auth/RegisterTrainingScreen';
import RegisterUploadScreen from '../screens/auth/RegisterUploadScreen';
import RegisterVerificationScreen from '../screens/auth/RegisterVerificationScreen';
import RegisterPasswordScreen from '../screens/auth/RegisterPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterPersonalInfo" component={RegisterPersonalInfoScreen} />
      <Stack.Screen name="RegisterTraining" component={RegisterTrainingScreen} />
      <Stack.Screen name="RegisterUpload" component={RegisterUploadScreen} />
      <Stack.Screen name="RegisterVerification" component={RegisterVerificationScreen} />
      <Stack.Screen name="RegisterPassword" component={RegisterPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;