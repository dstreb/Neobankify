import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// =====================================================
// Mock data - popular banks for Plaid-style linking
// =====================================================
const POPULAR_BANKS = [
  { id: 'chase', name: 'Chase', logo: 'business-outline' as const },
  { id: 'bofa', name: 'Bank of America', logo: 'business-outline' as const },
  { id: 'wells', name: 'Wells Fargo', logo: 'business-outline' as const },
  { id: 'citi', name: 'Citibank', logo: 'business-outline' as const },
  { id: 'usbank', name: 'US Bank', logo: 'business-outline' as const },
  { id: 'capital', name: 'Capital One', logo: 'business-outline' as const },
  { id: 'pnc', name: 'PNC Bank', logo: 'business-outline' as const },
  { id: 'td', name: 'TD Bank', logo: 'business-outline' as const },
];

const ALL_BANKS = [
  ...POPULAR_BANKS,
  { id: 'ally', name: 'Ally Bank', logo: 'business-outline' as const },
  { id: 'discover', name: 'Discover Bank', logo: 'business-outline' as const },
  { id: 'marcus', name: 'Marcus by Goldman Sachs', logo: 'business-outline' as const },
  { id: 'schwab', name: 'Charles Schwab', logo: 'business-outline' as const },
  { id: 'sofi', name: 'SoFi', logo: 'business-outline' as const },
  { id: 'amex', name: 'American Express', logo: 'card-outline' as const },
  { id: 'navy', name: 'Navy Federal Credit Union', logo: 'business-outline' as const },
  { id: 'fidelity', name: 'Fidelity', logo: 'business-outline' as const },
];

// Crypto exchanges/wallets for linking
const CRYPTO_PLATFORMS = [
  { id: 'coinbase', name: 'Coinbase', logo: 'logo-bitcoin' as const },
  { id: 'binance', name: 'Binance', logo: 'logo-bitcoin' as const },
  { id: 'kraken', name: 'Kraken', logo: 'logo-bitcoin' as const },
  { id: 'gemini', name: 'Gemini', logo: 'logo-bitcoin' as const },
  { id: 'crypto_com', name: 'Crypto.com', logo: 'logo-bitcoin' as const },
  { id: 'metamask', name: 'MetaMask Wallet', logo: 'wallet-outline' as const },
  { id: 'phantom', name: 'Phantom Wallet', logo: 'wallet-outline' as const },
  { id: 'ledger', name: 'Ledger Hardware Wallet', logo: 'hardware-chip-outline' as const },
];

// Account types available to open
const NEW_ACCOUNT_TYPES = [
  {
    id: 'savings',
    name: 'Savings Account',
    description: 'High-yield savings with competitive APY',
    icon: 'cash-outline' as const,
    features: ['3.25% APY', 'No minimum balance', 'FDIC insured', 'Auto-save rules'],
    apr: '3.25% APY',
  },
  {
    id: 'credit_line',
    name: 'Credit Line',
    description: 'Flexible revolving credit for everyday needs',
    icon: 'card-outline' as const,
    features: ['Up to $25,000 limit', 'Variable APR from 11.99%', 'No annual fee', 'Rewards on purchases'],
    apr: '11.99% - 23.99% APR',
  },
  {
    id: 'instalment_line',
    name: 'Instalment Line',
    description: 'Fixed-rate instalment loans with predictable payments',
    icon: 'calendar-outline' as const,
    features: ['Fixed monthly payments', 'Terms 12-60 months', 'Rates from 6.99% APR', 'No prepayment penalty'],
    apr: '6.99% - 15.99% APR',
  },
  {
    id: 'home_equity',
    name: 'Home Equity Line',
    description: 'Borrow against your home equity at low rates',
    icon: 'home-outline' as const,
    features: ['Up to 85% LTV', 'Rates from 7.49% APR', 'Interest-only option', 'Tax-deductible interest*'],
    apr: '7.49% - 12.99% APR',
  },
  {
    id: 'investment',
    name: 'Investment Account',
    description: 'Self-directed or managed portfolio investing',
    icon: 'trending-up' as const,
    features: ['Stocks, ETFs, bonds', 'No commission trades', 'AI-powered insights', 'Fractional shares'],
    apr: 'Market returns',
  },
  {
    id: 'crypto',
    name: 'Crypto Account',
    description: 'Buy, sell, and hold cryptocurrencies',
    icon: 'logo-bitcoin' as const,
    features: ['100+ cryptocurrencies', 'Staking rewards', 'Cold storage security', 'Instant transfers'],
    apr: 'Variable yields',
  },
];

