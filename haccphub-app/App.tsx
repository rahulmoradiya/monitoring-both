/**
 * Rahul App - Simple React Native App
 * Displays the name "RAHUL"
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MonitoringHome from './screens/MonitoringHome';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MonitoringHome" component={MonitoringHome} options={{ title: 'Monitoring Home' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
