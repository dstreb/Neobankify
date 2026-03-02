import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

export function TradeOrderScreen({ navigation, route }: { navigation: { goBack: () => void }; route: { params?: { side?: string } } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [side, setSide] = useState<'buy' | 'sell'>(route.params?.side === 'sell' ? 'sell' : 'buy');
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const orderTypes: { value: OrderType; label: string }[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'stop', label: 'Stop' },
    { value: 'stop_limit', label: 'Stop Limit' },
  ];

  const handleSubmit = () => {
    if (!ticker.trim()) {
      Alert.alert('Enter Ticker', 'Please enter a stock ticker symbol.');
      return;
    }
    if (!shares || parseFloat(shares) <= 0) {
      Alert.alert('Enter Shares', 'Please enter the number of shares.');
      return;
    }
    if (orderType !== 'market' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      Alert.alert('Enter Price', 'Please enter a limit/stop price.');
      return;
    }

    const estimatedCost = orderType === 'market' ? 'market price' : `$${parseFloat(limitPrice).toFixed(2)}`;
    Alert.alert(
      'Confirm Order',
      `${side.toUpperCase()} ${shares} shares of ${ticker.toUpperCase()}\nOrder Type: ${orderType}\nPrice: ${estimatedCost}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Place Order', onPress: () => {
          Alert.alert('Order Placed', `Your ${side} order for ${ticker.toUpperCase()} has been submitted.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }},
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Place Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Buy/Sell Toggle */}
        <View style={[styles.sideToggle, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.sideButton, side === 'buy' && { backgroundColor: colors.success }]}
            onPress={() => setSide('buy')}
          >
            <Text style={[styles.sideButtonText, { color: side === 'buy' ? '#fff' : colors.textSecondary }]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sideButton, side === 'sell' && { backgroundColor: colors.error }]}
            onPress={() => setSide('sell')}
          >
            <Text style={[styles.sideButtonText, { color: side === 'sell' ? '#fff' : colors.textSecondary }]}>Sell</Text>
          </TouchableOpacity>
        </View>

        {/* Ticker Input */}
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Symbol</Text>
          <TextInput
            style={[styles.tickerInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
            value={ticker}
            onChangeText={(t) => setTicker(t.toUpperCase())}
            placeholder="AAPL"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />
        </Card>

        {/* Shares Input */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Shares</Text>
          <TextInput
            style={[styles.sharesInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
            value={shares}
            onChangeText={setShares}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Order Type */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Order Type</Text>
          <View style={styles.orderTypeRow}>
            {orderTypes.map((ot) => (
              <TouchableOpacity
                key={ot.value}
                style={[
                  styles.orderTypeBtn,
                  { borderColor: orderType === ot.value ? colors.primary : colors.border },
                  orderType === ot.value && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => setOrderType(ot.value)}
              >
                <Text style={[styles.orderTypeText, { color: orderType === ot.value ? colors.primary : colors.textSecondary }]}>
                  {ot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Limit Price (if not market order) */}
        {orderType !== 'market' && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {orderType === 'stop' ? 'Stop Price' : 'Limit Price'}
            </Text>
            <View style={styles.priceInputRow}>
              <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.textPrimary }]}
                value={limitPrice}
                onChangeText={setLimitPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: side === 'buy' ? colors.success : colors.error }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            {side === 'buy' ? 'Buy' : 'Sell'} {ticker || 'Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },
  sideToggle: { flexDirection: 'row', borderRadius: 10, padding: 4 },
  sideButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  sideButtonText: { fontSize: 15, fontWeight: '600' },
  inputLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  tickerInput: { fontSize: 24, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 8 },
  sharesInput: { fontSize: 24, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 8, fontVariant: ['tabular-nums'] },
  orderTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  orderTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  orderTypeText: { fontSize: 13, fontWeight: '600' },
  priceInputRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 20, marginRight: 4 },
  priceInput: { fontSize: 24, fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
