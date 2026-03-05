import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { MainTabParamList } from '../types/navigation';
import { HomeNavigator } from './HomeNavigator';
import { OffersNavigator } from './OffersNavigator';
import { AINavigator } from './AINavigator';
import { WalletNavigator } from './WalletNavigator';
import { HistoryNavigator } from './HistoryNavigator';

// =====================================================
// Main Tab Navigator - swiftbank 5-tab pattern
// Home | Offers | AI | Wallet | History
// =====================================================

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Offers: { focused: 'pricetag', unfocused: 'pricetag-outline' },
  AI: { focused: 'sparkles', unfocused: 'sparkles-outline' },
  Wallet: { focused: 'wallet', unfocused: 'wallet-outline' },
  History: { focused: 'time', unfocused: 'time-outline' },
};

export function MainTabNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
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
      <Tab.Screen name="Offers" component={OffersNavigator} />
      <Tab.Screen name="AI" component={AINavigator} options={{ tabBarLabel: 'AI' }} />
      <Tab.Screen name="Wallet" component={WalletNavigator} />
      <Tab.Screen name="History" component={HistoryNavigator} />
    </Tab.Navigator>
  );
}
