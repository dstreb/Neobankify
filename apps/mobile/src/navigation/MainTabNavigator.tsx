import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { MainTabParamList } from '../types/navigation';
import { HomeNavigator } from './HomeNavigator';
import { PaymentsNavigator } from './PaymentsNavigator';
import { CardsNavigator } from './CardsNavigator';
import { AINavigator } from './AINavigator';
import { ProfileNavigator } from './ProfileNavigator';

// =====================================================
// Main Tab Navigator - swiftbank 5-tab pattern
// Home | Payments | Card | AI | Profile
// =====================================================

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Payments: { focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  Card: { focused: 'card', unfocused: 'card-outline' },
  AI: { focused: 'sparkles', unfocused: 'sparkles-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

export function MainTabNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = TAB_ICONS[route.name];
          const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
          fontFamily: 'Inter',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Payments" component={PaymentsNavigator} />
      <Tab.Screen name="Card" component={CardsNavigator} />
      <Tab.Screen name="AI" component={AINavigator} options={{ tabBarLabel: 'AI' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
