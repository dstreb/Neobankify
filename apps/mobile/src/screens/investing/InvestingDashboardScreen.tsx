import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  returnsPct: number;
  dayChange: number;
  dayChangePct: number;
}

interface Holding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  currentPrice: number;
  costBasis: number;
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
}

const MOCK_SUMMARY: PortfolioSummary = {
  totalValue: 24850.75,
  totalInvested: 22000.00,
  totalReturns: 2850.75,
  returnsPct: 12.96,
  dayChange: 145.30,
  dayChangePct: 0.59,
};

const MOCK_HOLDINGS: Holding[] = [
  { id: '1', ticker: 'VTI', name: 'Vanguard Total Stock Market', shares: 25, currentPrice: 242.50, costBasis: 220.00, totalValue: 6062.50, dayChange: 18.75, dayChangePct: 0.31 },
  { id: '2', ticker: 'VXUS', name: 'Vanguard Intl Stock', shares: 40, currentPrice: 58.20, costBasis: 52.00, totalValue: 2328.00, dayChange: -8.40, dayChangePct: -0.36 },
  { id: '3', ticker: 'BND', name: 'Vanguard Total Bond', shares: 50, currentPrice: 72.80, costBasis: 74.50, totalValue: 3640.00, dayChange: 5.00, dayChangePct: 0.14 },
  { id: '4', ticker: 'VNQ', name: 'Vanguard Real Estate', shares: 20, currentPrice: 84.30, costBasis: 78.00, totalValue: 1686.00, dayChange: -4.60, dayChangePct: -0.27 },
];

export function InvestingDashboardScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<PortfolioSummary>(MOCK_SUMMARY);
  const [holdings, setHoldings] = useState<Holding[]>(MOCK_HOLDINGS);

  const fetchData = useCallback(async () => {
    // In production, fetch from investing-service API
    setSummary(MOCK_SUMMARY);
    setHoldings(MOCK_HOLDINGS);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isPositive = summary.dayChange >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Investments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('InvestingSettings')}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Value Card */}
        <Card elevated style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>PORTFOLIO VALUE</Text>
          <Text style={[styles.portfolioValue, { color: colors.textPrimary }]}>
            {formatCurrency(summary.totalValue)}
          </Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={isPositive ? colors.success : colors.error}
            />
            <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.error }]}>
              {isPositive ? '+' : ''}{formatCurrency(summary.dayChange)} ({isPositive ? '+' : ''}{summary.dayChangePct.toFixed(2)}%) today
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Invested</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(summary.totalInvested)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Returns</Text>
              <Text style={[styles.statValue, { color: summary.totalReturns >= 0 ? colors.success : colors.error }]}>
                {summary.totalReturns >= 0 ? '+' : ''}{formatCurrency(summary.totalReturns)} ({summary.returnsPct.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={[styles.actionsRow, { marginBottom: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('InvestingOrder', { side: 'buy' })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Invest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('SuitabilityAssessment')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Risk Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Holdings */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Holdings</Text>
        </View>
        <Card padding="none">
          {holdings.map((holding, i) => {
            const holdingPositive = holding.dayChange >= 0;
            const gainLoss = holding.totalValue - (holding.costBasis * holding.shares);
            return (
              <React.Fragment key={holding.id}>
                <TouchableOpacity
                  style={styles.holdingRow}
                  onPress={() => navigation.navigate('HoldingDetail', { holdingId: holding.id })}
                >
                  <View style={styles.holdingLeft}>
                    <Text style={[styles.holdingTicker, { color: colors.textPrimary }]}>{holding.ticker}</Text>
                    <Text style={[styles.holdingName, { color: colors.textSecondary }]} numberOfLines={1}>{holding.name}</Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={[styles.holdingValue, { color: colors.textPrimary }]}>{formatCurrency(holding.totalValue)}</Text>
                    <Text style={[styles.holdingChange, { color: holdingPositive ? colors.success : colors.error }]}>
                      {holdingPositive ? '+' : ''}{formatCurrency(gainLoss)} ({holdingPositive ? '+' : ''}{holding.dayChangePct.toFixed(2)}%)
                    </Text>
                  </View>
                </TouchableOpacity>
                {i < holdings.length - 1 && <View style={[styles.holdingDivider, { backgroundColor: colors.borderLight }]} />}
              </React.Fragment>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  portfolioLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  portfolioValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  changeText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  divider: { height: 1, marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  holdingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  holdingLeft: { flex: 1, marginRight: 12 },
  holdingTicker: { fontSize: 16, fontWeight: '700' },
  holdingName: { fontSize: 13, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  holdingChange: { fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] },
  holdingDivider: { height: 1, marginLeft: 16 },
});