type FlowStep =
  | 'choose'
  | 'open_new'
  | 'open_new_form'
  | 'link_bank'
  | 'plaid_login'
  | 'plaid_accounts'
  | 'scan_card'
  | 'scan_processing'
  | 'link_crypto'
  | 'crypto_connect'
  | 'success';

interface AccountType {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
  apr: string;
}

interface BankEntry {
  id: string;
  name: string;
  logo: keyof typeof Ionicons.glyphMap;
}

interface DiscoveredAccount {
  id: string;
  name: string;
  type: string;
  lastFour: string;
  balance: number;
  selected: boolean;
}

export function AddAccountScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [step, setStep] = useState<FlowStep>('choose');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankEntry | null>(null);
  const [linkUsername, setLinkUsername] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [openAccountName, setOpenAccountName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<BankEntry | null>(null);
  const [cryptoApiKey, setCryptoApiKey] = useState('');
  const [cryptoApiSecret, setCryptoApiSecret] = useState('');
  const [scannedCard, setScannedCard] = useState<{ lastFour: string; brand: string; expiry: string } | null>(null);

  // Filter banks by search query
  const filteredBanks = bankSearch.trim()
    ? ALL_BANKS.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : POPULAR_BANKS;

  // =====================================================
  // Back navigation logic
  // =====================================================
  const handleBack = () => {
    switch (step) {
      case 'choose':
        navigation.goBack();
        break;
      case 'open_new_form':
        setStep('open_new');
        break;
      case 'plaid_login':
        setStep('link_bank');
        break;
      case 'plaid_accounts':
        setStep('plaid_login');
        break;
      case 'scan_processing':
        setStep('scan_card');
        break;
      case 'crypto_connect':
        setStep('link_crypto');
        break;
      default:
        setStep('choose');
        break;
    }
  };

  // =====================================================
  // Header with back button
  // =====================================================
  const renderHeader = (title: string) => (
    <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  // =====================================================
  // Step 1: Choose - Open New / Link Bank / Scan Card / Link Crypto
  // =====================================================
  const renderChoose = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroSection}>
        <View style={[styles.heroIcon, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="add-circle" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Add an Account</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Open a new account, link an existing bank, scan a credit card, or connect a crypto wallet.
        </Text>
      </View>

      {/* Open New Account */}
      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setStep('open_new')}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="sparkles" size={28} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Open New Account</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Savings, credit line, investment, crypto, and more
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Link Bank Account via Plaid */}
      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => { setBankSearch(''); setStep('link_bank'); }}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="link" size={28} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Link Bank Account</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Securely connect via Plaid to your existing bank
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Scan Credit Card */}
      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => { setScannedCard(null); setStep('scan_card'); }}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="camera" size={28} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Scan Credit Card</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Use your camera to scan and link a credit card or credit line
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Link Crypto Account */}
      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setStep('link_crypto')}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="logo-bitcoin" size={28} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Link Crypto Account</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
            Connect a crypto exchange or wallet
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
      </TouchableOpacity>

      <View style={[styles.infoBox, { backgroundColor: colors.brand10, borderColor: colors.brand20 }]}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Your data is encrypted end-to-end. We use bank-level security to protect your information.
        </Text>
      </View>
    </ScrollView>
  );

  // =====================================================
  // Open New Account - choose account type
  // =====================================================
  const renderOpenNew = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Choose Account Type</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Select the type of account you'd like to open
      </Text>

      {NEW_ACCOUNT_TYPES.map((acctType) => (
        <TouchableOpacity
          key={acctType.id}
          style={[styles.accountTypeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            setSelectedType(acctType);
            setOpenAccountName('');
            setStep('open_new_form');
          }}
        >
          <View style={styles.accountTypeHeader}>
            <View style={[styles.accountTypeIcon, { backgroundColor: colors.brand10 }]}>
              <Ionicons name={acctType.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.accountTypeInfo}>
              <Text style={[styles.accountTypeName, { color: colors.textPrimary }]}>{acctType.name}</Text>
              <Text style={[styles.accountTypeDesc, { color: colors.textSecondary }]}>{acctType.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
          <View style={styles.featuresList}>
            {acctType.features.map((feature, i) => (
              <View key={i} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Open New Account - application form
  // =====================================================
  const renderOpenNewForm = () => {
    const getTerms = () => {
      switch (selectedType?.id) {
        case 'savings': return { fee: '$0.00', min: '$0.00', rate: '3.25% APY', rateLabel: 'APY' };
        case 'credit_line': return { fee: '$0.00', min: 'N/A', rate: '11.99% - 23.99%', rateLabel: 'APR' };
        case 'instalment_line': return { fee: '$0.00', min: 'N/A', rate: '6.99% - 15.99%', rateLabel: 'APR' };
        case 'home_equity': return { fee: '$0.00', min: 'N/A', rate: '7.49% - 12.99%', rateLabel: 'APR' };
        case 'investment': return { fee: '$0.00', min: '$0.00', rate: 'Market-based', rateLabel: 'Returns' };
        case 'crypto': return { fee: '0.5% per trade', min: '$1.00', rate: 'Variable', rateLabel: 'Yields' };
        default: return { fee: '$0.00', min: '$0.00', rate: 'N/A', rateLabel: 'Rate' };
      }
    };

    const terms = getTerms();

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.selectedTypeCard, { backgroundColor: colors.brand10, borderColor: colors.brand20 }]}>
            <View style={[styles.selectedTypeIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name={selectedType?.icon || 'wallet-outline'} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.selectedTypeInfo}>
              <Text style={[styles.selectedTypeName, { color: colors.textPrimary }]}>{selectedType?.name}</Text>
              <Text style={[styles.selectedTypeDesc, { color: colors.textSecondary }]}>{selectedType?.description}</Text>
            </View>
          </View>

          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Account Nickname</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g., My Savings, Trading Portfolio"
            placeholderTextColor={colors.textTertiary}
            value={openAccountName}
            onChangeText={setOpenAccountName}
          />

          <View style={[styles.termsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.termsTitle, { color: colors.textPrimary }]}>Account Terms</Text>
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: colors.textSecondary }]}>Monthly Fee</Text>
              <Text style={[styles.termValue, { color: colors.success }]}>{terms.fee}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: colors.textSecondary }]}>Minimum Balance</Text>
              <Text style={[styles.termValue, { color: colors.textPrimary }]}>{terms.min}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={[styles.termLabel, { color: colors.textSecondary }]}>{terms.rateLabel}</Text>
              <Text style={[styles.termValue, { color: colors.primary }]}>{terms.rate}</Text>
            </View>
            <View style={[styles.termRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.termLabel, { color: colors.textSecondary }]}>FDIC / SIPC Insured</Text>
              <Text style={[styles.termValue, { color: colors.success }]}>
                {selectedType?.id === 'crypto' ? 'No' : 'Yes'}
              </Text>
            </View>
          </View>

          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            By opening this account, you agree to the Terms of Service, Electronic Funds Transfer Agreement, and applicable account disclosures.
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              (!openAccountName.trim() || isProcessing) && { opacity: 0.5 },
            ]}
            disabled={!openAccountName.trim() || isProcessing}
            onPress={() => {
              setIsProcessing(true);
              setTimeout(() => {
                setIsProcessing(false);
                setSuccessMessage(`Your new ${selectedType?.name || 'account'} "${openAccountName}" has been opened successfully!`);
                setStep('success');
              }, 1500);
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Opening Account...' : 'Open Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // =====================================================
  // Link Bank Account - Plaid-style bank search
  // =====================================================
  const renderLinkBank = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      {/* Plaid-style header */}
      <View style={[styles.plaidBadge, { backgroundColor: colors.brand10 }]}>
        <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
        <Text style={[styles.plaidBadgeText, { color: colors.primary }]}>Powered by Plaid</Text>
      </View>

      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Find Your Bank</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Search for your financial institution to securely connect your accounts
      </Text>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search banks and credit unions..."
          placeholderTextColor={colors.textTertiary}
          value={bankSearch}
          onChangeText={setBankSearch}
        />
        {bankSearch.length > 0 && (
          <TouchableOpacity onPress={() => setBankSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {!bankSearch.trim() && (
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Popular Banks</Text>
      )}

      {filteredBanks.length > 0 ? (
        filteredBanks.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[styles.listRow, { borderBottomColor: colors.borderLight }]}
            onPress={() => {
              setSelectedBank(bank);
              setLinkUsername('');
              setLinkPassword('');
              setStep('plaid_login');
            }}
          >
            <View style={[styles.listIcon, { backgroundColor: colors.brand10 }]}>
              <Ionicons name={bank.logo} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.listName, { color: colors.textPrimary }]}>{bank.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyResults}>
          <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No institutions found for "{bankSearch}"
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
            Try a different search term or check the spelling
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // =====================================================
  // Plaid Login - bank credentials
  // =====================================================
  const renderPlaidLogin = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.plaidBadge, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={[styles.plaidBadgeText, { color: colors.primary }]}>Secured by Plaid</Text>
        </View>

        <View style={[styles.bankHeaderCard, { backgroundColor: colors.brand10, borderColor: colors.brand20 }]}>
          <View style={[styles.bankHeaderIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="business" size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.bankHeaderName, { color: colors.textPrimary }]}>{selectedBank?.name}</Text>
          <Text style={[styles.bankHeaderSub, { color: colors.textSecondary }]}>
            Enter your {selectedBank?.name} credentials to securely connect
          </Text>
        </View>

        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Username</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder={`${selectedBank?.name} username`}
          placeholderTextColor={colors.textTertiary}
          value={linkUsername}
          onChangeText={setLinkUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder={`${selectedBank?.name} password`}
          placeholderTextColor={colors.textTertiary}
          value={linkPassword}
          onChangeText={setLinkPassword}
          secureTextEntry
        />

        <View style={[styles.infoBox, { backgroundColor: colors.brand10, borderColor: colors.brand20 }]}>
          <Ionicons name="lock-closed" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your credentials are encrypted and sent directly to {selectedBank?.name} through Plaid. We never store your login details.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            (!linkUsername.trim() || !linkPassword.trim() || isProcessing) && { opacity: 0.5 },
          ]}
          disabled={!linkUsername.trim() || !linkPassword.trim() || isProcessing}
          onPress={() => {
            setIsProcessing(true);
            setTimeout(() => {
              setIsProcessing(false);
              setDiscoveredAccounts([
                { id: 'd1', name: `${selectedBank?.name} Checking`, type: 'Checking', lastFour: '4521', balance: 3847.92, selected: true },
                { id: 'd2', name: `${selectedBank?.name} Savings`, type: 'Savings', lastFour: '7832', balance: 12450.00, selected: true },
                { id: 'd3', name: `${selectedBank?.name} Credit Card`, type: 'Credit', lastFour: '3391', balance: 2156.78, selected: false },
              ]);
              setStep('plaid_accounts');
            }, 2000);
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isProcessing ? 'Connecting to Plaid...' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // =====================================================
  // Plaid Accounts - select which accounts to link
  // =====================================================
  const renderPlaidAccounts = () => {
    const toggleAccount = (id: string) => {
      setDiscoveredAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)),
      );
    };
    const selectedCount = discoveredAccounts.filter((a) => a.selected).length;

    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.plaidBadge, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.plaidBadgeText, { color: colors.success }]}>Connected via Plaid</Text>
        </View>

        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select Accounts</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          We found {discoveredAccounts.length} accounts at {selectedBank?.name}. Choose which ones to link.
        </Text>

        {discoveredAccounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.discoveredAccount,
              { backgroundColor: colors.surface, borderColor: account.selected ? colors.primary : colors.border },
              account.selected && { backgroundColor: colors.brand10 },
            ]}
            onPress={() => toggleAccount(account.id)}
          >
            <View style={[
              styles.checkbox,
              { borderColor: account.selected ? colors.primary : colors.border },
              account.selected && { backgroundColor: colors.primary },
            ]}>
              {account.selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <View style={styles.discoveredInfo}>
              <Text style={[styles.discoveredName, { color: colors.textPrimary }]}>{account.name}</Text>
              <Text style={[styles.discoveredType, { color: colors.textSecondary }]}>
                {account.type} **** {account.lastFour}
              </Text>
            </View>
            <Text style={[styles.discoveredBalance, { color: colors.textPrimary }]}>
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            (selectedCount === 0 || isProcessing) && { opacity: 0.5 },
          ]}
          disabled={selectedCount === 0 || isProcessing}
          onPress={() => {
            setIsProcessing(true);
            setTimeout(() => {
              setIsProcessing(false);
              const linked = discoveredAccounts.filter((a) => a.selected);
              setSuccessMessage(
                `Successfully linked ${linked.length} account${linked.length > 1 ? 's' : ''} from ${selectedBank?.name}!`,
              );
              setStep('success');
            }, 1500);
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isProcessing ? 'Linking...' : `Link ${selectedCount} Account${selectedCount !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // =====================================================
  // Scan Credit Card - camera scanner UI
  // =====================================================
  const ScanLineAnimation = () => {
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [scanAnim]);

    const translateY = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 160],
    });

    return (
      <Animated.View
        style={[styles.scanLine, { backgroundColor: colors.primary, transform: [{ translateY }] }]}
      />
    );
  };

  const renderScanCard = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Scan Your Card</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Position your credit card or credit line card within the frame to scan it
      </Text>

      {/* Camera viewfinder mock */}
      <View style={[styles.scannerFrame, { backgroundColor: '#1A1A2E', borderColor: colors.border }]}>
        <View style={styles.scannerViewfinder}>
          {/* Corner markers */}
          <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
          {/* Animated scan line */}
          <ScanLineAnimation />
          {/* Card outline */}
          <View style={styles.cardOutline}>
            <Text style={styles.cardOutlineText}>****  ****  ****  ****</Text>
            <View style={styles.cardOutlineBottom}>
              <Text style={styles.cardOutlineLabel}>CARDHOLDER NAME</Text>
              <Text style={styles.cardOutlineLabel}>MM/YY</Text>
            </View>
          </View>
        </View>
        <Text style={styles.scannerHint}>Align card within the frame</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, isProcessing && { opacity: 0.5 }]}
        disabled={isProcessing}
        onPress={() => {
          setIsProcessing(true);
          setStep('scan_processing');
          // Simulate card scanning
          setTimeout(() => {
            setIsProcessing(false);
            setScannedCard({ lastFour: '4829', brand: 'Visa', expiry: '09/28' });
          }, 2500);
        }}
      >
        <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>
          {isProcessing ? 'Scanning...' : 'Capture Card'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.primary }]}
        onPress={() => {
          // Manual entry fallback
          setScannedCard({ lastFour: '0000', brand: 'Manual Entry', expiry: '' });
          setStep('scan_processing');
        }}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Enter Card Manually</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =====================================================
  // Scan Processing - card detected, confirm link
  // =====================================================
  const renderScanProcessing = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      {scannedCard ? (
        <>
          <View style={styles.scanSuccessHeader}>
            <View style={[styles.scanSuccessIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.textPrimary, textAlign: 'center' }]}>Card Detected!</Text>
          </View>

          <View style={[styles.scannedCardPreview, { backgroundColor: '#0C1B2A' }]}>
            <View style={styles.scannedCardTop}>
              <Ionicons name="card" size={28} color="#FFFFFF" />
              <Text style={styles.scannedCardBrand}>{scannedCard.brand}</Text>
            </View>
            <Text style={styles.scannedCardNumber}>
              ****  ****  ****  {scannedCard.lastFour}
            </Text>
            {scannedCard.expiry ? (
              <Text style={styles.scannedCardExpiry}>Expires {scannedCard.expiry}</Text>
            ) : null}
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.brand10, borderColor: colors.brand20, marginTop: 20 }]}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              This card will be added as a linked payment account. You'll be able to track spending and earn rewards on transactions.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }, isProcessing && { opacity: 0.5 }]}
            disabled={isProcessing}
            onPress={() => {
              setIsProcessing(true);
              setTimeout(() => {
                setIsProcessing(false);
                setSuccessMessage(
                  `Your ${scannedCard.brand} card ending in ${scannedCard.lastFour} has been linked successfully!`,
                );
                setStep('success');
              }, 1500);
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Linking Card...' : 'Link This Card'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => { setScannedCard(null); setStep('scan_card'); }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Scan Again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.processingContainer}>
          <Ionicons name="scan-outline" size={60} color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.textPrimary }]}>Processing card...</Text>
          <Text style={[styles.processingHint, { color: colors.textSecondary }]}>
            Reading card details from the image
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // =====================================================
  // Link Crypto - choose exchange/wallet
  // =====================================================
  const renderLinkCrypto = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Connect Crypto</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Link your crypto exchange or wallet to track your digital assets
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Exchanges</Text>
      {CRYPTO_PLATFORMS.filter((p) => !p.name.includes('Wallet')).map((platform) => (
        <TouchableOpacity
          key={platform.id}
          style={[styles.listRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => {
            setSelectedCrypto(platform);
            setCryptoApiKey('');
            setCryptoApiSecret('');
            setStep('crypto_connect');
          }}
        >
          <View style={[styles.listIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name={platform.logo} size={22} color="#F59E0B" />
          </View>
          <Text style={[styles.listName, { color: colors.textPrimary }]}>{platform.name}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>Wallets</Text>
      {CRYPTO_PLATFORMS.filter((p) => p.name.includes('Wallet')).map((platform) => (
        <TouchableOpacity
          key={platform.id}
          style={[styles.listRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => {
            setSelectedCrypto(platform);
            setCryptoApiKey('');
            setCryptoApiSecret('');
            setStep('crypto_connect');
          }}
        >
          <View style={[styles.listIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name={platform.logo} size={22} color="#F59E0B" />
          </View>
          <Text style={[styles.listName, { color: colors.textPrimary }]}>{platform.name}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Crypto Connect - API key or wallet address
  // =====================================================
  const renderCryptoConnect = () => {
    const isWallet = selectedCrypto?.name.includes('Wallet');

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.bankHeaderCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <View style={[styles.bankHeaderIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name={selectedCrypto?.logo || 'logo-bitcoin'} size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.bankHeaderName, { color: colors.textPrimary }]}>{selectedCrypto?.name}</Text>
            <Text style={[styles.bankHeaderSub, { color: colors.textSecondary }]}>
              {isWallet
                ? `Enter your ${selectedCrypto?.name} public address to connect`
                : `Connect your ${selectedCrypto?.name} account using a read-only API key`}
            </Text>
          </View>

          <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
            {isWallet ? 'Wallet Address' : 'API Key (Read-Only)'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder={isWallet ? '0x... or wallet address' : 'Paste your read-only API key'}
            placeholderTextColor={colors.textTertiary}
            value={cryptoApiKey}
            onChangeText={setCryptoApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!isWallet && (
            <>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>API Secret</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Paste your API secret"
                placeholderTextColor={colors.textTertiary}
                value={cryptoApiSecret}
                onChangeText={setCryptoApiSecret}
                secureTextEntry
              />
            </>
          )}

          <View style={[styles.infoBox, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <Ionicons name="lock-closed" size={18} color="#F59E0B" />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {isWallet
                ? 'We only read your public balance. No private keys are ever requested or stored.'
                : 'Use a read-only API key. We never request withdrawal or trading permissions.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: '#F59E0B' },
              (!cryptoApiKey.trim() || (!isWallet && !cryptoApiSecret.trim()) || isProcessing) && { opacity: 0.5 },
            ]}
            disabled={!cryptoApiKey.trim() || (!isWallet && !cryptoApiSecret.trim()) || isProcessing}
            onPress={() => {
              setIsProcessing(true);
              setTimeout(() => {
                setIsProcessing(false);
                setSuccessMessage(
                  `Your ${selectedCrypto?.name} account has been connected! Portfolio balance will sync automatically.`,
                );
                setStep('success');
              }, 2000);
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Connecting...' : `Connect ${selectedCrypto?.name}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // =====================================================
  // Success screen
  // =====================================================
  const renderSuccess = () => (
    <View style={[styles.content, styles.successContainer]}>
      <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>All Set!</Text>
      <Text style={[styles.successMessage, { color: colors.textSecondary }]}>{successMessage}</Text>
      <Text style={[styles.successHint, { color: colors.textTertiary }]}>
        Your account will appear on your dashboard and in the account selector.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.primary }]}
        onPress={() => {
          setStep('choose');
          setSelectedType(null);
          setSelectedBank(null);
          setSelectedCrypto(null);
          setBankSearch('');
          setLinkUsername('');
          setLinkPassword('');
          setCryptoApiKey('');
          setCryptoApiSecret('');
          setDiscoveredAccounts([]);
          setOpenAccountName('');
          setScannedCard(null);
        }}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Add Another Account</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // Title per step
  // =====================================================
  const getTitle = (): string => {
    switch (step) {
      case 'choose': return 'Add Account';
      case 'open_new': return 'Open New Account';
      case 'open_new_form': return selectedType?.name || 'Open Account';
      case 'link_bank': return 'Link Bank Account';
      case 'plaid_login': return selectedBank?.name || 'Connect Bank';
      case 'plaid_accounts': return 'Select Accounts';
      case 'scan_card': return 'Scan Card';
      case 'scan_processing': return 'Card Details';
      case 'link_crypto': return 'Connect Crypto';
      case 'crypto_connect': return selectedCrypto?.name || 'Connect';
      case 'success': return 'Success';
    }
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {step !== 'success' && renderHeader(getTitle())}
      {step === 'choose' && renderChoose()}
      {step === 'open_new' && renderOpenNew()}
      {step === 'open_new_form' && renderOpenNewForm()}
      {step === 'link_bank' && renderLinkBank()}
      {step === 'plaid_login' && renderPlaidLogin()}
      {step === 'plaid_accounts' && renderPlaidAccounts()}
      {step === 'scan_card' && renderScanCard()}
      {step === 'scan_processing' && renderScanProcessing()}
      {step === 'link_crypto' && renderLinkCrypto()}
      {step === 'crypto_connect' && renderCryptoConnect()}
      {step === 'success' && renderSuccess()}
    </SafeAreaView>
  );
}

