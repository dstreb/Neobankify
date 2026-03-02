import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

interface Loan {
  id: string;
  type: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  status: 'active' | 'paid_off' | 'delinquent';
  remainingPayments: number;
}

interface LendingStats {
  totalBorrowed: number;
  totalOutstanding: number;
  monthlyPayments: number;
  nextPaymentDate: string;
  activeLoans: number;
  creditScore: number;
}

const MOCK_STATS: LendingStats = {
  totalBorrowed: 25000,
  totalOutstanding: 18750,
  monthlyPayments: 485.50,
  nextPaymentDate: '2026-03-15',
  activeLoans: 2,
  creditScore: 742,
};

const MOCK_LOANS: Loan[] = [
  { id: '1', type: 'Personal Loan', originalAmount: 15000, currentBalance: 11250, interestRate: 7.99, monthlyPayment: 305.50, nextPaymentDate: '2026-03-15', status: 'active', remainingPayments: 38 },
  { id: '2', type: 'Line of Credit', originalAmount: 10000, currentBalance: 7500, interestRate: 10.99, monthlyPayment: 180.00, nextPaymentDate: '2026-03-15', status: 'active', remainingPayments: 45 },
];

export function LendingDashboardScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<LendingStats>(MOCK_STATS);
  const [loans, setLoans] = useState<Loan[]>(MOCK_LOANS);

  const fetchData = useCallback(async () => {
    setStats(MOCK_STATS);
    setLoans(MOCK_LOANS);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lending</Text>
        </View>

        {/* Overview Card */}
        <Card elevated style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOAN OVERVIEW</Text>
          <Text style={[styles.outstandingValue, { color: colors.textPrimary }]}>
            {formatCurrency(stats.totalOutstanding)}
          </Text>
          <Text style={[styles.outstandingLabel, { color: colors.textSecondary }]}>Outstanding Balance</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Payment</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(stats.monthlyPayments)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Loans</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.activeLoans}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Credit Score</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.creditScore}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={[styles.actionsRow, { marginBottom: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('LoanApplication')}
          >
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Apply for Loan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MakePayment')}
          >
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Make Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Active Loans */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Loans</Text>
        </View>
        {loans.map((loan) => {
          const paidPct = ((loan.originalAmount - loan.currentBalance) / loan.originalAmount) * 100;
          return (
            <TouchableOpacity
              key={loan.id}
              onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.loanHeader}>
                  <Text style={[styles.loanType, { color: colors.textPrimary }]}>{loan.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: loan.status === 'active' ? colors.success + '20' : colors.error + '20' }]}>
                    <Text style={[styles.statusText, { color: loan.status === 'active' ? colors.success : colors.error }]}>
                      {loan.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: colors.textSecondary }]}>Balance</Text>
                    <Text style={[styles.loanDetailValue, { color: colors.textPrimary }]}>{formatCurrency(loan.currentBalance)}</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: colors.textSecondary }]}>Rate</Text>
                    <Text style={[styles.loanDetailValue, { color: colors.textPrimary }]}>{loan.interestRate}%</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: colors.textSecondary }]}>Payment</Text>
                    <Text style={[styles.loanDetailValue, { color: colors.textPrimary }]}>{formatCurrency(loan.monthlyPayment)}/mo</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${paidPct}%` }]} />
                </View>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {paidPct.toFixed(0)}% paid — {loan.remainingPayments} payments remaining
                </Text>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  outstandingValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  outstandingLabel: { fontSize: 14, marginTop: 2 },
  divider: { height: 1, marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {},
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 15, fontWeight: '600', marginTop: 4, fontVariant: ['tabular-nums'] },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loanType: { fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  loanDetail: {},
  loanDetailLabel: { fontSize: 12 },
  loanDetailValue: { fontSize: 14, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 12, marginTop: 6 },
});
