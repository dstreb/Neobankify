import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { NotificationsListScreen } from '../screens/home/NotificationsListScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="NotificationsList" component={NotificationsListScreen} />
    </Stack.Navigator>
  );
}
