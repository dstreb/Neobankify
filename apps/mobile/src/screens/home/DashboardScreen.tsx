import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Card } from '../../components/common/Card';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as rewardsApi from '../../api/rewards';
import * as transactionsApi from '../../api/transactions';
import type { RewardsSummary, Transaction, Recommendation } from '../../types/models';

export function DashboardScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();
  const { featureFlags } = useTenant();

  const [refreshing, setRefreshing] = useState(false);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, txnsRes, recsRes] = await Promise.allSettled([
        rewardsApi.getRewardsSummary(),
        transactionsApi.getTransactions({ limit: 5 }),
        rewardsApi.getRecommendations(),
      ]);

      if (summaryRes.status === 'fulfilled') setRewardsSummary(summaryRes.value.data);
      if (txnsRes.status === 'fulfilled') setRecentTransactions(txnsRes.value.data);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data.slice(0, 3));
    } catch {
      // Silently handle — dashboard is best-effort
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting()}</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.firstName || 'there'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('NotificationsList')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Rewards Overview Card */}
        {featureFlags.rewardsEnabled && rewardsSummary && (
          <Card elevated style={{ marginBottom: spacing.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REWARDS OVERVIEW</Text>
            <View style={styles.rewardsGrid}>
              <View style={styles.rewardStat}>
                <Text style={[styles.rewardValue, { color: colors.primary }]}>
                  {formatNumber(rewardsSummary.totalPointsEarned)}
                </Text>
                <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Points Earned</Text>
              </View>
              <View style={[styles.rewardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.rewardStat}>
                <Text style={[styles.rewardValue, { color: colors.success }]}>
                  {formatCurrency(parseFloat(rewardsSummary.totalCashbackEarned))}
                </Text>
                <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Cashback</Text>
              </View>
              <View style={[styles.rewardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.rewardStat}>
                <Text style={[styles.rewardValue, { color: colors.warning }]}>
                  {formatCurrency(parseFloat(rewardsSummary.totalMissedValue))}
                </Text>
                <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Missed Value</Text>
              </View>
            </View>
          </Card>
        )}

        {/* AI Recommendations */}
        {featureFlags.rewardsEnabled && recommendations.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>AI Recommendations</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Rewards')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recommendations.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Rewards', { screen: 'RecommendationDetail', params: { recommendationId: rec.id } })}
              >
                <Card style={{ marginBottom: spacing.sm }}>
                  <View style={styles.recRow}>
                    <View style={[styles.recIcon, { backgroundColor: colors.primaryLight + '15' }]}>
                      <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.recText}>
                      <Text style={[styles.recTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {rec.decisionType.replace(/_/g, ' ')}
                      </Text>
                      <Text style={[styles.recDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {rec.reasoning}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <Card padding="none">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((txn, i) => (
                <React.Fragment key={txn.id}>
                  <TransactionItem
                    transaction={txn}
                    onPress={() => navigation.navigate('Transactions', { screen: 'TransactionDetail', params: { transactionId: txn.id } })}
                  />
                  {i < recentTransactions.length - 1 && (
                    <View style={[styles.txnDivider, { backgroundColor: colors.borderLight }]} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyTxn}>
                <Ionicons name="receipt-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No transactions yet
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 28, fontWeight: '700', marginTop: 2 },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  rewardsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardStat: {
    flex: 1,
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rewardLabel: { fontSize: 12, marginTop: 4 },
  rewardDivider: { width: 1, height: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recText: { flex: 1, marginLeft: 12, marginRight: 8 },
  recTitle: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  recDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  txnDivider: { height: 1, marginLeft: 72 },
  emptyTxn: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 14, marginTop: 8 },
});
