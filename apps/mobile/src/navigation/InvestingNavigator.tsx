import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InvestingStackParamList } from '../types/navigation';
import { InvestingDashboardScreen } from '../screens/investing/InvestingDashboardScreen';
import { SuitabilityAssessmentScreen } from '../screens/investing/SuitabilityAssessmentScreen';
import { HoldingDetailScreen } from '../screens/investing/HoldingDetailScreen';
import { InvestingOrderScreen } from '../screens/investing/InvestingOrderScreen';
import { InvestingSettingsScreen } from '../screens/investing/InvestingSettingsScreen';

const Stack = createNativeStackNavigator<InvestingStackParamList>();

export function InvestingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InvestingDashboard" component={InvestingDashboardScreen} />
      <Stack.Screen name="SuitabilityAssessment" component={SuitabilityAssessmentScreen} />
      <Stack.Screen name="HoldingDetail" component={HoldingDetailScreen} />
      <Stack.Screen name="InvestingOrder" component={InvestingOrderScreen} />
      <Stack.Screen name="InvestingSettings" component={InvestingSettingsScreen} />
    </Stack.Navigator>
  );
}
