import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';

type LoanType = 'personal' | 'line_of_credit' | 'secured' | 'emergency';
type TermOption = 12 | 24 | 36 | 48 | 60;

export function LoanApplicationScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState<TermOption>(36);
  const [purpose, setPurpose] = useState('');

  const loanTypes: { value: LoanType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'personal', label: 'Personal Loan', description: 'Fixed rate, fixed term', icon: 'person-outline' },
    { value: 'line_of_credit', label: 'Line of Credit', description: 'Flexible borrowing', icon: 'repeat-outline' },
    { value: 'secured', label: 'Secured Loan', description: 'Lower rate with collateral', icon: 'shield-checkmark-outline' },
    { value: 'emergency', label: 'Emergency Loan', description: 'Fast approval, small amount', icon: 'flash-outline' },
  ];

  const termOptions: TermOption[] = [12, 24, 36, 48, 60];

  const estimatePayment = () => {
    const principal = parseFloat(amount) || 0;
    if (principal <= 0) return 0;
    const rate = 0.0899 / 12; // ~9% APR estimate
    const n = term;
    return (principal * (rate * Math.pow(1 + rate, n))) / (Math.pow(1 + rate, n) - 1);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) < 500) {
      Alert.alert('Invalid Amount', 'Minimum loan amount is $500.');
      return;
    }
    if (parseFloat(amount) > 50000) {
      Alert.alert('Amount Too High', 'Maximum loan amount is $50,000.');
      return;
    }

    Alert.alert(
      'Submit Application',
      `Apply for a ${loanTypes.find(t => t.value === loanType)?.label} of $${parseFloat(amount).toFixed(2)} for ${term} months?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => {
          Alert.alert(
            'Application Submitted',
            'Your loan application has been submitted for review. You will receive a decision within minutes.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
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
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Apply for a Loan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loan Type Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Loan Type</Text>
        {loanTypes.map((lt) => (
          <TouchableOpacity
            key={lt.value}
            style={[
              styles.typeCard,
              { backgroundColor: colors.surface, borderColor: loanType === lt.value ? colors.primary : colors.border },
              loanType === lt.value && { borderWidth: 2 },
            ]}
            onPress={() => setLoanType(lt.value)}
          >
            <Ionicons name={lt.icon} size={24} color={loanType === lt.value ? colors.primary : colors.textSecondary} />
            <View style={styles.typeInfo}>
              <Text style={[styles.typeName, { color: colors.textPrimary }]}>{lt.label}</Text>
              <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>{lt.description}</Text>
            </View>
            {loanType === lt.value && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </TouchableOpacity>
        ))}

        {/* Amount */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>Loan Amount</Text>
        <Card>
          <View style={styles.amountRow}>
            <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.textPrimary }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="5,000"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <Text style={[styles.amountRange, { color: colors.textTertiary }]}>$500 - $50,000</Text>
        </Card>

        {/* Term */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>Loan Term</Text>
        <View style={styles.termRow}>
          {termOptions.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.termBtn,
                { borderColor: term === t ? colors.primary : colors.border },
                term === t && { backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => setTerm(t)}
            >
              <Text style={[styles.termText, { color: term === t ? colors.primary : colors.textSecondary }]}>{t} mo</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purpose */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>Purpose (Optional)</Text>
        <Card>
          <TextInput
            style={[styles.purposeInput, { color: colors.textPrimary }]}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g., Home improvement, debt consolidation"
            placeholderTextColor={colors.textTertiary}
            multiline
          />
        </Card>

        {/* Estimated Payment */}
        {amount && parseFloat(amount) > 0 && (
          <Card elevated style={{ marginTop: spacing.lg }}>
            <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>ESTIMATED MONTHLY PAYMENT</Text>
            <Text style={[styles.estimateValue, { color: colors.primary }]}>~${estimatePayment().toFixed(2)}/mo</Text>
            <Text style={[styles.estimateNote, { color: colors.textTertiary }]}>
              Final rate based on credit evaluation. Estimate assumes ~9% APR.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: amount && parseFloat(amount) >= 500 ? colors.primary : colors.border }]}
          onPress={handleSubmit}
          disabled={!amount || parseFloat(amount) < 500}
        >
          <Text style={[styles.submitText, { color: amount && parseFloat(amount) >= 500 ? '#fff' : colors.textSecondary }]}>
            Submit Application
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
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  typeCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12 },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 15, fontWeight: '600' },
  typeDesc: { fontSize: 13, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 28, marginRight: 4 },
  amountInput: { fontSize: 28, fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] },
  amountRange: { fontSize: 12, marginTop: 8 },
  termRow: { flexDirection: 'row', gap: 8 },
  termBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  termText: { fontSize: 14, fontWeight: '600' },
  purposeInput: { fontSize: 15, minHeight: 60 },
  estimateLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  estimateValue: { fontSize: 24, fontWeight: '700' },
  estimateNote: { fontSize: 12, marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600' },
});
