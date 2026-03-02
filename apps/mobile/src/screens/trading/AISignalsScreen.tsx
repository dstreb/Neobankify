import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';

interface Signal {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell' | 'strong_buy' | 'strong_sell' | 'hold';
  strategy: string;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  reasoning: string[];
}

const MOCK_SIGNALS: Signal[] = [
  {
    id: '1', ticker: 'AAPL', signalType: 'buy', strategy: 'Momentum', confidence: 0.72,
    entryPrice: 192.30, stopLoss: 185.00, takeProfit: 205.00, riskReward: 1.74,
    reasoning: ['SMA20 > SMA50 > SMA200: Strong uptrend', 'RSI at 58 — bullish momentum', 'MACD bullish crossover'],
  },
  {
    id: '2', ticker: 'NVDA', signalType: 'strong_buy', strategy: 'Breakout', confidence: 0.85,
    entryPrice: 745.20, stopLoss: 710.00, takeProfit: 820.00, riskReward: 2.13,
    reasoning: ['Upside breakout above $740 resistance', 'Volume surge 2.3x average', 'Earnings growth 95% supports buy'],
  },
  {
    id: '3', ticker: 'TSLA', signalType: 'sell', strategy: 'Mean Reversion', confidence: 0.61,
    entryPrice: 238.50, stopLoss: 252.00, takeProfit: 215.00, riskReward: 1.74,
    reasoning: ['RSI 72 — overbought territory', 'Price above upper Bollinger Band', 'High P/E ratio: 62.3'],
  },
];

const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  buy: { bg: '#22c55e20', text: '#22c55e' },
  strong_buy: { bg: '#16a34a30', text: '#16a34a' },
  sell: { bg: '#ef444420', text: '#ef4444' },
  strong_sell: { bg: '#dc262630', text: '#dc2626' },
  hold: { bg: '#f59e0b20', text: '#f59e0b' },
};

export function AISignalsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [signals] = useState<Signal[]>(MOCK_SIGNALS);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>AI Trading Signals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          AI-generated signals are for informational purposes only. Not financial advice.
        </Text>

        {signals.map((signal) => {
          const signalColor = SIGNAL_COLORS[signal.signalType] || SIGNAL_COLORS.hold;
          return (
            <Card key={signal.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.signalHeader}>
                <View style={styles.signalTicker}>
                  <Text style={[styles.ticker, { color: colors.textPrimary }]}>{signal.ticker}</Text>
                  <View style={[styles.signalBadge, { backgroundColor: signalColor.bg }]}>
                    <Text style={[styles.signalBadgeText, { color: signalColor.text }]}>
                      {signal.signalType.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.confidenceContainer}>
                  <Text style={[styles.confidenceLabel, { color: colors.textSecondary }]}>Confidence</Text>
                  <Text style={[styles.confidenceValue, { color: colors.primary }]}>{(signal.confidence * 100).toFixed(0)}%</Text>
                </View>
              </View>

              <Text style={[styles.strategy, { color: colors.textSecondary }]}>{signal.strategy} Strategy</Text>

              <View style={[styles.priceGrid, { borderColor: colors.border }]}>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Entry</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>${signal.entryPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Stop Loss</Text>
                  <Text style={[styles.priceValue, { color: colors.error }]}>${signal.stopLoss.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Target</Text>
                  <Text style={[styles.priceValue, { color: colors.success }]}>${signal.takeProfit.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>R:R</Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>{signal.riskReward.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.reasoningSection}>
                <Text style={[styles.reasoningTitle, { color: colors.textSecondary }]}>Reasoning</Text>
                {signal.reasoning.map((reason, i) => (
                  <View key={i} style={styles.reasonItem}>
                    <Text style={[styles.bulletPoint, { color: colors.primary }]}>-</Text>
                    <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{reason}</Text>
                  </View>
                ))}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  disclaimer: { fontSize: 12, textAlign: 'center', marginBottom: 16 },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  signalTicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticker: { fontSize: 20, fontWeight: '700' },
  signalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  signalBadgeText: { fontSize: 11, fontWeight: '700' },
  confidenceContainer: { alignItems: 'flex-end' },
  confidenceLabel: { fontSize: 11 },
  confidenceValue: { fontSize: 18, fontWeight: '700' },
  strategy: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  priceGrid: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  priceItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  priceLabel: { fontSize: 10, fontWeight: '600' },
  priceValue: { fontSize: 14, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  reasoningSection: { marginTop: 4 },
  reasoningTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  reasonItem: { flexDirection: 'row', marginBottom: 4, paddingRight: 16 },
  bulletPoint: { fontSize: 13, marginRight: 6, fontWeight: '700' },
  reasonText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
