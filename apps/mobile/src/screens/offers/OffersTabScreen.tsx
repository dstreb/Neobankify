import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  REWARDS_ACCOUNTS,
  REWARDS_OFFERS,
  AVAILABLE_PROGRAMS,
  formatPoints,
  getTotalPointsValue,
  getTotalPoints,
} from '../../data/rewardsAccounts';
import type { RewardsAccount, RewardsOffer } from '../../data/rewardsAccounts';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

type ScreenStep = 'overview' | 'account_detail' | 'add_account' | 'link_success' | 'buy_points' | 'sell_points';

export function OffersTabScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();

  const [step, setStep] = useState<ScreenStep>('overview');
  const [accounts, setAccounts] = useState<RewardsAccount[]>(REWARDS_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<RewardsAccount | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [selectedRewardsId, setSelectedRewardsId] = useState<string>('consolidated');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [linkMemberId, setLinkMemberId] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');

  const totalCashValue = getTotalPointsValue(accounts);
  const totalPoints = getTotalPoints(accounts);

  const selectedRewardsAccount = selectedRewardsId === 'consolidated'
    ? null
    : accounts.find((a) => a.id === selectedRewardsId) || null;

  const displayBalance = selectedRewardsAccount
    ? formatCurrency(selectedRewardsAccount.pointsBalance * selectedRewardsAccount.cashValuePerPoint)
    : formatCurrency(totalCashValue);

  const displayPoints = selectedRewardsAccount
    ? `${formatPoints(selectedRewardsAccount.pointsBalance)} ${selectedRewardsAccount.pointsUnit}`
    : `${formatPoints(totalPoints)} Total Points`;

  const handleBack = () => {
    switch (step) {
      case 'account_detail': setStep('overview'); setSelectedAccount(null); break;
      case 'add_account': setStep('overview'); break;
      case 'link_success': setStep('overview'); break;
      case 'buy_points': setStep('account_detail'); break;
      case 'sell_points': setStep('account_detail'); break;
      default: setStep('overview');
    }
  };

  const openAccountDetail = (account: RewardsAccount) => {
    setSelectedAccount(account);
    setStep('account_detail');
  };

  const handleLinkAccount = () => {
    if (!selectedProgramId) return;
    const program = AVAILABLE_PROGRAMS.find((p) => p.id === selectedProgramId);
    if (!program) return;
    const newAccount: RewardsAccount = {
      id: `r${Date.now()}`,
      name: program.name,
      programName: program.name,
      icon: program.icon,
      color: program.color,
      type: program.type,
      pointsBalance: Math.floor(Math.random() * 10000) + 500,
      pointsUnit: 'Points',
      cashValuePerPoint: 0.01,
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      memberSince: 'Mar 2026',
      tier: 'Member',
      linkedSince: 'Mar 2026',
      buyRatePerPoint: 0.015,
      sellRatePerPoint: 0.007,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setStep('link_success');
  };

  const handleBuyPoints = () => {
    if (!selectedAccount || !tradeAmount) return;
    const pointsToBuy = parseInt(tradeAmount, 10);
    if (isNaN(pointsToBuy) || pointsToBuy <= 0) return;
    setAccounts((prev) => prev.map((a) => a.id === selectedAccount.id ? { ...a, pointsBalance: a.pointsBalance + pointsToBuy } : a));
    setSelectedAccount({ ...selectedAccount, pointsBalance: selectedAccount.pointsBalance + pointsToBuy });
    setTradeAmount('');
    setStep('account_detail');
  };

  const handleSellPoints = () => {
    if (!selectedAccount || !tradeAmount) return;
    const pointsToSell = parseInt(tradeAmount, 10);
    if (isNaN(pointsToSell) || pointsToSell <= 0 || pointsToSell > selectedAccount.pointsBalance) return;
    setAccounts((prev) => prev.map((a) => a.id === selectedAccount.id ? { ...a, pointsBalance: a.pointsBalance - pointsToSell } : a));
    setSelectedAccount({ ...selectedAccount, pointsBalance: selectedAccount.pointsBalance - pointsToSell });
    setTradeAmount('');
    setStep('account_detail');
  };

  // Render: Rewards Account Picker Modal
  const renderAccountPickerModal = () => (
    <Modal visible={showAccountPicker} transparent animationType="slide">
      <Pressable style={st.modalOverlay} onPress={() => setShowAccountPicker(false)}>
        <Pressable style={[st.modalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={st.modalHandle} />
          <Text style={[st.modalTitle, { color: colors.textPrimary }]}>Select Rewards Account</Text>
          <TouchableOpacity
            style={[st.modalAccountRow, selectedRewardsId === 'consolidated' && { backgroundColor: colors.brand10 }, { borderBottomColor: colors.borderLight, borderBottomWidth: 1 }]}
            onPress={() => { setSelectedRewardsId('consolidated'); setShowAccountPicker(false); }}
          >
            <View style={[st.modalAccountIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="apps-outline" size={20} color={colors.primary} />
            </View>
            <View style={st.modalAccountInfo}>
              <Text style={[st.modalAccountName, { color: colors.textPrimary }]}>Consolidated</Text>
              <Text style={[st.modalAccountSub, { color: colors.textSecondary }]}>{formatPoints(totalPoints)} Total Points</Text>
            </View>
            <Text style={[st.modalAccountBalance, { color: colors.textPrimary }]}>{formatCurrency(totalCashValue)}</Text>
          </TouchableOpacity>
          {accounts.map((account, index) => (
            <TouchableOpacity
              key={account.id}
              style={[st.modalAccountRow, selectedRewardsId === account.id && { backgroundColor: colors.brand10 }, index < accounts.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 }]}
              onPress={() => { setSelectedRewardsId(account.id); setShowAccountPicker(false); }}
            >
              <View style={[st.modalAccountIcon, { backgroundColor: account.color + '20' }]}>
                <Ionicons name={account.icon as any} size={20} color={account.color} />
              </View>
              <View style={st.modalAccountInfo}>
                <Text style={[st.modalAccountName, { color: colors.textPrimary }]}>{account.name}</Text>
                <Text style={[st.modalAccountSub, { color: colors.textSecondary }]}>{formatPoints(account.pointsBalance)} {account.pointsUnit}</Text>
              </View>
              <Text style={[st.modalAccountBalance, { color: colors.textPrimary }]}>{formatCurrency(account.pointsBalance * account.cashValuePerPoint)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={st.modalAddRow} onPress={() => { setShowAccountPicker(false); setStep('add_account'); }}>
            <Text style={[st.modalAddText, { color: colors.primary }]}>Add Rewards Account</Text>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Render: Overview
  const renderOverview = () => (
    <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[st.darkHeader, { backgroundColor: '#0C1B2A' }]}>
        <View style={st.headerTopRow}>
          <TouchableOpacity style={[st.avatar, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ProfileMain')}>
            <Text style={st.avatarText}>{(user?.firstName?.[0] || 'J').toUpperCase()}</Text>
          </TouchableOpacity>
          <View style={st.headerGreeting}>
            <Text style={st.greetingText}>Rewards & Offers</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileMain')}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={st.accountPill} onPress={() => setShowAccountPicker(true)}>
          <Ionicons name={selectedRewardsAccount ? (selectedRewardsAccount.icon as any) : 'apps-outline'} size={14} color="#FFFFFF" />
          <Text style={st.accountPillText}>{selectedRewardsAccount ? `${selectedRewardsAccount.name} ${selectedRewardsAccount.accountNumber}` : 'Consolidated'}</Text>
          <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={st.balanceAmount}>{displayBalance}</Text>
        <Text style={st.balanceSubtext}>{displayPoints}</Text>
        <View style={st.quickActions}>
          <TouchableOpacity style={st.quickActionBtn} onPress={() => setStep('add_account')}>
            <View style={st.quickActionIcon}><Ionicons name="add-outline" size={22} color="#FFFFFF" /></View>
            <Text style={st.quickActionLabel}>Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.quickActionBtn} onPress={() => { if (accounts.length > 0) { setSelectedAccount(accounts[0]); setTradeAmount(''); setStep('buy_points'); } }}>
            <View style={st.quickActionIcon}><Ionicons name="arrow-down-outline" size={22} color="#FFFFFF" /></View>
            <Text style={st.quickActionLabel}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.quickActionBtn} onPress={() => { if (accounts.length > 0) { setSelectedAccount(accounts[0]); setTradeAmount(''); setStep('sell_points'); } }}>
            <View style={st.quickActionIcon}><Ionicons name="arrow-up-outline" size={22} color="#FFFFFF" /></View>
            <Text style={st.quickActionLabel}>Sell</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={[st.section, { paddingHorizontal: spacing.md }]}>
          <View style={st.sectionHeader}>
            <View style={st.sectionTitleRow}>
              <Ionicons name="gift-outline" size={18} color={colors.textPrimary} />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}> Rewards Accounts</Text>
            </View>
            <TouchableOpacity><Text style={[st.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>
          <View style={[st.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {accounts.map((account, index) => (
              <TouchableOpacity key={account.id} style={[st.accountRow, index < accounts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]} onPress={() => openAccountDetail(account)}>
                <View style={[st.accountIcon, { backgroundColor: account.color + '15' }]}>
                  <Ionicons name={account.icon as any} size={20} color={account.color} />
                </View>
                <View style={st.accountInfo}>
                  <Text style={[st.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
                  <Text style={[st.accountType, { color: colors.textSecondary }]}>{account.tier} {'\u2022'} {account.accountNumber}</Text>
                </View>
                <View style={st.accountBalanceCol}>
                  <Text style={[st.accountBalancePoints, { color: colors.textPrimary }]}>{formatPoints(account.pointsBalance)} {account.pointsUnit}</Text>
                  <Text style={[st.accountBalanceCash, { color: colors.textSecondary }]}>{formatCurrency(account.pointsBalance * account.cashValuePerPoint)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.addAccountRow} onPress={() => setStep('add_account')}>
              <Text style={[st.addAccountText, { color: colors.primary }]}>Add Rewards Account</Text>
              <Ionicons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[st.section, { paddingHorizontal: spacing.md }]}>
          <View style={st.sectionHeader}>
            <View style={st.sectionTitleRow}>
              <Ionicons name="pricetag-outline" size={18} color={colors.textPrimary} />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}> Featured Offers</Text>
            </View>
          </View>
          {REWARDS_OFFERS.slice(0, 6).map((offer) => {
            const offerAccount = accounts.find((a) => a.id === offer.accountId);
            return (
              <TouchableOpacity key={offer.id} style={[st.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => offerAccount && openAccountDetail(offerAccount)}>
                <View style={[st.offerBrandIcon, { backgroundColor: (offerAccount?.color || '#999') + '15' }]}>
                  <Ionicons name={(offerAccount?.icon as any) || 'gift'} size={20} color={offerAccount?.color || '#999'} />
                </View>
                <View style={st.offerInfo}>
                  <View style={st.offerTitleRow}>
                    <Text style={[st.offerBrand, { color: colors.textPrimary }]}>{offer.title}</Text>
                    <View style={[st.offerBadge, { backgroundColor: colors.brand10 }]}>
                      <Text style={[st.offerBadgeText, { color: colors.primary }]}>{offerAccount?.name || 'Rewards'}</Text>
                    </View>
                  </View>
                  <Text style={[st.offerDesc, { color: colors.textSecondary }]}>{offer.description}</Text>
                  {offer.pointsCost > 0 && (
                    <Text style={[st.offerCost, { color: colors.textTertiary }]}>{formatPoints(offer.pointsCost)} pts {'\u2022'} {formatCurrency(offer.cashValue)} value</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
      {renderAccountPickerModal()}
    </SafeAreaView>
  );

  // Render: Account Detail / Management
  const renderAccountDetail = () => {
    if (!selectedAccount) return null;
    const accountOffers = REWARDS_OFFERS.filter((o) => o.accountId === selectedAccount.id);
    const cashValue = selectedAccount.pointsBalance * selectedAccount.cashValuePerPoint;
    return (
      <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[st.detailHeader, { backgroundColor: selectedAccount.color }]}>
          <View style={st.detailHeaderTop}>
            <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={22} color="#FFFFFF" /></TouchableOpacity>
            <Text style={st.detailHeaderTitle}>{selectedAccount.name}</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={st.detailBalanceSection}>
            <Text style={st.detailPoints}>{formatPoints(selectedAccount.pointsBalance)} {selectedAccount.pointsUnit}</Text>
            <Text style={st.detailCash}>{formatCurrency(cashValue)}</Text>
            <View style={st.detailMeta}>
              <Text style={st.detailMetaText}>{selectedAccount.tier} Member</Text>
              <Text style={st.detailMetaText}>{'\u2022'}</Text>
              <Text style={st.detailMetaText}>Since {selectedAccount.memberSince}</Text>
            </View>
          </View>
          <View style={st.detailActions}>
            <TouchableOpacity style={st.detailActionBtn} onPress={() => { setTradeAmount(''); setStep('buy_points'); }}>
              <Ionicons name="arrow-down-circle-outline" size={24} color="#FFFFFF" />
              <Text style={st.detailActionLabel}>Buy Points</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.detailActionBtn} onPress={() => { setTradeAmount(''); setStep('sell_points'); }}>
              <Ionicons name="arrow-up-circle-outline" size={24} color="#FFFFFF" />
              <Text style={st.detailActionLabel}>Sell Points</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.detailActionBtn}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
              <Text style={st.detailActionLabel}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[st.section, { paddingHorizontal: spacing.md }]}>
            <View style={[st.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={st.infoRow}>
                <Text style={[st.infoLabel, { color: colors.textSecondary }]}>Program</Text>
                <Text style={[st.infoValue, { color: colors.textPrimary }]}>{selectedAccount.programName}</Text>
              </View>
              <View style={[st.infoRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <Text style={[st.infoLabel, { color: colors.textSecondary }]}>Account</Text>
                <Text style={[st.infoValue, { color: colors.textPrimary }]}>{selectedAccount.accountNumber}</Text>
              </View>
              <View style={[st.infoRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <Text style={[st.infoLabel, { color: colors.textSecondary }]}>Tier</Text>
                <Text style={[st.infoValue, { color: colors.textPrimary }]}>{selectedAccount.tier}</Text>
              </View>
              <View style={[st.infoRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <Text style={[st.infoLabel, { color: colors.textSecondary }]}>Point Value</Text>
                <Text style={[st.infoValue, { color: colors.textPrimary }]}>1 {selectedAccount.pointsUnit.replace(/s$/, '')} = {formatCurrency(selectedAccount.cashValuePerPoint)}</Text>
              </View>
              <View style={[st.infoRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <Text style={[st.infoLabel, { color: colors.textSecondary }]}>Linked Since</Text>
                <Text style={[st.infoValue, { color: colors.textPrimary }]}>{selectedAccount.linkedSince}</Text>
              </View>
            </View>
          </View>
          <View style={[st.section, { paddingHorizontal: spacing.md }]}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <Ionicons name="trending-up" size={18} color={colors.textPrimary} />
                <Text style={[st.sectionTitle, { color: colors.textPrimary }]}> Point Rates</Text>
              </View>
            </View>
            <View style={st.ratesRow}>
              <View style={[st.rateCard, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}>
                <Text style={[st.rateLabel, { color: '#065F46' }]}>Buy Rate</Text>
                <Text style={[st.rateValue, { color: '#065F46' }]}>{formatCurrency(selectedAccount.buyRatePerPoint)}/pt</Text>
              </View>
              <View style={[st.rateCard, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <Text style={[st.rateLabel, { color: '#991B1B' }]}>Sell Rate</Text>
                <Text style={[st.rateValue, { color: '#991B1B' }]}>{formatCurrency(selectedAccount.sellRatePerPoint)}/pt</Text>
              </View>
            </View>
          </View>
          <View style={[st.section, { paddingHorizontal: spacing.md }]}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.textPrimary} />
                <Text style={[st.sectionTitle, { color: colors.textPrimary }]}> Available Offers</Text>
              </View>
            </View>
            {accountOffers.length > 0 ? accountOffers.map((offer) => (
              <View key={offer.id} style={[st.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[st.offerBrandIcon, { backgroundColor: selectedAccount.color + '15' }]}>
                  <Ionicons name={selectedAccount.icon as any} size={20} color={selectedAccount.color} />
                </View>
                <View style={st.offerInfo}>
                  <Text style={[st.offerBrand, { color: colors.textPrimary }]}>{offer.title}</Text>
                  <Text style={[st.offerDesc, { color: colors.textSecondary }]}>{offer.description}</Text>
                  {offer.pointsCost > 0 ? (
                    <View style={st.offerFooter}>
                      <Text style={[st.offerCost, { color: colors.primary }]}>{formatPoints(offer.pointsCost)} {selectedAccount.pointsUnit}</Text>
                      <TouchableOpacity style={[st.redeemBtn, { backgroundColor: colors.primary }]}><Text style={st.redeemBtnText}>Redeem</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={[st.activateBtn, { borderColor: colors.primary }]}><Text style={[st.activateBtnText, { color: colors.primary }]}>Activate</Text></TouchableOpacity>
                  )}
                </View>
              </View>
            )) : (
              <View style={[st.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="gift-outline" size={32} color={colors.textTertiary} />
                <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No offers available</Text>
                <Text style={[st.emptyDesc, { color: colors.textSecondary }]}>Check back soon for new offers from {selectedAccount.name}</Text>
              </View>
            )}
          </View>
          <View style={[st.section, { paddingHorizontal: spacing.md, marginBottom: 32 }]}>
            <TouchableOpacity style={[st.unlinkBtn, { borderColor: colors.error }]}>
              <Ionicons name="unlink-outline" size={18} color={colors.error} />
              <Text style={[st.unlinkBtnText, { color: colors.error }]}> Unlink Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Render: Add / Link Rewards Account
  const renderAddAccount = () => (
    <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[st.simpleHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={[st.simpleHeaderTitle, { color: colors.textPrimary }]}>Link Rewards Account</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        <Text style={[st.addSubtitle, { color: colors.textSecondary }]}>Choose a rewards program to link to your account</Text>
        {AVAILABLE_PROGRAMS.map((program) => {
          const alreadyLinked = accounts.some((a) => a.programName === program.name || a.name === program.name);
          return (
            <TouchableOpacity key={program.id} style={[st.programCard, { backgroundColor: colors.surface, borderColor: colors.border }, selectedProgramId === program.id && { borderColor: colors.primary, borderWidth: 2 }, alreadyLinked && { opacity: 0.5 }]} onPress={() => !alreadyLinked && setSelectedProgramId(program.id)} disabled={alreadyLinked}>
              <View style={[st.programIcon, { backgroundColor: program.color + '15' }]}>
                <Ionicons name={program.icon as any} size={22} color={program.color} />
              </View>
              <View style={st.programInfo}>
                <Text style={[st.programName, { color: colors.textPrimary }]}>{program.name}</Text>
                <Text style={[st.programType, { color: colors.textSecondary }]}>{program.type.charAt(0).toUpperCase() + program.type.slice(1)}</Text>
              </View>
              {alreadyLinked ? (
                <View style={[st.linkedBadge, { backgroundColor: colors.brand10 }]}><Text style={[st.linkedBadgeText, { color: colors.primary }]}>Linked</Text></View>
              ) : selectedProgramId === program.id ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              ) : (
                <Ionicons name="add-circle-outline" size={24} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          );
        })}
        {selectedProgramId && (
          <View style={st.linkFormSection}>
            <Text style={[st.linkFormLabel, { color: colors.textPrimary }]}>Member ID / Account Number</Text>
            <TextInput style={[st.linkFormInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Enter your member ID" placeholderTextColor={colors.textTertiary} value={linkMemberId} onChangeText={setLinkMemberId} />
            <TouchableOpacity style={[st.linkFormBtn, { backgroundColor: colors.primary }]} onPress={handleLinkAccount}>
              <Text style={st.linkFormBtnText}>Link Account</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // Render: Link Success
  const renderLinkSuccess = () => (
    <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={st.successContainer}>
        <View style={[st.successIconCircle, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        </View>
        <Text style={[st.successTitle, { color: colors.textPrimary }]}>Account Linked!</Text>
        <Text style={[st.successDesc, { color: colors.textSecondary }]}>Your rewards account has been successfully linked. You can now view your balance and redeem offers.</Text>
        <TouchableOpacity style={[st.successBtn, { backgroundColor: colors.primary }]} onPress={() => { setSelectedProgramId(null); setLinkMemberId(''); setStep('overview'); }}>
          <Text style={st.successBtnText}>View Rewards</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Render: Buy Points
  const renderBuyPoints = () => {
    if (!selectedAccount) return null;
    const pointsNum = parseInt(tradeAmount, 10) || 0;
    const cost = pointsNum * selectedAccount.buyRatePerPoint;
    return (
      <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[st.simpleHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={[st.simpleHeaderTitle, { color: colors.textPrimary }]}>Buy {selectedAccount.pointsUnit}</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
          <View style={[st.tradeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={st.tradeAccountRow}>
              <View style={[st.tradeAccountIcon, { backgroundColor: selectedAccount.color + '15' }]}>
                <Ionicons name={selectedAccount.icon as any} size={24} color={selectedAccount.color} />
              </View>
              <View>
                <Text style={[st.tradeAccountName, { color: colors.textPrimary }]}>{selectedAccount.name}</Text>
                <Text style={[st.tradeAccountBalance, { color: colors.textSecondary }]}>Current: {formatPoints(selectedAccount.pointsBalance)} {selectedAccount.pointsUnit}</Text>
              </View>
            </View>
            <Text style={[st.tradeLabel, { color: colors.textSecondary }]}>How many {selectedAccount.pointsUnit.toLowerCase()} do you want to buy?</Text>
            <TextInput style={[st.tradeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]} placeholder="e.g. 1000" placeholderTextColor={colors.textTertiary} value={tradeAmount} onChangeText={setTradeAmount} keyboardType="numeric" />
            <View style={st.tradeSummary}>
              <View style={st.tradeSummaryRow}>
                <Text style={[st.tradeSummaryLabel, { color: colors.textSecondary }]}>Rate</Text>
                <Text style={[st.tradeSummaryValue, { color: colors.textPrimary }]}>{formatCurrency(selectedAccount.buyRatePerPoint)} per {selectedAccount.pointsUnit.replace(/s$/, '').toLowerCase()}</Text>
              </View>
              <View style={st.tradeSummaryRow}>
                <Text style={[st.tradeSummaryLabel, { color: colors.textSecondary }]}>Total Cost</Text>
                <Text style={[st.tradeSummaryValue, { color: colors.textPrimary, fontWeight: '700' }]}>{formatCurrency(cost)}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={[st.tradeBtn, { backgroundColor: pointsNum > 0 ? colors.primary : colors.border }]} onPress={handleBuyPoints} disabled={pointsNum <= 0}>
            <Text style={[st.tradeBtnText, { color: pointsNum > 0 ? '#FFFFFF' : colors.textTertiary }]}>Buy {pointsNum > 0 ? formatPoints(pointsNum) : ''} {selectedAccount.pointsUnit}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Render: Sell Points
  const renderSellPoints = () => {
    if (!selectedAccount) return null;
    const pointsNum = parseInt(tradeAmount, 10) || 0;
    const revenue = pointsNum * selectedAccount.sellRatePerPoint;
    const maxSellable = selectedAccount.pointsBalance;
    const isValid = pointsNum > 0 && pointsNum <= maxSellable;
    return (
      <SafeAreaView style={[st.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[st.simpleHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={[st.simpleHeaderTitle, { color: colors.textPrimary }]}>Sell {selectedAccount.pointsUnit}</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
          <View style={[st.tradeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={st.tradeAccountRow}>
              <View style={[st.tradeAccountIcon, { backgroundColor: selectedAccount.color + '15' }]}>
                <Ionicons name={selectedAccount.icon as any} size={24} color={selectedAccount.color} />
              </View>
              <View>
                <Text style={[st.tradeAccountName, { color: colors.textPrimary }]}>{selectedAccount.name}</Text>
                <Text style={[st.tradeAccountBalance, { color: colors.textSecondary }]}>Available: {formatPoints(selectedAccount.pointsBalance)} {selectedAccount.pointsUnit}</Text>
              </View>
            </View>
            <Text style={[st.tradeLabel, { color: colors.textSecondary }]}>How many {selectedAccount.pointsUnit.toLowerCase()} do you want to sell?</Text>
            <TextInput style={[st.tradeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]} placeholder={`Max: ${formatPoints(maxSellable)}`} placeholderTextColor={colors.textTertiary} value={tradeAmount} onChangeText={setTradeAmount} keyboardType="numeric" />
            <TouchableOpacity onPress={() => setTradeAmount(String(maxSellable))}>
              <Text style={[st.sellMaxBtn, { color: colors.primary }]}>Sell All</Text>
            </TouchableOpacity>
            <View style={st.tradeSummary}>
              <View style={st.tradeSummaryRow}>
                <Text style={[st.tradeSummaryLabel, { color: colors.textSecondary }]}>Rate</Text>
                <Text style={[st.tradeSummaryValue, { color: colors.textPrimary }]}>{formatCurrency(selectedAccount.sellRatePerPoint)} per {selectedAccount.pointsUnit.replace(/s$/, '').toLowerCase()}</Text>
              </View>
              <View style={st.tradeSummaryRow}>
                <Text style={[st.tradeSummaryLabel, { color: colors.textSecondary }]}>You Receive</Text>
                <Text style={[st.tradeSummaryValue, { color: '#10B981', fontWeight: '700' }]}>{formatCurrency(revenue)}</Text>
              </View>
            </View>
          </View>
          {pointsNum > maxSellable && (<Text style={st.tradeError}>You can only sell up to {formatPoints(maxSellable)} {selectedAccount.pointsUnit}</Text>)}
          <TouchableOpacity style={[st.tradeBtn, { backgroundColor: isValid ? colors.primary : colors.border }]} onPress={handleSellPoints} disabled={!isValid}>
            <Text style={[st.tradeBtnText, { color: isValid ? '#FFFFFF' : colors.textTertiary }]}>Sell {pointsNum > 0 ? formatPoints(pointsNum) : ''} {selectedAccount.pointsUnit}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Router
  const renderStep = () => {
    switch (step) {
      case 'overview': return renderOverview();
      case 'account_detail': return renderAccountDetail();
      case 'add_account': return renderAddAccount();
      case 'link_success': return renderLinkSuccess();
      case 'buy_points': return renderBuyPoints();
      case 'sell_points': return renderSellPoints();
      default: return renderOverview();
    }
  };

  return renderStep();
}

// Styles
const st = StyleSheet.create({
  container: { flex: 1 },
  darkHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  headerGreeting: { flex: 1, marginLeft: 12 },
  greetingText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  accountPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 6, marginBottom: 12 },
  accountPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  balanceAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', textAlign: 'center' },
  balanceSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  quickActionBtn: { alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  cardContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  accountIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 12, marginTop: 2 },
  accountBalanceCol: { alignItems: 'flex-end', marginRight: 4 },
  accountBalancePoints: { fontSize: 13, fontWeight: '600' },
  accountBalanceCash: { fontSize: 11, marginTop: 2 },
  addAccountRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, gap: 4, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  addAccountText: { fontSize: 14, fontWeight: '600' },
  offerCard: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  offerBrandIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  offerInfo: { flex: 1, marginLeft: 12 },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerBrand: { fontSize: 14, fontWeight: '600' },
  offerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  offerBadgeText: { fontSize: 11, fontWeight: '500' },
  offerDesc: { fontSize: 12, marginTop: 4 },
  offerCost: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  offerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  redeemBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  redeemBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  activateBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  activateBtnText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  modalAccountRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  modalAccountIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalAccountInfo: { flex: 1, marginLeft: 12 },
  modalAccountName: { fontSize: 15, fontWeight: '600' },
  modalAccountSub: { fontSize: 12, marginTop: 2 },
  modalAccountBalance: { fontSize: 14, fontWeight: '600' },
  modalAddRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 4 },
  modalAddText: { fontSize: 14, fontWeight: '600' },
  detailHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  detailHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  detailHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  detailBalanceSection: { alignItems: 'center', marginBottom: 20 },
  detailPoints: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  detailCash: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 4 },
  detailMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  detailMetaText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  detailActions: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  detailActionBtn: { alignItems: 'center' },
  detailActionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  ratesRow: { flexDirection: 'row', gap: 12 },
  rateCard: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  rateLabel: { fontSize: 12, fontWeight: '500' },
  rateValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyState: { padding: 32, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptyDesc: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  unlinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  unlinkBtnText: { fontSize: 14, fontWeight: '600' },
  simpleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  simpleHeaderTitle: { fontSize: 18, fontWeight: '700' },
  addSubtitle: { fontSize: 14, marginBottom: 16 },
  programCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  programIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  programInfo: { flex: 1, marginLeft: 12 },
  programName: { fontSize: 15, fontWeight: '600' },
  programType: { fontSize: 12, marginTop: 2 },
  linkedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  linkedBadgeText: { fontSize: 12, fontWeight: '600' },
  linkFormSection: { marginTop: 20 },
  linkFormLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  linkFormInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  linkFormBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  linkFormBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  successDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  successBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  successBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  tradeCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  tradeAccountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  tradeAccountIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tradeAccountName: { fontSize: 16, fontWeight: '600' },
  tradeAccountBalance: { fontSize: 13, marginTop: 2 },
  tradeLabel: { fontSize: 14, marginBottom: 8 },
  tradeInput: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 18, fontWeight: '600' },
  sellMaxBtn: { fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'right' },
  tradeSummary: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  tradeSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tradeSummaryLabel: { fontSize: 13 },
  tradeSummaryValue: { fontSize: 13 },
  tradeBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tradeBtnText: { fontSize: 16, fontWeight: '600' },
  tradeError: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 12 },
});
