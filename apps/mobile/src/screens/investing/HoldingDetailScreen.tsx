import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

const MOCK_HOLDING = {
  ticker: 'VTI',
  name: 'Vanguard Total Stock Market ETF',
  shares: 25,
  currentPrice: 242.50,
  costBasis: 220.00,
  totalValue: 6062.50,
  totalCost: 5500.00,
  gainLoss: 562.50,
  gainLossPct: 10.23,
  dayChange: 18.75,
  dayChangePct: 0.31,
  assetClass: 'US Large Cap',
  allocation: 24.4,
  dividendYield: 1.32,
  expenseRatio: 0.03,
};

export function HoldingDetailScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const holding = MOCK_HOLDING;
  const isPositive = holding.gainLoss >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>{holding.ticker}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.holdingName, { color: colors.textSecondary }]}>{holding.name}</Text>
        <Text style={[styles.price, { color: colors.textPrimary }]}>{formatCurrency(holding.currentPrice)}</Text>
        <Text style={[styles.change, { color: isPositive ? colors.success : colors.error }]}>
          {isPositive ? '+' : ''}{formatCurrency(holding.dayChange)} ({isPositive ? '+' : ''}{holding.dayChangePct.toFixed(2)}%) today
        </Text>

        {/* Position Summary */}
        <Card elevated style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR POSITION</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Shares</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{holding.shares}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Market Value</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(holding.totalValue)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cost Basis</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatCurrency(holding.totalCost)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Gain/Loss</Text>
            <Text style={[styles.detailValue, { color: isPositive ? colors.success : colors.error }]}>
              {isPositive ? '+' : ''}{formatCurrency(holding.gainLoss)} ({isPositive ? '+' : ''}{holding.gainLossPct.toFixed(2)}%)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Portfolio Allocation</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{holding.allocation}%</Text>
          </View>
        </Card>

        {/* Fund Details */}
        <Card elevated style={{ marginTop: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FUND DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Asset Class</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{holding.assetClass}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dividend Yield</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{holding.dividendYield}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Expense Ratio</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{holding.expenseRatio}%</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionBtnText}>Buy More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Sell</Text>
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
  holdingName: { fontSize: 14 },
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
