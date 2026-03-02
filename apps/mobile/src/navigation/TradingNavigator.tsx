import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TradingStackParamList } from '../types/navigation';
import { TradingDashboardScreen } from '../screens/trading/TradingDashboardScreen';
import { TradeOrderScreen } from '../screens/trading/TradeOrderScreen';
import { AISignalsScreen } from '../screens/trading/AISignalsScreen';
import { PaperTradingScreen } from '../screens/trading/PaperTradingScreen';

const Stack = createNativeStackNavigator<TradingStackParamList>();

export function TradingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TradingDashboard" component={TradingDashboardScreen} />
      <Stack.Screen name="TradeOrder" component={TradeOrderScreen} />
      <Stack.Screen name="AISignals" component={AISignalsScreen} />
      <Stack.Screen name="PaperTrading" component={PaperTradingScreen} />
    </Stack.Navigator>
  );
}
