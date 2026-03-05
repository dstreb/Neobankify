import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OffersStackParamList } from '../types/navigation';
import { OffersTabScreen } from '../screens/offers/OffersTabScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator<OffersStackParamList>();

export function OffersNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OffersHome" component={OffersTabScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
