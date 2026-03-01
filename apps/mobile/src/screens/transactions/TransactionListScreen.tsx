import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import * as transactionsApi from '../../api/transactions';
import type { Transaction } from '../../types/models';
import type { TransactionsScreenProps } from '../../types/navigation';

const CATEGORIES = ['All', 'Dining', 'Groceries', 'Gas', 'Travel', 'Entertainment', 'Shopping', 'Other'];

export function TransactionListScreen({ navigation }: TransactionsScreenProps<'TransactionList'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const cursorRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (reset = false) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 20 };
      if (!reset && cursorRef.current) {
        params.cursor = cursorRef.current;
      }
      if (selectedCategory !== 'All') {
        params.category = selectedCategory.toLowerCase();
      }
      const response = await transactionsApi.getTransactions(params);
      const data = response.data;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (reset) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }
      cursorRef.current = response.meta?.cursor ?? null;
      setHasMore(response.meta?.hasMore ?? data.length === 20);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      // Only clear transactions on initial load failure, not pull-to-refresh
      if (reset && transactions.length === 0) {
        setTransactions([]);
      }
      cursorRef.current = null;
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    setTransactions([]);
    cursorRef.current = null;
    fetchTransactions(true);
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
                borderColor: selectedCategory === item ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: selectedCategory === item ? '#fff' : colors.textSecondary },
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderItem = ({ item, index }: { item: Transaction; index: number }) => (
    <View>
      <TransactionItem
        transaction={item}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
      />
      {index < transactions.length - 1 && (
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
      )}
    </View>
  );

  if (loading && transactions.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Transactions" />
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions"
            description={selectedCategory === 'All'
              ? 'Your transactions will appear here once you start using your cards.'
              : `No ${selectedCategory.toLowerCase()} transactions found.`}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  filterContainer: {
    paddingVertical: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
});
