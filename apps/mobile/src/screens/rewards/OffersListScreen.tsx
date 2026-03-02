import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import * as rewardsApi from '../../api/rewards';
import type { RewardsScreenProps } from '../../types/navigation';

interface Offer {
  id: string;
  programName: string;
  bonusCategory: string;
  bonusMultiplier: number;
  description: string;
  startDate: string;
  endDate: string;
}

export function OffersListScreen({ navigation }: RewardsScreenProps<'OffersList'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await rewardsApi.getOffers();
      setOffers(response.data as unknown as Offer[]);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Offer }) => {
    const endDate = new Date(item.endDate);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return (
      <Card style={{ marginHorizontal: 16, marginBottom: spacing.sm }}>
        <View style={styles.offerHeader}>
          <View style={[styles.multiplierBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.multiplierText}>{item.bonusMultiplier}x</Text>
          </View>
          <View style={styles.offerInfo}>
            <Text style={[styles.offerName, { color: colors.textPrimary }]}>{item.programName}</Text>
            <Text style={[styles.offerCategory, { color: colors.textSecondary }]}>
              {item.bonusCategory}
            </Text>
          </View>
          {daysLeft <= 7 && (
            <View style={[styles.urgentBadge, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.urgentText, { color: colors.error }]}>
                {daysLeft}d left
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={[styles.offerDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={[styles.offerDates, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {formatDate(item.startDate, { month: 'short', day: 'numeric' })} — {formatDate(item.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Offers" showBack onBack={() => navigation.goBack()} />
      <FlatList
        data={offers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="No offers available"
            description="Check back later for bonus reward offers from your card programs."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 32 },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  multiplierBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  offerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  offerName: { fontSize: 15, fontWeight: '600' },
  offerCategory: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentText: { fontSize: 12, fontWeight: '700' },
  offerDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  offerDates: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  dateText: { fontSize: 12 },
});
