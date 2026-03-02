import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import type { ProfileScreenProps } from '../../types/navigation';

interface NotificationSetting {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'transactions',
    icon: 'receipt-outline',
    title: 'Transactions',
    description: 'Get notified about new transactions',
  },
  {
    id: 'recommendations',
    icon: 'bulb-outline',
    title: 'AI Recommendations',
    description: 'Receive card optimization suggestions',
  },
  {
    id: 'rewards',
    icon: 'gift-outline',
    title: 'Rewards Updates',
    description: 'Points earned, cashback, and offers',
  },
  {
    id: 'security',
    icon: 'shield-outline',
    title: 'Security Alerts',
    description: 'Login attempts and suspicious activity',
  },
  {
    id: 'promotions',
    icon: 'megaphone-outline',
    title: 'Promotions',
    description: 'Special offers and limited-time bonuses',
  },
];

export function NotificationsScreen({ navigation }: ProfileScreenProps<'Notifications'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [enabledNotifications, setEnabledNotifications] = useState<Set<string>>(
    new Set(['transactions', 'recommendations', 'rewards', 'security']),
  );

  const toggleNotification = (id: string) => {
    setEnabledNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding="none">
          {NOTIFICATION_SETTINGS.map((setting, index) => {
            const isEnabled = enabledNotifications.has(setting.id);
            return (
              <React.Fragment key={setting.id}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => toggleNotification(setting.id)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={setting.icon} size={22} color={colors.textPrimary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                        {setting.title}
                      </Text>
                      <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                        {setting.description}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, { backgroundColor: isEnabled ? colors.primary : colors.border }]}>
                    <View style={[styles.toggleKnob, { transform: [{ translateX: isEnabled ? 20 : 0 }] }]} />
                  </View>
                </TouchableOpacity>
                {index < NOTIFICATION_SETTINGS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                )}
              </React.Fragment>
            );
          })}
        </Card>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Security alerts cannot be fully disabled. You will always receive critical security notifications via email.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 14,
    flex: 1,
  },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 13, marginTop: 2 },
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
  divider: {
    height: 1,
    marginLeft: 52,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 4,
  },
});
