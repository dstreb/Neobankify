import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../types/navigation';
import { OnboardingWelcomeScreen } from '../screens/onboarding/OnboardingWelcomeScreen';
import { ConnectBankScreen } from '../screens/onboarding/ConnectBankScreen';
import { SetGoalsScreen } from '../screens/onboarding/SetGoalsScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="OnboardingWelcome"
    >
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="ConnectBank" component={ConnectBankScreen} />
      <Stack.Screen name="SetGoals" component={SetGoalsScreen} />
    </Stack.Navigator>
  );
}
