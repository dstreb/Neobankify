import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const MOCK_HISTORY = [
  { id: '1', date: 'Today', transactions: [
    { id: 't1', type: 'Transfer', description: 'To Jane Doe \u2022\u20222287', amount: -1250.00, icon: 'swap-horizontal-outline' as const, time: '2:30 PM' },
    { id: 't2', type: 'Deposit', description: 'Salary - Acme Corp', amount: 5200.00, icon: 'arrow-down-outline' as const, time: '9:00 AM' },
  ]},
  { id: '2', date: 'Yesterday', transactions: [
    { id: 't3', type: 'Purchase', description: 'Amazon.com', amount: -89.99, icon: 'cart-outline' as const, time: '4:15 PM' },
    { id: 't4', type: 'Withdraw', description: 'ATM Withdrawal', amount: -200.00, icon: 'arrow-up-outline' as const, time: '1:00 PM' },
    { id: 't5', type: 'Subscription', description: 'Netflix Monthly', amount: -15.99, icon: 'play-outline' as const, time: '12:00 AM' },
  ]},
  { id: '3', date: 'March 3, 2026', transactions: [
    { id: 't6', type: 'Transfer', description: 'From Savings', amount: 500.00, icon: 'swap-horizontal-outline' as const, time: '3:45 PM' },
    { id: 't7', type: 'Purchase', description: 'Whole Foods Market', amount: -67.32, icon: 'cart-outline' as const, time: '11:30 AM' },
  ]},
];

const FILTER_OPTIONS = ['All', 'Income', 'Expenses', 'Transfers'];

export function HistoryScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Filter transactions based on selected filter
  const filteredHistory = MOCK_HISTORY.map((group) => {
    if (selectedFilter === 'All') return group;
    const filtered = group.transactions.filter((txn) => {
      switch (selectedFilter) {
        case 'Income': return txn.amount >= 0;
        case 'Expenses': return txn.amount < 0 && txn.type !== 'Transfer';
        case 'Transfers': return txn.type === 'Transfer';
        default: return true;
      }
    });
    return { ...group, transactions: filtered };
  }).filter((group) => group.transactions.length > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with profile avatar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>History</Text>
        <TouchableOpacity
          style={[styles.profileAvatar, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ProfileMain')}
        >
          <Text style={styles.profileAvatarText}>
            {(user?.firstName?.[0] || 'J').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={[styles.searchRow, { paddingHorizontal: spacing.md }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>Search transactions...</Text>
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              selectedFilter === filter
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, { color: selectedFilter === filter ? '#FFFFFF' : colors.textSecondary }]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction groups */}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {filteredHistory.map((group) => (
          <View key={group.id} style={[styles.groupSection, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.groupDate, { color: colors.textSecondary }]}>{group.date}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {group.transactions.map((txn, index) => (
                <TouchableOpacity
                  key={txn.id}
                  style={[
                    styles.txnRow,
                    index < group.transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                  ]}
                  onPress={() => navigation.navigate('TransactionDetail', { transactionId: txn.id })}
                >
                  <View style={[styles.txnIcon, { backgroundColor: colors.brand10 }]}>
                    <Ionicons name={txn.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={[styles.txnType, { color: colors.textPrimary }]}>{txn.type}</Text>
                    <Text style={[styles.txnDesc, { color: colors.textSecondary }]}>{txn.description}</Text>
                  </View>
                  <View style={styles.txnRight}>
                    <Text style={[styles.txnAmount, { color: txn.amount >= 0 ? colors.success : colors.textPrimary }]}>
                      {txn.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </Text>
                    <Text style={[styles.txnTime, { color: colors.textTertiary }]}>{txn.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  searchRow: { marginTop: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchPlaceholder: { fontSize: 14 },

  filterBar: { flexGrow: 0, paddingVertical: 12 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: { fontSize: 13, fontWeight: '600' },

  groupSection: { marginTop: 16 },
  groupDate: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  groupCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: { flex: 1, marginLeft: 12 },
  txnType: { fontSize: 15, fontWeight: '600' },
  txnDesc: { fontSize: 13, marginTop: 1 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  txnTime: { fontSize: 11, marginTop: 2 },
});
