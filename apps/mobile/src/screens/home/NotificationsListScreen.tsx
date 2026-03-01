import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotificationsList'>;

export function NotificationsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      <View style={styles.empty}>
        <Ionicons name="notifications-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
        <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
          You&apos;ll see reward alerts, transaction updates, and security notifications here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
