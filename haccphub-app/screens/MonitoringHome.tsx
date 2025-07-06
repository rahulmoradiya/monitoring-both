import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserMonitoring from './UserMonitoring';
import UserTasks from './UserTasks';
import UserProfile from './UserProfile';

const Tab = createBottomTabNavigator();

export default function MonitoringHome() {
  return (
    <Tab.Navigator initialRouteName="Monitoring">
      <Tab.Screen name="Monitoring" component={UserMonitoring} options={{ title: 'Monitoring' }} />
      <Tab.Screen name="Tasks" component={UserTasks} options={{ title: 'Tasks' }} />
      <Tab.Screen name="Profile" component={UserProfile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
} 