import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatCategory } from '../../utils/formatters';
import * as transactionsApi from '../../api/transactions';
import type { Transaction } from '../../types/models';
import type { TransactionsScreenProps } from '../../types/navigation';

export function TransactionDetailScreen({ route, navigation }: TransactionsScreenProps<'TransactionDetail'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { transactionId } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await transactionsApi.getTransaction(transactionId);
        setTransaction(res.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [transactionId]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Transaction" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = transaction.amount > 0;
  const amountColor = isCredit ? colors.success : colors.textPrimary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Transaction Details" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Header */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
          </Text>
          <View style={[styles.statusBadge, {
            backgroundColor: transaction.status === 'posted' ? colors.successLight : colors.warningLight,
          }]}>
            <Text style={[styles.statusText, {
              color: transaction.status === 'posted' ? colors.success : colors.warning,
            }]}>
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Merchant Info */}
        <Card elevated style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MERCHANT</Text>
          <Text style={[styles.merchantName, { color: colors.textPrimary }]}>
            {transaction.merchantNormalized || transaction.merchantName}
          </Text>
          {transaction.merchantName !== transaction.merchantNormalized && transaction.merchantNormalized && (
            <Text style={[styles.merchantOriginal, { color: colors.textTertiary }]}>
              Original: {transaction.merchantName}
            </Text>
          )}
        </Card>

        {/* Details */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DETAILS</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {formatDate(transaction.transactionDate, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="pricetag-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {formatCategory(transaction.category || 'Other')}
            </Text>
          </View>

          {transaction.mccCode && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="code-outline" size={18} color={colors.textTertiary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>MCC Code</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {transaction.mccCode}
              </Text>
            </View>
          )}

        </Card>

        {/* Rewards Info */}
        {transaction.enrichmentData && (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REWARDS</Text>
            {transaction.enrichmentData['pointsEarned'] != null && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Points Earned</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700' }]}>
                  +{String(transaction.enrichmentData['pointsEarned'])}
                </Text>
              </View>
            )}
            {transaction.enrichmentData['cashbackEarned'] != null && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cashback</Text>
                <Text style={[styles.detailValue, { color: colors.success, fontWeight: '700' }]}>
                  +{formatCurrency(Number(transaction.enrichmentData['cashbackEarned']))}
                </Text>
              </View>
            )}
            {transaction.enrichmentData['missedValue'] != null && parseFloat(String(transaction.enrichmentData['missedValue'])) > 0 && (
              <View style={[styles.missedBanner, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.missedText, { color: colors.warning }]}>
                  You could have earned {formatCurrency(Number(transaction.enrichmentData['missedValue']))} more with the optimal card
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '700',
  },
  merchantOriginal: {
    fontSize: 13,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  missedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  missedText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
