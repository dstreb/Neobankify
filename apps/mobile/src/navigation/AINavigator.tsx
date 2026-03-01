import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AIStackParamList } from '../types/navigation';
import { AIChatScreen } from '../screens/ai/AIChatScreen';

// =====================================================
// AI Assistant Navigator
// =====================================================

const Stack = createNativeStackNavigator<AIStackParamList>();

export function AINavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIChat" component={AIChatScreen} />
    </Stack.Navigator>
  );
}
