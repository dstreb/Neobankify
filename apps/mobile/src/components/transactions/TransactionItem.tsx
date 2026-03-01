import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Transaction } from '../../types/models';
import { formatCurrency, formatDate, formatCategory } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  dining: 'restaurant-outline',
  groceries: 'cart-outline',
  gas: 'car-outline',
  travel: 'airplane-outline',
  entertainment: 'film-outline',
  transportation: 'bus-outline',
  utilities: 'flash-outline',
  subscriptions: 'repeat-outline',
  shopping: 'bag-outline',
  other: 'ellipsis-horizontal-outline',
};

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const icon = CATEGORY_ICONS[transaction.category || 'other'] || 'ellipsis-horizontal-outline';
  const isCredit = transaction.amount > 0;
  const amountColor = isCredit ? colors.success : colors.textPrimary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.borderLight }]}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} />
      </View>

      <View style={styles.details}>
        <Text style={[styles.merchant, { color: colors.textPrimary }]} numberOfLines={1}>
          {transaction.merchantNormalized || transaction.merchantName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { color: colors.textTertiary }]}>
            {formatCategory(transaction.category || 'Other')}
          </Text>
          <Text style={[styles.dot, { color: colors.textTertiary }]}> &middot; </Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>
            {formatDate(transaction.transactionDate, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isCredit ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
        </Text>
        {transaction.status === 'pending' && (
          <Text style={[styles.pending, { color: colors.warning }]}>Pending</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  merchant: {
    fontSize: 15,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  category: {
    fontSize: 13,
  },
  dot: {
    fontSize: 13,
  },
  date: {
    fontSize: 13,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pending: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
