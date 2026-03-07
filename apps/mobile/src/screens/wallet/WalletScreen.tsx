import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_ACCOUNTS, MOCK_CARDS } from '../../data/accounts';

// Card colors derived locally (shared MockCard type doesn't include color)
const CARD_COLORS: Record<string, string> = {
  '1': '#1E293B',
  '2': '#D97706',
};

export function WalletScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with profile avatar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Wallet</Text>
        <TouchableOpacity
          style={[styles.profileAvatar, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ProfileMain')}
        >
          <Text style={styles.profileAvatarText}>
            {(user?.firstName?.[0] || 'J').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Cards Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Cards</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {MOCK_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.cardItem, { backgroundColor: CARD_COLORS[card.id] || '#1E293B' }]}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Ionicons name="card" size={24} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.cardNumber}>{'\u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  '}{card.lastFour}</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardType}>{card.type}</Text>
                <Text style={styles.cardBalance}>{formatCurrency(card.balance)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Accounts Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Linked Accounts</Text>
          </View>
          <View style={[styles.accountsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {MOCK_ACCOUNTS.map((account, index) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountRow,
                  index < MOCK_ACCOUNTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                ]}
              >
                <View style={[styles.accountIcon, { backgroundColor: colors.brand10 }]}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
                  <Text style={[styles.accountType, { color: colors.textSecondary }]}>
                    {account.type} {'\u2022\u2022'}{account.lastFour}
                  </Text>
                </View>
                <Text style={[styles.accountBalance, { color: colors.textPrimary }]}>
                  {formatCurrency(account.balance)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'send-outline' as const, label: 'Send Money' },
              { icon: 'qr-code-outline' as const, label: 'Scan & Pay' },
              { icon: 'receipt-outline' as const, label: 'Pay Bills' },
              { icon: 'globe-outline' as const, label: 'International' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.brand10 }]}>
                  <Ionicons name={action.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  // Cards
  cardItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cardNumber: { color: 'rgba(255,255,255,0.7)', fontSize: 14, letterSpacing: 2, marginBottom: 16 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  cardBalance: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Accounts
  accountsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  accountIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 13, marginTop: 1 },
  accountBalance: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
});
