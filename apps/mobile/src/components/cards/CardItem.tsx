import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Card as CardModel } from '../../types/models';
import { maskCardNumber } from '../../utils/formatters';

interface CardItemProps {
  card: CardModel;
  onPress: () => void;
}

const NETWORK_COLORS: Record<string, string[]> = {
  visa: ['#1a1f71', '#f7b924'],
  mastercard: ['#eb001b', '#f79e1b'],
  amex: ['#006fcf', '#00175a'],
  discover: ['#ff6000', '#ff8c00'],
};

export function CardItem({ card, onPress }: CardItemProps) {
  useTheme();
  const networkColors = NETWORK_COLORS[card.network] || ['#333', '#666'];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.card,
          { backgroundColor: networkColors[0] },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.cardName}>{card.cardName}</Text>
          {card.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>PRIMARY</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardNumber}>{maskCardNumber(card.lastFour)}</Text>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.label}>EXPIRES</Text>
            <Text style={styles.value}>{card.expirationDate}</Text>
          </View>
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{card.network.toUpperCase()}</Text>
          </View>
        </View>

        {card.status !== 'active' && (
          <View style={[styles.statusOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Ionicons
              name={card.status === 'frozen' ? 'snow-outline' : 'close-circle-outline'}
              size={32}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {card.status === 'frozen' ? 'FROZEN' : 'CLOSED'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    height: 200,
    justifyContent: 'space-between',
    marginBottom: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  networkBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 2,
  },
});
