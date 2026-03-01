import React, { useState, useEffect, useCallback } from 'react';
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
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (reset = false) => {
    try {
      const params: Record<string, unknown> = { limit: 20 };
      if (!reset && cursor) {
        params.cursor = cursor;
      }
      if (selectedCategory !== 'All') {
        params.category = selectedCategory.toLowerCase();
      }
      const response = await transactionsApi.getTransactions(params);
      const data = response.data;

      if (reset) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }
      setCursor(response.meta?.cursor ?? null);
      setHasMore(response.meta?.hasMore ?? data.length === 20);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [cursor, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    setTransactions([]);
    setCursor(null);
    fetchTransactions(true);
  }, [selectedCategory]);

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
