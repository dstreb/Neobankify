import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { NotificationsListScreen } from '../screens/home/NotificationsListScreen';
// Rewards sub-feature screens
import { RewardsSummaryScreen } from '../screens/rewards/RewardsSummaryScreen';
import { RewardsHistoryScreen } from '../screens/rewards/RewardsHistoryScreen';
import { OffersListScreen } from '../screens/rewards/OffersListScreen';
import { RecommendationDetailScreen } from '../screens/rewards/RecommendationDetailScreen';
// Investing sub-feature screens
import { InvestingDashboardScreen } from '../screens/investing/InvestingDashboardScreen';
import { SuitabilityAssessmentScreen } from '../screens/investing/SuitabilityAssessmentScreen';
import { HoldingDetailScreen } from '../screens/investing/HoldingDetailScreen';
import { InvestingOrderScreen } from '../screens/investing/InvestingOrderScreen';
import { InvestingSettingsScreen } from '../screens/investing/InvestingSettingsScreen';
// Trading sub-feature screens
import { TradingDashboardScreen } from '../screens/trading/TradingDashboardScreen';
import { TradeOrderScreen } from '../screens/trading/TradeOrderScreen';
import { PositionDetailScreen } from '../screens/trading/PositionDetailScreen';
import { AISignalsScreen } from '../screens/trading/AISignalsScreen';
import { PaperTradingScreen } from '../screens/trading/PaperTradingScreen';
// Lending sub-feature screens
import { LendingDashboardScreen } from '../screens/lending/LendingDashboardScreen';
import { LoanApplicationScreen } from '../screens/lending/LoanApplicationScreen';
import { LoanDetailScreen } from '../screens/lending/LoanDetailScreen';
import { MakePaymentScreen } from '../screens/lending/MakePaymentScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="NotificationsList" component={NotificationsListScreen} />
      {/* Rewards */}
      <Stack.Screen name="RewardsSummary" component={RewardsSummaryScreen} />
      <Stack.Screen name="RewardsHistory" component={RewardsHistoryScreen} />
      <Stack.Screen name="OffersList" component={OffersListScreen} />
      <Stack.Screen name="RecommendationDetail" component={RecommendationDetailScreen} />
      {/* Investing */}
      <Stack.Screen name="InvestingDashboard" component={InvestingDashboardScreen} />
      <Stack.Screen name="SuitabilityAssessment" component={SuitabilityAssessmentScreen} />
      <Stack.Screen name="HoldingDetail" component={HoldingDetailScreen} />
      <Stack.Screen name="InvestingOrder" component={InvestingOrderScreen} />
      <Stack.Screen name="InvestingSettings" component={InvestingSettingsScreen} />
      {/* Trading */}
      <Stack.Screen name="TradingDashboard" component={TradingDashboardScreen} />
      <Stack.Screen name="TradeOrder" component={TradeOrderScreen} />
      <Stack.Screen name="PositionDetail" component={PositionDetailScreen} />
      <Stack.Screen name="AISignals" component={AISignalsScreen} />
      <Stack.Screen name="PaperTrading" component={PaperTradingScreen} />
      {/* Lending */}
      <Stack.Screen name="LendingDashboard" component={LendingDashboardScreen} />
      <Stack.Screen name="LoanApplication" component={LoanApplicationScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen} />
    </Stack.Navigator>
  );
}
