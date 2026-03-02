import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

interface Position {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  side: 'long' | 'short';
}

interface TradingStats {
  portfolioValue: number;
  buyingPower: number;
  dayPnl: number;
  dayPnlPct: number;
  totalPnl: number;
  openPositions: number;
}

const MOCK_STATS: TradingStats = {
  portfolioValue: 15420.50,
  buyingPower: 8500.00,
  dayPnl: 234.75,
  dayPnlPct: 1.55,
  totalPnl: 1420.50,
  openPositions: 4,
};

const MOCK_POSITIONS: Position[] = [
  { id: '1', ticker: 'AAPL', name: 'Apple Inc.', shares: 10, avgCost: 178.50, currentPrice: 192.30, marketValue: 1923.00, unrealizedPnl: 138.00, unrealizedPnlPct: 7.73, side: 'long' },
  { id: '2', ticker: 'NVDA', name: 'NVIDIA Corp.', shares: 5, avgCost: 680.00, currentPrice: 745.20, marketValue: 3726.00, unrealizedPnl: 326.00, unrealizedPnlPct: 9.59, side: 'long' },
  { id: '3', ticker: 'TSLA', name: 'Tesla Inc.', shares: 8, avgCost: 245.00, currentPrice: 238.50, marketValue: 1908.00, unrealizedPnl: -52.00, unrealizedPnlPct: -2.65, side: 'long' },
  { id: '4', ticker: 'MSFT', name: 'Microsoft Corp.', shares: 12, avgCost: 390.00, currentPrice: 415.80, marketValue: 4989.60, unrealizedPnl: 309.60, unrealizedPnlPct: 6.62, side: 'long' },
];

export function TradingDashboardScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TradingStats>(MOCK_STATS);
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS);

  const fetchData = useCallback(async () => {
    setStats(MOCK_STATS);
    setPositions(MOCK_POSITIONS);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const dayPositive = stats.dayPnl >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Trading</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PaperTrading')}>
            <View style={[styles.paperBadge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.paperBadgeText, { color: colors.warning }]}>Paper Trading</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <Card elevated style={{ marginBottom: spacing.lg }}>
          <View style={styles.statsGrid}>
            <View style={styles.statMain}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Portfolio Value</Text>
              <Text style={[styles.statValueLarge, { color: colors.textPrimary }]}>{formatCurrency(stats.portfolioValue)}</Text>
              <Text style={[styles.dayPnl, { color: dayPositive ? colors.success : colors.error }]}>
                {dayPositive ? '+' : ''}{formatCurrency(stats.dayPnl)} ({dayPositive ? '+' : ''}{stats.dayPnlPct.toFixed(2)}%) today
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Buying Power</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(stats.buyingPower)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total P&L</Text>
              <Text style={[styles.statValue, { color: stats.totalPnl >= 0 ? colors.success : colors.error }]}>
                {stats.totalPnl >= 0 ? '+' : ''}{formatCurrency(stats.totalPnl)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Positions</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.openPositions}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={[styles.actionsRow, { marginBottom: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => navigation.navigate('TradeOrder', { side: 'buy' })}
          >
            <Ionicons name="trending-up" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => navigation.navigate('TradeOrder', { side: 'sell' })}
          >
            <Ionicons name="trending-down" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('AISignals')}
          >
            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Signals</Text>
          </TouchableOpacity>
        </View>

        {/* Positions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Open Positions</Text>
        </View>
        <Card padding="none">
          {positions.map((pos, i) => {
            const posPositive = pos.unrealizedPnl >= 0;
            return (
              <React.Fragment key={pos.id}>
                <TouchableOpacity
                  style={styles.positionRow}
                  onPress={() => navigation.navigate('PositionDetail', { positionId: pos.id })}
                >
                  <View style={styles.posLeft}>
                    <View style={styles.tickerRow}>
                      <Text style={[styles.ticker, { color: colors.textPrimary }]}>{pos.ticker}</Text>
                      <View style={[styles.sideBadge, { backgroundColor: pos.side === 'long' ? colors.success + '20' : colors.error + '20' }]}>
                        <Text style={[styles.sideText, { color: pos.side === 'long' ? colors.success : colors.error }]}>
                          {pos.side.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.posName, { color: colors.textSecondary }]} numberOfLines={1}>{pos.shares} shares @ {formatCurrency(pos.avgCost)}</Text>
                  </View>
                  <View style={styles.posRight}>
                    <Text style={[styles.posValue, { color: colors.textPrimary }]}>{formatCurrency(pos.marketValue)}</Text>
                    <Text style={[styles.posPnl, { color: posPositive ? colors.success : colors.error }]}>
                      {posPositive ? '+' : ''}{formatCurrency(pos.unrealizedPnl)} ({posPositive ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                    </Text>
                  </View>
                </TouchableOpacity>
                {i < positions.length - 1 && <View style={[styles.posDivider, { backgroundColor: colors.borderLight }]} />}
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
  paperBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paperBadgeText: { fontSize: 12, fontWeight: '600' },
  statsGrid: {},
  statMain: { marginBottom: 4 },
  statLabel: { fontSize: 12 },
  statValueLarge: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },
  dayPnl: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {},
  statValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  posLeft: { flex: 1, marginRight: 12 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticker: { fontSize: 16, fontWeight: '700' },
  sideBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sideText: { fontSize: 10, fontWeight: '700' },
  posName: { fontSize: 13, marginTop: 2 },
  posRight: { alignItems: 'flex-end' },
  posValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  posPnl: { fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] },
  posDivider: { height: 1, marginLeft: 16 },
});
