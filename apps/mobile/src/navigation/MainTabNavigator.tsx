import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';
import type { MainTabParamList } from '../types/navigation';
import { HomeNavigator } from './HomeNavigator';
import { CardsNavigator } from './CardsNavigator';
import { RewardsNavigator } from './RewardsNavigator';
import { TransactionsNavigator } from './TransactionsNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { AINavigator } from './AINavigator';
import { InvestingNavigator } from './InvestingNavigator';
import { TradingNavigator } from './TradingNavigator';
import { LendingNavigator } from './LendingNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Cards: { focused: 'card', unfocused: 'card-outline' },
  AI: { focused: 'sparkles', unfocused: 'sparkles-outline' },
  Rewards: { focused: 'gift', unfocused: 'gift-outline' },
  Investing: { focused: 'trending-up', unfocused: 'trending-up-outline' },
  Trading: { focused: 'bar-chart', unfocused: 'bar-chart-outline' },
  Lending: { focused: 'cash', unfocused: 'cash-outline' },
  Transactions: { focused: 'receipt', unfocused: 'receipt-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

export function MainTabNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { featureFlags } = useTenant();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = TAB_ICONS[route.name];
          const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
                tabBarActiveTintColor: colors.tabActive,
                tabBarInactiveTintColor: colors.tabInactive,
                tabBarStyle: {
                  backgroundColor: colors.tabBackground,
                  borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeNavigator} />
      <Tab.Screen name="Cards" component={CardsNavigator} />
      <Tab.Screen name="AI" component={AINavigator} options={{ tabBarLabel: 'AI Assistant' }} />
      {featureFlags.rewardsEnabled && (
        <Tab.Screen name="Rewards" component={RewardsNavigator} />
      )}
      {featureFlags.investingEnabled && (
        <Tab.Screen name="Investing" component={InvestingNavigator} />
      )}
      {featureFlags.tradingEnabled && (
        <Tab.Screen name="Trading" component={TradingNavigator} />
      )}
      {featureFlags.lendingEnabled && (
        <Tab.Screen name="Lending" component={LendingNavigator} />
      )}
      <Tab.Screen name="Transactions" component={TransactionsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
