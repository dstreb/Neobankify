import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LendingStackParamList } from '../types/navigation';
import { LendingDashboardScreen } from '../screens/lending/LendingDashboardScreen';
import { LoanApplicationScreen } from '../screens/lending/LoanApplicationScreen';
import { LoanDetailScreen } from '../screens/lending/LoanDetailScreen';
import { MakePaymentScreen } from '../screens/lending/MakePaymentScreen';

const Stack = createNativeStackNavigator<LendingStackParamList>();

export function LendingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LendingDashboard" component={LendingDashboardScreen} />
      <Stack.Screen name="LoanApplication" component={LoanApplicationScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen} />
    </Stack.Navigator>
  );
}
