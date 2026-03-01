import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TransactionsStackParamList } from '../types/navigation';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { TransactionDetailScreen } from '../screens/transactions/TransactionDetailScreen';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionList" component={TransactionListScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}
