import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import * as accountsApi from '../../api/accounts';
import type { LinkedAccount } from '../../types/models';
import type { ProfileScreenProps } from '../../types/navigation';

export function LinkedAccountsScreen({ navigation }: ProfileScreenProps<'LinkedAccounts'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountsApi.getLinkedAccounts();
      setAccounts(response.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  };

  const handleUnlink = (accountId: string, name: string) => {
    Alert.alert(
      'Unlink Account',
      `Are you sure you want to unlink ${name}? You will lose access to transaction data from this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountsApi.unlinkAccount(accountId);
              setAccounts((prev) => prev.filter((a) => a.id !== accountId));
            } catch {
              Alert.alert('Error', 'Failed to unlink account');
            }
          },
        },
      ],
    );
  };

  const handleAddAccount = async () => {
    try {
      // In production, initialize Plaid Link
      await accountsApi.createLinkToken();
    } catch {
      Alert.alert('Error', 'Failed to start account linking');
    }
  };

  const getAccountIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'checking': return 'wallet-outline';
      case 'savings': return 'cash-outline';
      case 'credit_card': return 'card-outline';
      default: return 'business-outline';
    }
  };

  const renderItem = ({ item }: { item: LinkedAccount }) => (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={styles.accountRow}>
        <View style={[styles.accountIcon, { backgroundColor: colors.primaryLight + '15' }]}>
          <Ionicons name={getAccountIcon(item.accountType)} size={22} color={colors.primary} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: colors.textPrimary }]}>{item.institutionName}</Text>
          <Text style={[styles.accountType, { color: colors.textSecondary }]}>
            {item.accountType.replace(/_/g, ' ')} &middot; ****{item.mask}
          </Text>
          {item.lastSyncAt && (
            <Text style={[styles.syncTime, { color: colors.textTertiary }]}>
              Synced {formatRelativeTime(item.lastSyncAt)}
            </Text>
          )}
        </View>
        <View style={styles.accountBalance}>
          <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
            {formatCurrency(item.currentBalance ?? 0)}
          </Text>
          <View style={[styles.statusDot, {
            backgroundColor: item.status === 'active' ? colors.success : colors.error,
          }]} />
        </View>
      </View>
      {item.status !== 'active' && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {item.status === 'disconnected' ? 'Reconnection required' : 'Sync error'}
          </Text>
        </View>
      )}
      <View style={styles.accountActions}>
        <Button
          title="Unlink"
          onPress={() => handleUnlink(item.id, item.institutionName)}
          variant="ghost"
          size="sm"
        />
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Linked Accounts"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'add-circle-outline',
          onPress: handleAddAccount,
        }}
      />
      <FlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="link-outline"
            title="No linked accounts"
            description="Connect your bank accounts to track spending and optimize rewards across all your cards."
            actionLabel="Link an Account"
            onAction={handleAddAccount}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  syncTime: { fontSize: 12, marginTop: 2 },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  warningText: { fontSize: 13, fontWeight: '500' },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
