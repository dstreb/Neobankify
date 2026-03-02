import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';
import { formatCurrency } from '../../utils/formatters';

type PaymentType = 'minimum' | 'full' | 'custom';

export function MakePaymentScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [paymentType, setPaymentType] = useState<PaymentType>('minimum');
  const [customAmount, setCustomAmount] = useState('');

  const minimumPayment = 305.50;
  const currentBalance = 11250.00;

  const getPaymentAmount = (): number => {
    switch (paymentType) {
      case 'minimum': return minimumPayment;
      case 'full': return currentBalance;
      case 'custom': return parseFloat(customAmount) || 0;
    }
  };

  const handleSubmit = () => {
    const amount = getPaymentAmount();
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ${formatCurrency(amount)} toward your Personal Loan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => {
          Alert.alert('Payment Submitted', 'Your payment has been processed successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }},
      ],
    );
  };

  const paymentOptions: { type: PaymentType; label: string; sublabel: string }[] = [
    { type: 'minimum', label: 'Minimum Payment', sublabel: formatCurrency(minimumPayment) },
    { type: 'full', label: 'Pay in Full', sublabel: formatCurrency(currentBalance) },
    { type: 'custom', label: 'Custom Amount', sublabel: 'Enter amount' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Make Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.loanLabel, { color: colors.textSecondary }]}>Personal Loan</Text>
          <Text style={[styles.loanBalance, { color: colors.textPrimary }]}>{formatCurrency(currentBalance)}</Text>
          <Text style={[styles.loanSub, { color: colors.textSecondary }]}>Outstanding balance</Text>
        </Card>

        {/* Payment Type */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Amount</Text>
        {paymentOptions.map((opt) => (
          <TouchableOpacity
            key={opt.type}
            style={[
              styles.optionCard,
              { backgroundColor: colors.surface, borderColor: paymentType === opt.type ? colors.primary : colors.border },
              paymentType === opt.type && { borderWidth: 2 },
            ]}
            onPress={() => setPaymentType(opt.type)}
          >
            <View style={[styles.radio, { borderColor: paymentType === opt.type ? colors.primary : colors.border }]}>
              {paymentType === opt.type && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
              <Text style={[styles.optionSublabel, { color: colors.textSecondary }]}>{opt.sublabel}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Custom Amount Input */}
        {paymentType === 'custom' && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.customInputRow}>
              <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.customInput, { color: colors.textPrimary }]}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
            </View>
          </Card>
        )}

        {/* Payment Source */}
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>PAYMENT SOURCE</Text>
          <View style={styles.sourceRow}>
            <Ionicons name="business-outline" size={20} color={colors.primary} />
            <View style={styles.sourceInfo}>
              <Text style={[styles.sourceName, { color: colors.textPrimary }]}>Checking Account</Text>
              <Text style={[styles.sourceAccount, { color: colors.textSecondary }]}>**** 4521</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: getPaymentAmount() > 0 ? colors.primary : colors.border }]}
          onPress={handleSubmit}
          disabled={getPaymentAmount() <= 0}
        >
          <Text style={[styles.submitText, { color: getPaymentAmount() > 0 ? '#fff' : colors.textSecondary }]}>
            Pay {getPaymentAmount() > 0 ? formatCurrency(getPaymentAmount()) : ''}
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
  loanLabel: { fontSize: 14 },
  loanBalance: { fontSize: 28, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  loanSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionSublabel: { fontSize: 13, marginTop: 2 },
  customInputRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 28, marginRight: 4 },
  customInput: { fontSize: 28, fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] },
  sourceLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '600' },
  sourceAccount: { fontSize: 13, marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600' },
});
