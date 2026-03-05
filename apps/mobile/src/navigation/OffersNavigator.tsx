import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OffersStackParamList } from '../types/navigation';
import { OffersTabScreen } from '../screens/offers/OffersTabScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
// Profile sub-screens
import { SecurityScreen } from '../screens/profile/SecurityScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { LinkedAccountsScreen } from '../screens/profile/LinkedAccountsScreen';
// Wealth screens accessible from Profile
import { RewardsSummaryScreen } from '../screens/rewards/RewardsSummaryScreen';
import { InvestingDashboardScreen } from '../screens/investing/InvestingDashboardScreen';
import { TradingDashboardScreen } from '../screens/trading/TradingDashboardScreen';
import { LendingDashboardScreen } from '../screens/lending/LendingDashboardScreen';
// Add Account flow
import { AddAccountScreen } from '../screens/accounts/AddAccountScreen';

const Stack = createNativeStackNavigator<OffersStackParamList>();

export function OffersNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OffersHome" component={OffersTabScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
      {/* Profile sub-screens */}
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="LinkedAccounts" component={LinkedAccountsScreen} />
      {/* Wealth screens */}
      <Stack.Screen name="RewardsSummary" component={RewardsSummaryScreen} />
      <Stack.Screen name="InvestingDashboard" component={InvestingDashboardScreen} />
      <Stack.Screen name="TradingDashboard" component={TradingDashboardScreen} />
      <Stack.Screen name="LendingDashboard" component={LendingDashboardScreen} />
    </Stack.Navigator>
  );
}
