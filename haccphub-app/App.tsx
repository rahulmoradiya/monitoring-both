/**
 * Rahul App - Simple React Native App
 * Displays the name "RAHUL"
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneLogin from './screens/PhoneLogin';
import MonitoringHome from './screens/MonitoringHome';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PhoneLogin">
        <Stack.Screen name="PhoneLogin" component={PhoneLogin} options={{ headerShown: false }} />
        <Stack.Screen name="MonitoringHome" component={MonitoringHome} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
