import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as rewardsApi from '../../api/rewards';
import type { RewardsSummary, RewardProgram } from '../../types/models';
import type { RewardsScreenProps } from '../../types/navigation';

export function RewardsSummaryScreen({ navigation }: RewardsScreenProps<'RewardsSummary'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [programs, setPrograms] = useState<RewardProgram[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, programsRes] = await Promise.all([
        rewardsApi.getRewardsSummary(),
        rewardsApi.getRewardPrograms(),
      ]);
      setSummary(summaryRes.data);
      setPrograms(programsRes.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Rewards" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {summary && (
          <Card elevated style={{ marginBottom: spacing.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR REWARDS</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {formatNumber(summary.totalPointsEarned)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Points</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(parseFloat(summary.totalCashbackEarned))}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cashback</Text>
              </View>
            </View>

            <View style={[styles.missedSection, { backgroundColor: colors.warningLight, borderRadius: 8, padding: 12, marginTop: 16 }]}>
              <View style={styles.missedRow}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
                <Text style={[styles.missedText, { color: colors.warning }]}>
                  {formatCurrency(parseFloat(summary.totalMissedValue))} in missed rewards
                </Text>
              </View>
              <Text style={[styles.missedHint, { color: colors.textSecondary }]}>
                Follow AI recommendations to capture more value
              </Text>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('RewardsHistory')}
          >
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('OffersList')}
          >
            <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Offers</Text>
          </TouchableOpacity>
        </View>

        {/* Active Programs */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Programs</Text>
          {programs.length > 0 ? (
            programs.map((program) => (
              <Card key={program.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.programRow}>
                  <View style={[styles.programIcon, { backgroundColor: colors.primaryLight + '15' }]}>
                    <Ionicons name="gift-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={[styles.programName, { color: colors.textPrimary }]}>{program.name}</Text>
                    <Text style={[styles.programType, { color: colors.textSecondary }]}>
                      {program.programType} &middot; {program.issuer.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.rateBadge, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.rateText, { color: colors.success }]}>
                      {program.baseEarnRate}x
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No reward programs found. Add a card to see available programs.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: { fontSize: 13, marginTop: 4 },
  missedSection: {},
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  missedText: { fontSize: 14, fontWeight: '600' },
  missedHint: { fontSize: 13, marginLeft: 28 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickActionText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programInfo: {
    flex: 1,
    marginLeft: 12,
  },
  programName: { fontSize: 15, fontWeight: '600' },
  programType: { fontSize: 13, marginTop: 2 },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rateText: { fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
