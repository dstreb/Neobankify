import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';

export function InvestingOrderScreen({ navigation, route }: { navigation: { goBack: () => void }; route: { params?: { side?: string } } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const side = route.params?.side || 'buy';
  const [amount, setAmount] = useState('');
  const [selectedFund, setSelectedFund] = useState<string | null>(null);

  const funds = [
    { id: 'balanced', name: 'Balanced Portfolio', description: 'Moderate risk, diversified', allocation: '60/40 stocks/bonds' },
    { id: 'growth', name: 'Growth Portfolio', description: 'Higher risk, equity focused', allocation: '80/20 stocks/bonds' },
    { id: 'conservative', name: 'Conservative Portfolio', description: 'Lower risk, income focused', allocation: '30/70 stocks/bonds' },
    { id: 'custom', name: 'Individual ETFs', description: 'Pick your own investments', allocation: 'Custom' },
  ];

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid investment amount.');
      return;
    }
    if (!selectedFund) {
      Alert.alert('Select a Portfolio', 'Please select a portfolio to invest in.');
      return;
    }
    Alert.alert(
      'Confirm Investment',
      `${side === 'buy' ? 'Invest' : 'Withdraw'} $${parseFloat(amount).toFixed(2)} in ${funds.find(f => f.id === selectedFund)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {
          Alert.alert('Order Submitted', 'Your investment order has been placed.', [
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
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>
          {side === 'buy' ? 'Invest' : 'Withdraw'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.textPrimary }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {['25', '50', '100', '500'].map((qa) => (
            <TouchableOpacity
              key={qa}
              style={[styles.quickAmountBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setAmount(qa)}
            >
              <Text style={[styles.quickAmountText, { color: colors.textPrimary }]}>${qa}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Portfolio Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>Select Portfolio</Text>
        {funds.map((fund) => (
          <TouchableOpacity
            key={fund.id}
            style={[
              styles.fundCard,
              { backgroundColor: colors.surface, borderColor: selectedFund === fund.id ? colors.primary : colors.border },
              selectedFund === fund.id && { borderWidth: 2 },
            ]}
            onPress={() => setSelectedFund(fund.id)}
          >
            <View style={styles.fundInfo}>
              <Text style={[styles.fundName, { color: colors.textPrimary }]}>{fund.name}</Text>
              <Text style={[styles.fundDesc, { color: colors.textSecondary }]}>{fund.description}</Text>
            </View>
            <Text style={[styles.fundAllocation, { color: colors.textTertiary }]}>{fund.allocation}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: amount && selectedFund ? colors.primary : colors.border }]}
          onPress={handleSubmit}
          disabled={!amount || !selectedFund}
        >
          <Text style={[styles.submitText, { color: amount && selectedFund ? '#fff' : colors.textSecondary }]}>
            {side === 'buy' ? 'Place Investment' : 'Submit Withdrawal'}
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
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
  dollarSign: { fontSize: 36, fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', minWidth: 100, textAlign: 'center', fontVariant: ['tabular-nums'] },
  quickAmounts: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  quickAmountBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickAmountText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  fundCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  fundInfo: { flex: 1, marginRight: 12 },
  fundName: { fontSize: 15, fontWeight: '600' },
  fundDesc: { fontSize: 13, marginTop: 2 },
  fundAllocation: { fontSize: 12, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600' },
});
