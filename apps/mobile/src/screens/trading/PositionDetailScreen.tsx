import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

const MOCK_POSITION = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  side: 'long' as const,
  shares: 10,
  avgCost: 178.50,
  currentPrice: 192.30,
  marketValue: 1923.00,
  totalCost: 1785.00,
  unrealizedPnl: 138.00,
  unrealizedPnlPct: 7.73,
  dayChange: 12.40,
  dayChangePct: 0.65,
  openedAt: '2025-11-15T10:30:00Z',
  lastUpdated: '2026-03-01T16:00:00Z',
};

export function PositionDetailScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const position = MOCK_POSITION;
  const isPositive = position.unrealizedPnl >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>{position.ticker}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nameRow}>
          <Text style={[styles.positionName, { color: colors.textSecondary }]}>{position.name}</Text>
          <View style={[styles.sideBadge, { backgroundColor: position.side === 'long' ? colors.success + '20' : colors.error + '20' }]}>
            <Text style={[styles.sideText, { color: position.side === 'long' ? colors.success : colors.error }]}>
              {position.side.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.price, { color: colors.textPrimary }]}>{formatCurrency(position.currentPrice)}</Text>
        <Text style={[styles.change, { color: position.dayChange >= 0 ? colors.success : colors.error }]}>
          {position.dayChange >= 0 ? '+' : ''}{formatCurrency(position.dayChange)} ({position.dayChange >= 0 ? '+' : ''}{position.dayChangePct.toFixed(2)}%) today
        </Text>

        {/* Position Summary */}
        <Card elevated style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR POSITION</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Shares</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{position.shares}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Market Value</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(position.marketValue)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Avg Cost</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(position.avgCost)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Cost</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(position.totalCost)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Unrealized P&L</Text>
            <Text style={[styles.detailValue, { color: isPositive ? colors.success : colors.error }]}>
              {isPositive ? '+' : ''}{formatCurrency(position.unrealizedPnl)} ({isPositive ? '+' : ''}{position.unrealizedPnlPct.toFixed(2)}%)
            </Text>
          </View>
        </Card>

        {/* Trade Details */}
        <Card elevated style={{ marginTop: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TRADE DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Side</Text>
            <Text style={[styles.detailValue, { color: position.side === 'long' ? colors.success : colors.error }]}>
              {position.side.charAt(0).toUpperCase() + position.side.slice(1)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Opened</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {new Date(position.openedAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Updated</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {new Date(position.lastUpdated).toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => navigation.navigate('TradeOrder', { side: 'buy' })}
          >
            <Text style={styles.actionBtnText}>Add to Position</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
            onPress={() => navigation.navigate('TradeOrder', { side: 'sell' })}
          >
            <Text style={styles.actionBtnText}>Close Position</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  positionName: { fontSize: 14 },
  sideBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  sideText: { fontSize: 11, fontWeight: '700' },
  price: { fontSize: 32, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  change: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
