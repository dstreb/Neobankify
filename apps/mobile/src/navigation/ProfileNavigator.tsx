import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/navigation';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SecurityScreen } from '../screens/profile/SecurityScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { LinkedAccountsScreen } from '../screens/profile/LinkedAccountsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="LinkedAccounts" component={LinkedAccountsScreen} />
    </Stack.Navigator>
  );
}
