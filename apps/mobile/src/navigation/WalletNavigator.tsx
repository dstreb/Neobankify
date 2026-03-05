import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { WalletStackParamList } from '../types/navigation';
import { WalletScreen } from '../screens/wallet/WalletScreen';
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

const Stack = createNativeStackNavigator<WalletStackParamList>();

export function WalletNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletHome" component={WalletScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
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
