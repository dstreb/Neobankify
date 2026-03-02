import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isOnboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
