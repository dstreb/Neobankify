import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { CardItem } from '../../components/cards/CardItem';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import * as cardsApi from '../../api/cards';
import type { Card as CardModel } from '../../types/models';
import type { CardsScreenProps } from '../../types/navigation';

export function CardDetailScreen({ route, navigation }: CardsScreenProps<'CardDetail'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { cardId } = route.params;

  const [card, setCard] = useState<CardModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const response = await cardsApi.getCard(cardId);
        setCard(response.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [cardId]);

  const handleSetPrimary = async () => {
    if (!card) return;
    try {
      await cardsApi.setPrimaryCard(card.id);
      setCard({ ...card, isPrimary: true });
    } catch {
      Alert.alert('Error', 'Failed to set as primary card');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await cardsApi.deleteCard(cardId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to remove card');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!card) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Card" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Card not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Card Details" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CardItem card={card} onPress={() => {}} />

        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Card Name</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{card.cardName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Network</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{card.network.toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Four</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{card.lastFour}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Expiration</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{card.expirationDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: card.status === 'active' ? colors.successLight : colors.warningLight }]}>
              <Text style={[styles.statusText, { color: card.status === 'active' ? colors.success : colors.warning }]}>
                {card.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          {!card.isPrimary && card.status === 'active' && (
            <Button
              title="Set as Primary"
              onPress={handleSetPrimary}
              variant="outline"
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />
          )}
          <Button
            title="Remove Card"
            onPress={handleDelete}
            variant="danger"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: { marginTop: 8 },
});
