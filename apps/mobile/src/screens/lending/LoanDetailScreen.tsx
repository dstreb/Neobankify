import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

const MOCK_LOAN = {
  id: '1',
  type: 'Personal Loan',
  originalAmount: 15000,
  currentBalance: 11250,
  interestRate: 7.99,
  monthlyPayment: 305.50,
  nextPaymentDate: '2026-03-15',
  status: 'active',
  originationDate: '2025-06-15',
  maturityDate: '2029-06-15',
  totalPaid: 3750,
  totalInterestPaid: 890.25,
  remainingPayments: 38,
  autopayEnabled: true,
  paymentMethod: 'Checking *4521',
};

interface Payment {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'completed' | 'pending' | 'failed';
}

const MOCK_PAYMENTS: Payment[] = [
  { id: 'p1', date: '2026-02-15', amount: 305.50, principal: 230.40, interest: 75.10, status: 'completed' },
  { id: 'p2', date: '2026-01-15', amount: 305.50, principal: 228.80, interest: 76.70, status: 'completed' },
  { id: 'p3', date: '2025-12-15', amount: 305.50, principal: 227.20, interest: 78.30, status: 'completed' },
];

export function LoanDetailScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const loan = MOCK_LOAN;
  const paidPct = ((loan.originalAmount - loan.currentBalance) / loan.originalAmount) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>{loan.type}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <Card elevated>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balance, { color: colors.textPrimary }]}>{formatCurrency(loan.currentBalance)}</Text>

          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${paidPct}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {paidPct.toFixed(0)}% paid — {formatCurrency(loan.totalPaid)} of {formatCurrency(loan.originalAmount)}
          </Text>
        </Card>

        {/* Loan Details */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOAN DETAILS</Text>
          {[
            { label: 'Interest Rate', value: `${loan.interestRate}% APR` },
            { label: 'Monthly Payment', value: formatCurrency(loan.monthlyPayment) },
            { label: 'Next Payment', value: new Date(loan.nextPaymentDate).toLocaleDateString() },
            { label: 'Origination Date', value: new Date(loan.originationDate).toLocaleDateString() },
            { label: 'Maturity Date', value: new Date(loan.maturityDate).toLocaleDateString() },
            { label: 'Total Interest Paid', value: formatCurrency(loan.totalInterestPaid) },
            { label: 'Remaining Payments', value: `${loan.remainingPayments}` },
            { label: 'Autopay', value: loan.autopayEnabled ? `On — ${loan.paymentMethod}` : 'Off' },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* Actions */}
        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MakePayment', { loanId: loan.id })}
          >
            <Text style={styles.actionBtnText}>Make Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Payoff Quote</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment History</Text>
        </View>
        <Card padding="none">
          {MOCK_PAYMENTS.map((payment, i) => (
            <React.Fragment key={payment.id}>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={[styles.paymentDate, { color: colors.textPrimary }]}>
                    {new Date(payment.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.paymentBreakdown, { color: colors.textSecondary }]}>
                    Principal: {formatCurrency(payment.principal)} | Interest: {formatCurrency(payment.interest)}
                  </Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={[styles.paymentAmount, { color: colors.textPrimary }]}>{formatCurrency(payment.amount)}</Text>
                  <View style={[styles.paymentStatus, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.paymentStatusText, { color: colors.success }]}>{payment.status}</Text>
                  </View>
                </View>
              </View>
              {i < MOCK_PAYMENTS.length - 1 && <View style={[styles.paymentDivider, { backgroundColor: colors.borderLight }]} />}
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  balanceLabel: { fontSize: 14 },
  balance: { fontSize: 32, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  progressBar: { height: 8, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  paymentDate: { fontSize: 14, fontWeight: '600' },
  paymentBreakdown: { fontSize: 12, marginTop: 4 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  paymentStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  paymentStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  paymentDivider: { height: 1, marginLeft: 16 },
});
