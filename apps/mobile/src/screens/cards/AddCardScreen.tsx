import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import * as cardsApi from '../../api/cards';
import type { CardsScreenProps } from '../../types/navigation';

export function AddCardScreen({ navigation }: CardsScreenProps<'AddCard'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [cardName, setCardName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [network, setNetwork] = useState('');
  const [expiration, setExpiration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');

    if (!cardName.trim()) {
      setError('Please enter a card name');
      return;
    }
    if (lastFour.length !== 4 || !/^\d{4}$/.test(lastFour)) {
      setError('Please enter the last 4 digits of your card');
      return;
    }
    if (!network) {
      setError('Please select a card network');
      return;
    }

    setLoading(true);
    try {
      await cardsApi.addCard({
        cardName,
        lastFour,
        network,
        expirationDate: expiration,
        isPrimary: false,
      });
      navigation.goBack();
    } catch {
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Add Card" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Card Name"
            placeholder="e.g. Chase Sapphire Preferred"
            value={cardName}
            onChangeText={setCardName}
            leftIcon="card-outline"
          />

          <Input
            label="Last 4 Digits"
            placeholder="1234"
            value={lastFour}
            onChangeText={(text) => setLastFour(text.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
          />

          <Input
            label="Card Network"
            placeholder="visa, mastercard, amex, or discover"
            value={network}
            onChangeText={(text) => setNetwork(text.toLowerCase())}
            autoCapitalize="none"
          />

          <Input
            label="Expiration Date"
            placeholder="MM/YY"
            value={expiration}
            onChangeText={setExpiration}
            keyboardType="numeric"
            maxLength={5}
          />

          <Button
            title="Add Card"
            onPress={handleAdd}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
