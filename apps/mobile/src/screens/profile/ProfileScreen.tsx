import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { ProfileScreenProps } from '../../types/navigation';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'shield-checkmark-outline', label: 'Security', screen: 'Security' },
  { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
  { icon: 'link-outline', label: 'Linked Accounts', screen: 'LinkedAccounts' },
];

interface WealthItem extends MenuItem {
  flag: 'rewardsEnabled' | 'investingEnabled' | 'tradingEnabled' | 'lendingEnabled';
}

const ALL_WEALTH_ITEMS: WealthItem[] = [
  { icon: 'gift-outline', label: 'Rewards', screen: 'RewardsSummary', flag: 'rewardsEnabled' },
  { icon: 'trending-up-outline', label: 'Investing', screen: 'InvestingDashboard', flag: 'investingEnabled' },
  { icon: 'bar-chart-outline', label: 'Trading', screen: 'TradingDashboard', flag: 'tradingEnabled' },
  { icon: 'cash-outline', label: 'Lending', screen: 'LendingDashboard', flag: 'lendingEnabled' },
];

export function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileMain'>) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { colors, spacing } = theme;
  const { user, logout } = useAuth();
  const { featureFlags } = useTenant();

  const wealthItems = ALL_WEALTH_ITEMS.filter((item) => featureFlags[item.flag]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Handle error
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
          <View style={[styles.kycBadge, {
            backgroundColor: user?.kycStatus === 'approved' ? colors.successLight : colors.warningLight,
          }]}>
            <Ionicons
              name={user?.kycStatus === 'approved' ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={user?.kycStatus === 'approved' ? colors.success : colors.warning}
            />
            <Text style={[styles.kycText, {
              color: user?.kycStatus === 'approved' ? colors.success : colors.warning,
            }]}>
              KYC {user?.kycStatus || 'pending'}
            </Text>
          </View>
        </View>

        {/* Dark Mode Toggle */}
        <Card style={{ marginBottom: spacing.lg }}>
          <TouchableOpacity onPress={toggleTheme} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={colors.textPrimary} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: isDark ? 20 : 0 }] }]} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Menu Items */}
        <Card style={{ marginBottom: spacing.lg }} padding="none">
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen as never)}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon} size={22} color={colors.textPrimary} />
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              )}
            </React.Fragment>
          ))}
        </Card>

        {/* Wealth & Features */}
        {wealthItems.length > 0 && (
          <Card style={{ marginBottom: spacing.lg }} padding="none">
            {wealthItems.map((item, index) => (
              <React.Fragment key={item.screen}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate(item.screen as never)}
                >
                  <View style={styles.menuLeft}>
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>
                {index < wealthItems.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                )}
              </React.Fragment>
            ))}
          </Card>
        )}

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
        />

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  userSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 4,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
