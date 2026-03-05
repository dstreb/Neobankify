import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const MOCK_OFFERS = [
  { id: '1', brand: "McDonald's", description: '10% Cashback your first order!', endsIn: '3d', color: '#DA291C', category: 'Food' },
  { id: '2', brand: 'Walmart', description: '25% Cashback your first order!', endsIn: '3d', color: '#0071CE', category: 'Shopping' },
  { id: '3', brand: 'Amazon', description: '5% Cashback on all purchases!', endsIn: '7d', color: '#FF9900', category: 'Shopping' },
  { id: '4', brand: 'Uber', description: '15% off your next 3 rides!', endsIn: '5d', color: '#000000', category: 'Transport' },
  { id: '5', brand: 'Spotify', description: '3 months free Premium!', endsIn: '14d', color: '#1DB954', category: 'Entertainment' },
  { id: '6', brand: 'Nike', description: '20% off on new arrivals!', endsIn: '2d', color: '#111111', category: 'Shopping' },
];

const CATEGORIES = ['All', 'Shopping', 'Food', 'Transport', 'Entertainment'];

export function OffersTabScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredOffers = selectedCategory === 'All'
    ? MOCK_OFFERS
    : MOCK_OFFERS.filter((o) => o.category === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with profile avatar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Offers & Rewards</Text>
        <TouchableOpacity
          style={[styles.profileAvatar, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ProfileMain')}
        >
          <Text style={styles.profileAvatarText}>
            {(user?.firstName?.[0] || 'J').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              selectedCategory === cat
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#FFFFFF' : colors.textSecondary }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Offers list */}
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }]} showsVerticalScrollIndicator={false}>
        {filteredOffers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.offerBrandIcon, { backgroundColor: offer.color + '15' }]}>
              <Text style={[styles.offerBrandLetter, { color: offer.color }]}>{offer.brand[0]}</Text>
            </View>
            <View style={styles.offerInfo}>
              <View style={styles.offerTitleRow}>
                <Text style={[styles.offerBrand, { color: colors.textPrimary }]}>{offer.brand}</Text>
                <View style={[styles.offerBadge, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="time-outline" size={10} color={colors.error} />
                  <Text style={[styles.offerBadgeText, { color: colors.error }]}> Ends in {offer.endsIn}</Text>
                </View>
              </View>
              <Text style={[styles.offerDesc, { color: colors.textSecondary }]}>{offer.description}</Text>
              <TouchableOpacity style={styles.activateRow}>
                <Text style={[styles.activateText, { color: colors.primary }]}>Activate Offer</Text>
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
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
  categoryBar: { flexGrow: 0, paddingVertical: 12 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  content: { paddingTop: 8, paddingBottom: 32 },
  offerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  offerBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBrandLetter: { fontSize: 22, fontWeight: '700' },
  offerInfo: { flex: 1, marginLeft: 12 },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerBrand: { fontSize: 15, fontWeight: '600' },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  offerBadgeText: { fontSize: 11, fontWeight: '500' },
  offerDesc: { fontSize: 13, marginTop: 4 },
  activateRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  activateText: { fontSize: 13, fontWeight: '600' },
});
