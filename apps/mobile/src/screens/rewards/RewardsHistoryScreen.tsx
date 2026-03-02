import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import * as rewardsApi from '../../api/rewards';
import type { RewardsScreenProps } from '../../types/navigation';

interface RewardHistoryItem {
  id: string;
  type: string;
  amount: string;
  pointsEarned: number;
  category: string;
  createdAt: string;
}

export function RewardsHistoryScreen({ navigation }: RewardsScreenProps<'RewardsHistory'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await rewardsApi.getRewardsHistory({ limit: 50 });
      setHistory(response.data as unknown as RewardHistoryItem[]);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: RewardHistoryItem }) => (
    <View style={[styles.item, { borderBottomColor: colors.borderLight }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
        <Ionicons name="gift-outline" size={20} color={colors.success} />
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemType, { color: colors.textPrimary }]}>{item.type}</Text>
        <Text style={[styles.itemDate, { color: colors.textTertiary }]}>
          {formatDate(item.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.itemValues}>
        {item.pointsEarned > 0 && (
          <Text style={[styles.points, { color: colors.primary }]}>
            +{formatNumber(item.pointsEarned)} pts
          </Text>
        )}
        <Text style={[styles.amount, { color: colors.success }]}>
          +{formatCurrency(parseFloat(item.amount))}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Rewards History" showBack onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="gift-outline"
            title="No rewards history"
            description="Your reward earnings will appear here as you use your cards."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemType: { fontSize: 15, fontWeight: '500' },
  itemDate: { fontSize: 13, marginTop: 2 },
  itemValues: {
    alignItems: 'flex-end',
  },
  points: { fontSize: 13, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '600', marginTop: 2 },
});
