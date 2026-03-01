import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { CardItem } from '../../components/cards/CardItem';
import * as cardsApi from '../../api/cards';
import type { Card } from '../../types/models';
import type { CardsScreenProps } from '../../types/navigation';

export function CardsScreen({ navigation }: CardsScreenProps<'CardsList'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [cards, setCards] = useState<Card[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    try {
      const response = await cardsApi.getCards();
      setCards(response.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Cards"
        subtitle={`${cards.length} card${cards.length !== 1 ? 's' : ''} linked`}
        rightAction={{
          icon: 'add-circle-outline',
          onPress: () => navigation.navigate('AddCard'),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {cards.length > 0 ? (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
            />
          ))
        ) : !loading ? (
          <EmptyState
            icon="card-outline"
            title="No cards yet"
            description="Add your credit and debit cards to start tracking rewards and optimizing your spending."
            actionLabel="Add a Card"
            onAction={() => navigation.navigate('AddCard')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
