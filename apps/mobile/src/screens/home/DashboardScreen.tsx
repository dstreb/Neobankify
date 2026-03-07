import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { formatCurrency } from '../../utils/formatters';
import { useSavingsPots } from '../../contexts/SavingsPotsContext';
import {
  MOCK_ACCOUNTS,
  MOCK_TRANSACTIONS,
  MOCK_CARDS,
  MOCK_OFFERS,
  MOCK_NEWS,
  WEEKLY_SPENDING,
} from '../../data/accounts';

// Savings pots come from SavingsPotsContext so Dashboard summary
// and SavingsPotsScreen detail always share the same live state.

export function DashboardScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();
  const { featureFlags } = useTenant();
  const { pots: savingsPots, totalSaved: savingsPotsTotalSaved } = useSavingsPots();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('consolidated');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const selectedAccount = selectedAccountId === 'consolidated'
    ? null
    : MOCK_ACCOUNTS.find((a) => a.id === selectedAccountId) || MOCK_ACCOUNTS[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const totalBalance = MOCK_ACCOUNTS.reduce((sum, acc) => acc.type === 'Credit' ? sum - acc.balance : sum + acc.balance, 0);

  // =====================================================
  // Dark Header - balance, account selector, quick actions
  // =====================================================
  const renderDarkHeader = () => (
    <View style={[styles.darkHeader, { backgroundColor: '#0C1B2A' }]}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ProfileMain')}
        >
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] || 'J').toUpperCase()}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerGreeting}>
          <Text style={styles.greetingText}>
            {greeting()}, {user?.firstName || 'John'} {'\ud83d\udc4b'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBell}
          onPress={() => navigation.navigate('NotificationsList')}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.accountPill} onPress={() => setShowAccountPicker(true)}>
        <Ionicons name={selectedAccount ? 'wallet-outline' : 'apps-outline'} size={14} color="#FFFFFF" />
        <Text style={styles.accountPillText}>
          {selectedAccount
            ? `${selectedAccount.name} ${'\u2022\u2022'}${selectedAccount.lastFour}`
            : 'Consolidated'}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.balanceRow}>
        <Text style={styles.flagEmoji}>{'\ud83c\uddfa\ud83c\uddf8'}</Text>
        <Text style={styles.balanceAmount}> {formatCurrency(selectedAccount ? selectedAccount.balance : totalBalance)}</Text>
        <Ionicons name="trending-up" size={18} color="#10B981" style={{ marginLeft: 6 }} />
      </View>

      <Text style={styles.balanceSubtext}>
        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}  ·  3.25% AER
      </Text>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Wallet', { screen: 'Payments', params: { flow: 'deposit' } })}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="arrow-down-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionLabel}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Wallet', { screen: 'Payments', params: { flow: 'withdraw' } })}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="arrow-up-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionLabel}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Wallet', { screen: 'Payments', params: { flow: 'transfer' } })}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="swap-horizontal-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionLabel}>Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // My Accounts
  // =====================================================
  const renderMyAccounts = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="wallet-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> My Accounts</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {MOCK_ACCOUNTS.map((account, index) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountRow,
              index < MOCK_ACCOUNTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[styles.accountIcon, { backgroundColor: colors.brand10 }]}>
              <Ionicons name={account.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
              <Text style={[styles.accountType, { color: colors.textSecondary }]}>
                {account.type} {'\u2022\u2022'}{account.lastFour}
              </Text>
            </View>
            <View style={styles.accountBalanceRow}>
              <Text style={[styles.accountBalance, { color: colors.textPrimary }]}>
                {formatCurrency(account.balance)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addRow} onPress={() => navigation.navigate('AddAccount')}>
          <Text style={[styles.addRowText, { color: colors.primary }]}>Add New Account</Text>
          <Ionicons name="add" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Latest Activity
  // =====================================================
  const renderLatestActivity = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flash-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Latest Activity</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {MOCK_TRANSACTIONS.length > 0 ? (
          MOCK_TRANSACTIONS.map((txn, index) => (
            <TouchableOpacity
              key={txn.id}
              style={[
                styles.txnRow,
                index < MOCK_TRANSACTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: txn.id })}
            >
              <View style={[styles.txnIcon, { backgroundColor: colors.brand10 }]}>
                <Ionicons name={txn.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnType, { color: colors.textPrimary }]}>{txn.type}</Text>
                <Text style={[styles.txnDesc, { color: colors.textSecondary }]}>{txn.description}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.amount >= 0 ? colors.success : colors.textPrimary }]}>
                {txn.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              You have no transactions yet
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Please make a transaction in order to see your latest activity
            </Text>
            <TouchableOpacity style={[styles.emptyButton, { borderColor: colors.primary }]} onPress={() => navigation.navigate('Wallet', { screen: 'Payments' })}>
              <Text style={[styles.emptyButtonText, { color: colors.primary }]}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // =====================================================
  // Monthly Insight - spending bar chart
  // =====================================================
  const renderMonthlyInsight = () => {
    const maxVal = Math.max(...WEEKLY_SPENDING.map((d) => Math.max(d.income, d.spending)));
    const barMaxHeight = 60;

    return (
      <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pie-chart-outline" size={18} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Monthly Insight</Text>
          </View>
        </View>
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.insightHeader}>
            <View>
              <Text style={[styles.insightAmount, { color: colors.textPrimary }]}>$182.22</Text>
              <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Spent on August</Text>
            </View>
            <TouchableOpacity style={styles.insightMonthPicker}>
              <Text style={[styles.insightMonthText, { color: colors.textSecondary }]}>Aug 2026</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            {WEEKLY_SPENDING.map((day) => (
              <View key={day.day} style={styles.chartBar}>
                <View style={styles.barGroup}>
                  <View
                    style={[
                      styles.bar,
                      { height: (day.income / maxVal) * barMaxHeight, backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      { height: (day.spending / maxVal) * barMaxHeight, backgroundColor: '#F59E0B' },
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Spending</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // =====================================================
  // Wealth Section - feature-flagged
  // =====================================================
  const renderWealthSection = () => {
    if (!featureFlags.investingEnabled && !featureFlags.tradingEnabled && !featureFlags.lendingEnabled) {
      return null;
    }
    return (
      <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trending-up" size={18} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Wealth</Text>
          </View>
        </View>
        <View style={styles.wealthGrid}>
          {featureFlags.investingEnabled && (
            <TouchableOpacity
              style={[styles.wealthCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('InvestingDashboard')}
            >
              <View style={[styles.wealthIcon, { backgroundColor: colors.brand10 }]}>
                <Ionicons name="trending-up" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.wealthLabel, { color: colors.textPrimary }]}>Investing</Text>
            </TouchableOpacity>
          )}
          {featureFlags.tradingEnabled && (
            <TouchableOpacity
              style={[styles.wealthCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('TradingDashboard')}
            >
              <View style={[styles.wealthIcon, { backgroundColor: colors.brand10 }]}>
                <Ionicons name="bar-chart" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.wealthLabel, { color: colors.textPrimary }]}>Trading</Text>
            </TouchableOpacity>
          )}
          {featureFlags.lendingEnabled && (
            <TouchableOpacity
              style={[styles.wealthCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('LendingDashboard')}
            >
              <View style={[styles.wealthIcon, { backgroundColor: colors.brand10 }]}>
                <Ionicons name="cash" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.wealthLabel, { color: colors.textPrimary }]}>Lending</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // =====================================================
  // Savings Pots
  // =====================================================
  const renderSavingsPots = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bag-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Savings Pots</Text>
        </View>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.potsHeader}>
          <View>
            <Text style={[styles.potsTotalAmount, { color: colors.textPrimary }]}>
              {formatCurrency(savingsPotsTotalSaved)}
            </Text>
            <Text style={[styles.potsTotalLabel, { color: colors.textSecondary }]}>Total Saving Pot</Text>
          </View>
          <TouchableOpacity style={[styles.addPotButton, { backgroundColor: colors.brand10 }]} onPress={() => navigation.navigate('SavingsPots')}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.potsGrid}>
          {savingsPots.map((pot) => {
            const progress = pot.goalAmount > 0 ? pot.currentAmount / pot.goalAmount : 0;
            return (
              <TouchableOpacity
                key={pot.id}
                style={[styles.potCard, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
                onPress={() => navigation.navigate('SavingsPots')}
              >
                <Text style={[styles.potAmount, { color: colors.textPrimary }]}>
                  {formatCurrency(pot.currentAmount)}
                </Text>
                <Text style={[styles.potName, { color: colors.textSecondary }]}>{pot.name}</Text>
                <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.potMeta, { color: colors.textTertiary }]}>
                  {formatCurrency(pot.goalAmount)} Goal  ·  {pot.targetDate}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  // =====================================================
  // Exchange Rate
  // =====================================================
  const renderExchangeRate = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="swap-horizontal-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Exchange Rate</Text>
        </View>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.exchangeHeader}>
          <Text style={[styles.exchangeLabel, { color: colors.textSecondary }]}>1 SGD is equal to</Text>
        </View>
        <View style={styles.exchangeRateRow}>
          <Text style={styles.flagEmoji}>{'\ud83c\uddf8\ud83c\uddec'}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} style={{ marginHorizontal: 8 }} />
          <Text style={[styles.exchangeRateValue, { color: colors.textPrimary }]}>0.61218 USD</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.exchangeDate, { color: colors.textTertiary }]}>
          Fri, May 25 2025 at 12:02 AM
        </Text>
        <View style={[styles.exchangeChart, { borderTopColor: colors.borderLight }]}>
          <View style={styles.exchangeDays}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <Text key={day} style={[styles.exchangeDayLabel, { color: colors.textTertiary }]}>{day}</Text>
            ))}
          </View>
        </View>
        <View style={styles.timeFilters}>
          {['1d', '1w', '1m', '1y', 'All'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeFilter, tf === '1d' && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.timeFilterText, { color: tf === '1d' ? '#FFFFFF' : colors.textSecondary }]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // =====================================================
  // My Card
  // =====================================================
  const renderMyCard = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="card-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> My Card</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {MOCK_CARDS.map((cardItem, index) => (
          <TouchableOpacity
            key={cardItem.id}
            style={[
              styles.cardItemRow,
              index < MOCK_CARDS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[styles.cardItemIcon, { backgroundColor: cardItem.id === '1' ? '#1E293B' : '#D97706' }]}>
              <Ionicons name="card" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cardItemInfo}>
              <Text style={[styles.cardItemName, { color: colors.textPrimary }]}>{cardItem.name}</Text>
              <Text style={[styles.cardItemType, { color: colors.textSecondary }]}>
                {cardItem.type} {'\u2022\u2022'}{cardItem.lastFour}
              </Text>
            </View>
            <Text style={[styles.cardItemBalance, { color: colors.textPrimary }]}>
              {formatCurrency(cardItem.balance)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addRow}>
          <Text style={[styles.addRowText, { color: colors.primary }]}>Add New Card</Text>
          <Ionicons name="add" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Offers & Promo
  // =====================================================
  const renderOffersPromo = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="pricetag-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> Offers & Promo</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {MOCK_OFFERS.map((offer, index) => (
          <View
            key={offer.id}
            style={[
              styles.offerRow,
              index < MOCK_OFFERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[styles.offerBrandIcon, { backgroundColor: offer.color + '15' }]}>
              <Text style={[styles.offerBrandLetter, { color: offer.color }]}>
                {offer.brand[0]}
              </Text>
            </View>
            <View style={styles.offerInfo}>
              <View style={styles.offerTitleRow}>
                <Text style={[styles.offerBrand, { color: colors.textPrimary }]}>{offer.brand}</Text>
                <View style={[styles.offerBadge, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="time-outline" size={10} color={colors.error} />
                  <Text style={[styles.offerBadgeText, { color: colors.error }]}> Ends in {offer.endsIn}</Text>
                </View>
              </View>
              <Text style={[styles.offerDesc, { color: colors.textSecondary }]}>
                {offer.description} {'\ud83c\udf81'}
              </Text>
              <TouchableOpacity style={styles.activateRow}>
                <Text style={[styles.activateText, { color: colors.primary }]}>Activate Offer</Text>
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // =====================================================
  // News & Resources - horizontal scroll
  // =====================================================
  const renderNewsResources = () => (
    <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="newspaper-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> News & Resources</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {MOCK_NEWS.map((news) => (
          <TouchableOpacity
            key={news.id}
            style={[styles.newsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.newsImagePlaceholder, { backgroundColor: colors.brand10 }]}>
              <Ionicons name="image-outline" size={32} color={colors.primary} />
            </View>
            <View style={styles.newsContent}>
              <Text style={[styles.newsDate, { color: colors.textTertiary }]}>{news.date}</Text>
              <Text style={[styles.newsTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {news.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // =====================================================
  // Main Render
  // =====================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0C1B2A' }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        showsVerticalScrollIndicator={false}
      >
        {renderDarkHeader()}
        {renderMyAccounts()}
        {renderLatestActivity()}
        {renderMonthlyInsight()}
        {renderWealthSection()}
        {renderSavingsPots()}
        {renderExchangeRate()}
        {renderMyCard()}
        {renderOffersPromo()}
        {renderNewsResources()}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAccountPicker(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Select Account</Text>

            {/* Consolidated option */}
            <TouchableOpacity
              style={[
                styles.pickerItem,
                selectedAccountId === 'consolidated' && { backgroundColor: colors.brand10 },
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => { setSelectedAccountId('consolidated'); setShowAccountPicker(false); }}
            >
              <View style={[styles.pickerIcon, { backgroundColor: selectedAccountId === 'consolidated' ? colors.primary : colors.brand10 }]}>
                <Ionicons name="apps-outline" size={20} color={selectedAccountId === 'consolidated' ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={styles.pickerInfo}>
                <Text style={[styles.pickerName, { color: colors.textPrimary }]}>Consolidated</Text>
                <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>All accounts combined</Text>
              </View>
              <Text style={[styles.pickerBalance, { color: colors.textPrimary }]}>{formatCurrency(totalBalance)}</Text>
              {selectedAccountId === 'consolidated' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>

            {/* Individual accounts */}
            {MOCK_ACCOUNTS.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.pickerItem,
                  selectedAccountId === account.id && { backgroundColor: colors.brand10 },
                  { borderBottomColor: colors.borderLight },
                ]}
                onPress={() => { setSelectedAccountId(account.id); setShowAccountPicker(false); }}
              >
                <View style={[styles.pickerIcon, { backgroundColor: selectedAccountId === account.id ? colors.primary : colors.brand10 }]}>
                  <Ionicons name={account.icon} size={20} color={selectedAccountId === account.id ? '#FFFFFF' : colors.primary} />
                </View>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerName, { color: colors.textPrimary }]}>{account.name}</Text>
                  <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>{account.type} {'\u2022\u2022'}{account.lastFour}</Text>
                </View>
                <Text style={[styles.pickerBalance, { color: colors.textPrimary }]}>{formatCurrency(account.balance)}</Text>
                {selectedAccountId === account.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}

            {/* Add Account */}
            <TouchableOpacity
              style={[styles.pickerItem, styles.pickerAddRow]}
              onPress={() => { setShowAccountPicker(false); navigation.navigate('AddAccount'); }}
            >
              <View style={[styles.pickerIcon, { backgroundColor: colors.brand10 }]}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.pickerAddText, { color: colors.primary }]}>Add Account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// Styles
// =====================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // === Dark Header ===
  darkHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerGreeting: {
    flex: 1,
    marginLeft: 12,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
    gap: 6,
  },
  accountPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  flagEmoji: { fontSize: 20 },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  balanceSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  quickActionBtn: { alignItems: 'center' },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 6,
  },
  quickActionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // === Sections ===
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // === Card container ===
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // === My Accounts ===
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 13, marginTop: 1 },
  accountBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  addRowText: { fontSize: 14, fontWeight: '600' },

  // === Latest Activity ===
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: { flex: 1, marginLeft: 12 },
  txnType: { fontSize: 15, fontWeight: '600' },
  txnDesc: { fontSize: 13, marginTop: 1 },
  txnAmount: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '600' },

  // === Monthly Insight ===
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  insightAmount: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  insightLabel: { fontSize: 13, marginTop: 2 },
  insightMonthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightMonthText: { fontSize: 13, fontWeight: '500' },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 100,
  },
  chartBar: { alignItems: 'center', flex: 1 },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: { width: 8, borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 11, marginTop: 6 },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },

  // === Savings Pots ===
  potsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  potsTotalAmount: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  potsTotalLabel: { fontSize: 13, marginTop: 2 },
  addPotButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  potCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  potAmount: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  potName: { fontSize: 13, marginTop: 2, marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 6 },
  progressFill: { height: 4, borderRadius: 2 },
  potMeta: { fontSize: 11 },

  // === Exchange Rate ===
  exchangeHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  exchangeLabel: { fontSize: 13 },
  exchangeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  exchangeRateValue: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  exchangeDate: { fontSize: 12, paddingHorizontal: 16, paddingBottom: 12 },
  exchangeChart: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  exchangeDays: { flexDirection: 'row', justifyContent: 'space-between' },
  exchangeDayLabel: { fontSize: 11 },
  timeFilters: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  timeFilter: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  timeFilterText: { fontSize: 12, fontWeight: '600' },

  // === My Card ===
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardItemIcon: {
    width: 36,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemInfo: { flex: 1, marginLeft: 12 },
  cardItemName: { fontSize: 14, fontWeight: '600' },
  cardItemType: { fontSize: 12, marginTop: 1 },
  cardItemBalance: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },

  // === Offers ===
  offerRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  offerBrandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBrandLetter: { fontSize: 20, fontWeight: '700' },
  offerInfo: { flex: 1, marginLeft: 12 },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerBrand: { fontSize: 15, fontWeight: '600' },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  offerBadgeText: { fontSize: 11, fontWeight: '500' },
  offerDesc: { fontSize: 13, marginTop: 2 },
  activateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  activateText: { fontSize: 13, fontWeight: '600' },

  // === News & Resources ===
  newsCard: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
  },
  newsImagePlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: { padding: 10 },
  newsDate: { fontSize: 11 },
  newsTitle: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },

  // === Wealth Section ===
  wealthGrid: { flexDirection: 'row', gap: 12 },
  wealthCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  wealthIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  wealthLabel: { fontSize: 14, fontWeight: '600' },

  // Account Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pickerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  pickerBalance: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pickerAddRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  pickerAddText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});
