import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

interface PaperAccount {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  pnl: number;
  pnlPct: number;
  totalTrades: number;
  winRate: number;
}

const MOCK_ACCOUNTS: PaperAccount[] = [
  { id: '1', name: 'Momentum Strategy', balance: 112500, initialBalance: 100000, pnl: 12500, pnlPct: 12.5, totalTrades: 47, winRate: 63 },
  { id: '2', name: 'Swing Trading', balance: 95200, initialBalance: 100000, pnl: -4800, pnlPct: -4.8, totalTrades: 28, winRate: 43 },
];

export function PaperTradingScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [accounts] = useState<PaperAccount[]>(MOCK_ACCOUNTS);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Paper Trading</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Practice trading with virtual money. No real money at risk.
        </Text>

        {accounts.map((account) => {
          const isPositive = account.pnl >= 0;
          return (
            <Card key={account.id} elevated style={{ marginBottom: spacing.md }}>
              <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
              <Text style={[styles.balance, { color: colors.textPrimary }]}>{formatCurrency(account.balance)}</Text>
              <Text style={[styles.pnl, { color: isPositive ? colors.success : colors.error }]}>
                {isPositive ? '+' : ''}{formatCurrency(account.pnl)} ({isPositive ? '+' : ''}{account.pnlPct.toFixed(1)}%)
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trades</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{account.totalTrades}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Win Rate</Text>
                  <Text style={[styles.statValue, { color: account.winRate >= 50 ? colors.success : colors.error }]}>{account.winRate}%</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Starting</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(account.initialBalance)}</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]}>
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset Account</Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  accountName: { fontSize: 16, fontWeight: '600' },
  balance: { fontSize: 28, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  pnl: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {},
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 15, fontWeight: '600', marginTop: 4, fontVariant: ['tabular-nums'] },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 6 },
  resetBtnText: { fontSize: 14, fontWeight: '500' },
});