// =====================================================
// Styles
// =====================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  headerSpacer: { width: 40 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 28 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },

  // Option cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1, marginLeft: 14 },
  optionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  optionDesc: { fontSize: 13, lineHeight: 18 },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Step titles
  stepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  // Account type cards
  accountTypeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  accountTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeInfo: { flex: 1, marginLeft: 12 },
  accountTypeName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  accountTypeDesc: { fontSize: 13, lineHeight: 17 },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '47%',
  },
  featureText: { fontSize: 12 },

  // Selected type display
  selectedTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  selectedTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTypeInfo: { flex: 1, marginLeft: 12 },
  selectedTypeName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  selectedTypeDesc: { fontSize: 13 },

  // Form fields
  formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },

  // Terms
  termsBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  termsTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  termLabel: { fontSize: 14 },
  termValue: { fontSize: 14, fontWeight: '600' },

  disclaimer: { fontSize: 12, lineHeight: 16, marginBottom: 20 },

  // Plaid badge
  plaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  plaidBadgeText: { fontSize: 13, fontWeight: '600' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },

  // Section label
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // List rows (banks, crypto platforms)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listName: { flex: 1, fontSize: 15, fontWeight: '500', marginLeft: 12 },

  emptyResults: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '500', marginTop: 12, textAlign: 'center' },
  emptyHint: { fontSize: 13, marginTop: 6, textAlign: 'center' },

  // Bank header card
  bankHeaderCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  bankHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bankHeaderName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  bankHeaderSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Discovered accounts
  discoveredAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveredInfo: { flex: 1, marginLeft: 12 },
  discoveredName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  discoveredType: { fontSize: 13 },
  discoveredBalance: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Card scanner
  scannerFrame: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scannerViewfinder: {
    height: 220,
    margin: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    opacity: 0.7,
    top: 20,
  },
  cardOutline: {
    width: '80%',
    paddingVertical: 20,
  },
  cardOutlineText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardOutlineBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  cardOutlineLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 16,
  },

  // Scan success
  scanSuccessHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // Scanned card preview
  scannedCardPreview: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 4,
  },
  scannedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  scannedCardBrand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scannedCardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 12,
  },
  scannedCardExpiry: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  // Processing
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  processingText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  processingHint: { fontSize: 14, marginTop: 6 },

  // Buttons
  primaryButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 24,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },

  // Success
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  successMessage: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  successHint: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 8 },
});
