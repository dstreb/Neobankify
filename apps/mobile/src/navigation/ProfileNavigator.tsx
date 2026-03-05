import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/navigation';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SecurityScreen } from '../screens/profile/SecurityScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { LinkedAccountsScreen } from '../screens/profile/LinkedAccountsScreen';
// Sub-feature screens accessible from Profile
import { RewardsSummaryScreen } from '../screens/rewards/RewardsSummaryScreen';
import { RewardsHistoryScreen } from '../screens/rewards/RewardsHistoryScreen';
import { OffersListScreen } from '../screens/rewards/OffersListScreen';
import { RecommendationDetailScreen } from '../screens/rewards/RecommendationDetailScreen';
import { InvestingDashboardScreen } from '../screens/investing/InvestingDashboardScreen';
import { TradingDashboardScreen } from '../screens/trading/TradingDashboardScreen';
import { LendingDashboardScreen } from '../screens/lending/LendingDashboardScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="LinkedAccounts" component={LinkedAccountsScreen} />
      {/* Wealth & Features */}
      <Stack.Screen name="RewardsSummary" component={RewardsSummaryScreen} />
      <Stack.Screen name="RewardsHistory" component={RewardsHistoryScreen} />
      <Stack.Screen name="OffersList" component={OffersListScreen} />
      <Stack.Screen name="RecommendationDetail" component={RecommendationDetailScreen} />
      <Stack.Screen name="InvestingDashboard" component={InvestingDashboardScreen} />
      <Stack.Screen name="TradingDashboard" component={TradingDashboardScreen} />
      <Stack.Screen name="LendingDashboard" component={LendingDashboardScreen} />
    </Stack.Navigator>
  );
}
