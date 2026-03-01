import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RewardsStackParamList } from '../types/navigation';
import { RewardsSummaryScreen } from '../screens/rewards/RewardsSummaryScreen';
import { RewardsHistoryScreen } from '../screens/rewards/RewardsHistoryScreen';
import { OffersListScreen } from '../screens/rewards/OffersListScreen';
import { RecommendationDetailScreen } from '../screens/rewards/RecommendationDetailScreen';

const Stack = createNativeStackNavigator<RewardsStackParamList>();

export function RewardsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RewardsSummary" component={RewardsSummaryScreen} />
      <Stack.Screen name="RewardsHistory" component={RewardsHistoryScreen} />
      <Stack.Screen name="OffersList" component={OffersListScreen} />
      <Stack.Screen name="RecommendationDetail" component={RecommendationDetailScreen} />
    </Stack.Navigator>
  );
}
