import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_ACCOUNTS } from '../../data/accounts';
import {
  MOCK_RECIPIENTS,
  MOCK_BANK_INSTITUTIONS,
  MOCK_RECURRING_PAYMENTS,
  CURRENCIES,
  PAYMENT_CATEGORIES,
  DEPOSIT_METHODS,
  type Recipient,
  type Currency,
  type PaymentCategory,
} from '../../data/payments';

// =====================================================
// Types
// =====================================================
type Step =
  | 'hub'
  | 'contacts'
  | 'contacts-add'
  | 'convert-currency'
  | 'convert-amount'
  | 'convert-confirm'
  | 'convert-success'
  | 'request-currency'
  | 'request-amount'
  | 'request-recipient'
  | 'request-confirm'
  | 'request-success'
  | 'deposit-method'
  | 'deposit-account'
  | 'deposit-amount'
  | 'deposit-confirm'
  | 'deposit-success'
  | 'transfer-destination'
  | 'transfer-recipient'
  | 'transfer-amount'
  | 'transfer-category'
  | 'transfer-reference'
  | 'transfer-confirm'
  | 'transfer-pin'
  | 'transfer-progress'
  | 'transfer-success'
  | 'recurring-schedule'
  | 'recurring-destination'
  | 'recurring-amount'
  | 'recurring-confirm'
  | 'recurring-success';

// Map flow param to entry step
const FLOW_ENTRY_STEPS: Record<string, Step> = {
  deposit: 'deposit-method',
  transfer: 'transfer-destination',
  convert: 'convert-currency',
  request: 'request-currency',
  recurring: 'recurring-schedule',
  contacts: 'contacts',
  withdraw: 'hub', // no dedicated withdraw flow yet
};

interface PaymentsScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: {
    params?: {
      flow?: string;
    };
  };
}

export function PaymentsScreen({ navigation, route }: PaymentsScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  // =====================================================
  // State
  // =====================================================
  const initialFlow = route?.params?.flow;
  const [step, setStep] = useState<Step>(
    (initialFlow && FLOW_ENTRY_STEPS[initialFlow]) || 'hub',
  );

  // When navigating back to this screen with a new flow param (e.g. from
  // Dashboard quick-actions), React Navigation reuses the mounted instance so
  // useState's initial value is ignored.  This effect keeps step in sync.
  useEffect(() => {
    const flow = route?.params?.flow;
    if (flow && FLOW_ENTRY_STEPS[flow]) {
      setStep(FLOW_ENTRY_STEPS[flow]);
    }
  }, [route?.params?.flow]);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert flow
  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[3]);
  const [convertAmount, setConvertAmount] = useState('0.00');

  // Request flow
  const [requestCurrency, setRequestCurrency] = useState<Currency>(CURRENCIES[0]);
  const [requestAmount, setRequestAmount] = useState('0.00');
  const [requestRecipient, setRequestRecipient] = useState<Recipient | null>(null);

  // Deposit flow
  const [depositAmount, setDepositAmount] = useState('0.00');

  // Transfer flow
  const [transferRecipient, setTransferRecipient] = useState<Recipient | null>(null);
  const [transferAmount, setTransferAmount] = useState('0.00');
  const [transferCategory, setTransferCategory] = useState<PaymentCategory | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [transferPin, setTransferPin] = useState('');

  // Recurring flow
  const [recurringStartDate] = useState('Now');
  const [recurringRepeat] = useState('Every Month');
  const [recurringStopRepeat] = useState('Never');
  const [recurringDestination, setRecurringDestination] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('0.00');

  // Modals
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencyPickerTarget, setCurrencyPickerTarget] = useState<'from' | 'to' | 'request'>('from');

  // =====================================================
  // Handlers
  // =====================================================
  const handleBack = () => {
    if (step === 'hub') {
      navigation.goBack();
    } else {
      setStep('hub');
    }
  };

  const getConvertedAmount = () => {
    const amount = parseFloat(convertAmount) || 0;
    return (amount * toCurrency.rate) / fromCurrency.rate;
  };

  // =====================================================
  // Numpad handler factory
  // =====================================================
  const makeNumpadHandler = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => (val: string) => {
    if (val === 'backspace') {
      setter((prev) => prev.slice(0, -1) || '0.00');
    } else if (val === '.') {
      setter((prev) => (prev === '0.00' ? '0.' : prev.includes('.') ? prev : prev + '.'));
    } else {
      setter((prev) => (prev === '0.00' ? val : prev + val));
    }
  };

  // =====================================================
  // Numpad component
  // =====================================================
  const renderNumpad = (onKey: (val: string) => void, onContinue: () => void) => (
    <View style={[s.numpad, { backgroundColor: colors.surface }]}>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', 'backspace']].map((row, rowIdx) => (
        <View key={rowIdx} style={s.numpadRow}>
          {row.map((key) => (
            <TouchableOpacity key={key} style={s.numpadKey} onPress={() => onKey(key)}>
              {key === 'backspace' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
              ) : (
                <Text style={[s.numpadText, { color: colors.textPrimary }]}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity
        style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
        onPress={onContinue}
      >
        <Text style={s.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // Render: Hub
  // =====================================================
  const renderHub = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Quick Actions */}
      <View style={[s.section, { paddingHorizontal: 20 }]}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Payments</Text>
        <View style={s.actionsGrid}>
          {[
            { icon: 'arrow-down' as const, label: 'Deposit', color: '#10B981', action: () => setStep('deposit-method') },
            { icon: 'arrow-up' as const, label: 'Withdraw', color: '#EF4444', action: () => {} },
            { icon: 'qr-code' as const, label: 'Request', color: '#3B82F6', action: () => setStep('request-currency') },
            { icon: 'repeat' as const, label: 'Convert', color: '#8B5CF6', action: () => setStep('convert-currency') },
            { icon: 'send' as const, label: 'Transfer', color: '#F59E0B', action: () => setStep('transfer-destination') },
            { icon: 'calendar' as const, label: 'Recurring', color: '#EC4899', action: () => setStep('recurring-schedule') },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[s.actionBtn, { backgroundColor: action.color }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon} size={24} color="#FFFFFF" />
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Swiftbank Contacts */}
      <View style={[s.section, { paddingHorizontal: 20 }]}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Swiftbank Contacts</Text>
          <TouchableOpacity onPress={() => setStep('contacts')}>
            <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={s.emptyState} onPress={() => setStep('contacts')}>
            <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>You have no contact</Text>
            <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>
              Connect your friends and family to send money
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bank Accounts & Institutions */}
      <View style={[s.section, { paddingHorizontal: 20 }]}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Bank accounts & Institutions</Text>
          <TouchableOpacity>
            <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MOCK_BANK_INSTITUTIONS.slice(0, 2).map((bank, idx) => (
            <TouchableOpacity
              key={bank.id}
              style={[
                s.listRow,
                idx < 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <View style={s.listInfo}>
                <Text style={[s.listTitle, { color: colors.textPrimary }]}>{bank.name}</Text>
                <Text style={[s.listSub, { color: colors.textSecondary }]}>Checking ••{bank.lastFour}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recurring Payment */}
      <View style={[s.section, { paddingHorizontal: 20 }]}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Recurring Payment</Text>
          <TouchableOpacity onPress={() => setStep('recurring-schedule')}>
            <Text style={[s.seeAll, { color: colors.primary }]}>Add new</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MOCK_RECURRING_PAYMENTS.map((payment, idx) => (
            <TouchableOpacity
              key={payment.id}
              style={[
                s.listRow,
                idx < MOCK_RECURRING_PAYMENTS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
                <Ionicons name={payment.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
              </View>
              <View style={s.listInfo}>
                <Text style={[s.listTitle, { color: colors.textPrimary }]}>{payment.name}</Text>
                <Text style={[s.listSub, { color: colors.textSecondary }]}>{payment.frequency}</Text>
              </View>
              <Text style={[s.listAmount, { color: colors.textPrimary }]}>
                {formatCurrency(payment.amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // =====================================================
  // Render: Contacts
  // =====================================================
  const renderContacts = () => (
    <View style={s.fullScreen}>
      <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          placeholder="Search for contacts"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}>
        <Text style={[s.contactsCount, { color: colors.textSecondary }]}>
          {MOCK_RECIPIENTS.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase())).length} result(s) found.
        </Text>
        {MOCK_RECIPIENTS.filter((r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((recipient) => (
          <TouchableOpacity
            key={recipient.id}
            style={[s.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[s.contactAvatar, { backgroundColor: colors.primary }]}>
              <Text style={s.contactAvatarText}>{recipient.initials}</Text>
            </View>
            <View style={s.contactInfo}>
              <Text style={[s.contactName, { color: colors.textPrimary }]}>{recipient.name}</Text>
              <Text style={[s.contactBank, { color: colors.textSecondary }]}>
                {recipient.bankName} ••{recipient.lastFour}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.addContactBtn, { backgroundColor: colors.primary }]}
          onPress={() => setStep('contacts-add')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={s.addContactText}>Add New recipient</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // =====================================================
  // Render: Convert Currency Picker
  // =====================================================
  const renderConvertCurrency = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Choose a Currency</Text>
      <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16, marginHorizontal: 0 }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          placeholder="Search for a currency..."
          placeholderTextColor={colors.textTertiary}
        />
      </View>
      <Text style={[s.currencyLabel, { color: colors.textSecondary }]}>All currencies (250)</Text>
      {CURRENCIES.map((currency) => (
        <TouchableOpacity
          key={currency.code}
          style={[s.currencyRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => { setFromCurrency(currency); setStep('convert-amount'); }}
        >
          <Text style={s.currencyFlag}>{currency.flag}</Text>
          <View style={s.currencyInfo}>
            <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{currency.code}</Text>
            <Text style={[s.currencyName, { color: colors.textSecondary }]}>{currency.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Convert Amount
  // =====================================================
  const renderConvertAmount = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Convert Money</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          1 {fromCurrency.code} = {(toCurrency.rate / fromCurrency.rate).toFixed(5)} {toCurrency.code}
        </Text>

        {/* From Currency */}
        <View style={[s.amountCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          <Text style={[s.amountLabel, { color: colors.textSecondary }]}>Balance: $0.00</Text>
          <View style={s.amountRow}>
            <TouchableOpacity
              style={[s.currencyBtn, { backgroundColor: colors.background }]}
              onPress={() => { setCurrencyPickerTarget('from'); setShowCurrencyPicker(true); }}
            >
              <Text style={s.currencyFlag}>{fromCurrency.flag}</Text>
              <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{fromCurrency.code}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[s.amountInput, { color: colors.textPrimary }]}
              value={convertAmount}
              onChangeText={setConvertAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Swap Button */}
        <View style={s.swapContainer}>
          <TouchableOpacity
            style={[s.swapBtn, { backgroundColor: colors.primary }]}
            onPress={() => { const temp = fromCurrency; setFromCurrency(toCurrency); setToCurrency(temp); }}
          >
            <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* To Currency */}
        <View style={[s.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.amountRow}>
            <TouchableOpacity
              style={[s.currencyBtn, { backgroundColor: colors.background }]}
              onPress={() => { setCurrencyPickerTarget('to'); setShowCurrencyPicker(true); }}
            >
              <Text style={s.currencyFlag}>{toCurrency.flag}</Text>
              <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{toCurrency.code}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[s.amountInput, { color: colors.textPrimary }]}>
              {getConvertedAmount().toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={s.conversionInfo}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[s.conversionText, { color: colors.textSecondary }]}>Arrive instantly</Text>
        </View>
      </View>

      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('convert-confirm')}>
          <Text style={s.primaryBtnText}>Convert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Convert Confirmation
  // =====================================================
  const renderConvertConfirm = () => (
    <View style={s.fullScreen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Convert Confirmation</Text>
        <View style={s.conversionVisual}>
          <View style={s.conversionCurrencies}>
            <Text style={s.currencyFlag}>{fromCurrency.flag}</Text>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} style={{ marginHorizontal: 16 }} />
            <Text style={s.currencyFlag}>{toCurrency.flag}</Text>
          </View>
        </View>
        <View style={[s.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { icon: 'swap-horizontal' as const, label: 'Conversion', value: `${fromCurrency.code} \u2192 ${toCurrency.code}` },
            { icon: 'cash' as const, label: 'Amount', value: formatCurrency(parseFloat(convertAmount) || 0) },
            { icon: 'card' as const, label: 'Convert To', value: 'Savings ••1822' },
            { icon: 'receipt' as const, label: 'Total Fee', value: '$0.01' },
            { icon: 'time' as const, label: 'Time Estimate', value: 'Instantly' },
          ].map((row) => (
            <View key={row.label} style={s.confirmRow}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[s.confirmLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[s.confirmValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('convert-success')}>
          <Text style={s.primaryBtnText}>Convert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Success screens (reusable)
  // =====================================================
  const renderSuccess = (title: string, subtitle: string, note: string | null, onDone: () => void) => (
    <View style={[s.fullScreen, s.centerContent]}>
      <View style={[s.successIcon, { backgroundColor: (colors.success ?? '#10B981') + '20' }]}>
        <Ionicons name="checkmark" size={48} color={colors.success ?? '#10B981'} />
      </View>
      <Text style={[s.successTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[s.successSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      {note && <Text style={[s.successNote, { color: colors.textTertiary }]}>{note}</Text>}
      <Text style={[s.successPaymentId, { color: colors.textTertiary }]}>Payment ID: 19fe-MADD-WEF</Text>
      <View style={s.successActions}>
        <TouchableOpacity style={[s.successBtn, { backgroundColor: colors.primary }]} onPress={onDone}>
          <Text style={s.successBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Request Currency
  // =====================================================
  const renderRequestCurrency = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>What currency would you like to request?</Text>
      <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16, marginHorizontal: 0 }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput style={[s.searchInput, { color: colors.textPrimary }]} placeholder="Search for a currency" placeholderTextColor={colors.textTertiary} />
      </View>
      {CURRENCIES.map((currency) => (
        <TouchableOpacity
          key={currency.code}
          style={[s.currencyRow, { borderBottomColor: colors.borderLight }]}
          onPress={() => { setRequestCurrency(currency); setStep('request-amount'); }}
        >
          <Text style={s.currencyFlag}>{currency.flag}</Text>
          <View style={s.currencyInfo}>
            <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{currency.code}</Text>
            <Text style={[s.currencyName, { color: colors.textSecondary }]}>{currency.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Request Amount
  // =====================================================
  const renderRequestAmount = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Request Money</Text>
        <View style={[s.amountCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          <Text style={[s.amountLabel, { color: colors.textSecondary }]}>From Wells Fargo ••1125</Text>
          <View style={s.amountRow}>
            <TouchableOpacity style={[s.currencyBtn, { backgroundColor: colors.background }]}>
              <Text style={s.currencyFlag}>{requestCurrency.flag}</Text>
              <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{requestCurrency.code}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[s.amountInput, { color: colors.textPrimary }]}>{requestAmount}</Text>
          </View>
          <Text style={[s.amountLabel, { color: colors.textSecondary }]}>$0.00 Total    $0.00 fee</Text>
        </View>
      </View>
      {renderNumpad(makeNumpadHandler(setRequestAmount), () => setStep('request-recipient'))}
    </View>
  );

  // =====================================================
  // Render: Request Recipient
  // =====================================================
  const renderRequestRecipient = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Who are you requesting money from?</Text>
      <Text style={[s.contactsCount, { color: colors.textSecondary, marginTop: 16 }]}>Recent Contacts</Text>
      {MOCK_RECIPIENTS.slice(0, 3).map((recipient) => (
        <TouchableOpacity
          key={recipient.id}
          style={[
            s.contactCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            requestRecipient?.id === recipient.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => setRequestRecipient(recipient)}
        >
          <View style={[s.contactAvatar, { backgroundColor: colors.primary }]}>
            <Text style={s.contactAvatarText}>{recipient.initials}</Text>
          </View>
          <View style={s.contactInfo}>
            <Text style={[s.contactName, { color: colors.textPrimary }]}>{recipient.name}</Text>
            <Text style={[s.contactBank, { color: colors.textSecondary }]}>{recipient.bankName} ••{recipient.lastFour}</Text>
          </View>
          {requestRecipient?.id === recipient.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[s.addContactBtn, { backgroundColor: requestRecipient ? colors.primary : colors.borderLight, marginTop: 16 }]}
        onPress={() => { if (requestRecipient) setStep('request-confirm'); }}
      >
        <Text style={s.addContactText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =====================================================
  // Render: Request Confirmation
  // =====================================================
  const renderRequestConfirm = () => (
    <View style={s.fullScreen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Request Confirmation</Text>
        <View style={[s.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          {[
            { icon: 'person' as const, label: 'To', value: `${requestRecipient?.name ?? ''} ••${requestRecipient?.lastFour ?? ''}` },
            { icon: 'cash' as const, label: 'Currency', value: requestCurrency.code },
            { icon: 'card' as const, label: 'Payment Method', value: 'Bank Transfer' },
            { icon: 'receipt' as const, label: 'Fee', value: '$0.05' },
          ].map((row) => (
            <View key={row.label} style={s.confirmRow}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[s.confirmLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[s.confirmValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('request-success')}>
          <Text style={s.primaryBtnText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep('hub')}>
          <Text style={[s.secondaryBtnText, { color: colors.textSecondary }]}>Cancel request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Transfer Destination
  // =====================================================
  const renderTransferDestination = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Transfer Money</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>Where would you like to transfer?</Text>

      <TouchableOpacity
        style={[s.destinationCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}
        onPress={() => setStep('transfer-recipient')}
      >
        <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <Text style={[s.destinationLabel, { color: colors.textPrimary }]}>Someone Else</Text>
        <Text style={[s.destinationDesc, { color: colors.textSecondary }]}>Transfer to another account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.destinationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setStep('transfer-amount')}
      >
        <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
          <Ionicons name="person-circle" size={24} color={colors.primary} />
        </View>
        <Text style={[s.destinationLabel, { color: colors.textPrimary }]}>Myself</Text>
        <Text style={[s.destinationDesc, { color: colors.textSecondary }]}>Transfer to my accounts</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =====================================================
  // Render: Transfer Recipient
  // =====================================================
  const renderTransferRecipient = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Transfer Money</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>Select a recipient</Text>
      {MOCK_RECIPIENTS.slice(0, 3).map((recipient) => (
        <TouchableOpacity
          key={recipient.id}
          style={[
            s.contactCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            transferRecipient?.id === recipient.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => { setTransferRecipient(recipient); setStep('transfer-amount'); }}
        >
          <View style={[s.contactAvatar, { backgroundColor: colors.primary }]}>
            <Text style={s.contactAvatarText}>{recipient.initials}</Text>
          </View>
          <View style={s.contactInfo}>
            <Text style={[s.contactName, { color: colors.textPrimary }]}>{recipient.name}</Text>
            <Text style={[s.contactBank, { color: colors.textSecondary }]}>{recipient.bankName} ••{recipient.lastFour}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Transfer Amount
  // =====================================================
  const renderTransferAmount = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Transfer Money</Text>
        <View style={[s.amountDisplay, { marginTop: 32 }]}>
          <Text style={[s.amountLarge, { color: colors.textPrimary }]}>${transferAmount}</Text>
          <Text style={[s.amountSub, { color: colors.textSecondary }]}>$1.25 available on primary account</Text>
        </View>
      </View>
      {renderNumpad(makeNumpadHandler(setTransferAmount), () => setStep('transfer-category'))}
    </View>
  );

  // =====================================================
  // Render: Transfer Category
  // =====================================================
  const renderTransferCategory = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>What is this payment for?</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>Help us categorize your payment</Text>
      <View style={s.categoryGrid}>
        {PAYMENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[
              s.categoryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              transferCategory === cat.label && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => { setTransferCategory(cat.label); setStep('transfer-reference'); }}
          >
            <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary} />
            <Text style={[s.categoryLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // =====================================================
  // Render: Transfer Reference
  // =====================================================
  const renderTransferReference = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Transfer Money</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>Add your reference...</Text>
        <TextInput
          style={[s.referenceInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, marginTop: 24 }]}
          placeholder="e.g. Dinner last week"
          placeholderTextColor={colors.textTertiary}
          value={transferReference}
          onChangeText={setTransferReference}
          multiline
        />
      </View>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('transfer-confirm')}>
          <Text style={s.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep('transfer-confirm')}>
          <Text style={[s.secondaryBtnText, { color: colors.textSecondary }]}>Skip reference</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Transfer Confirmation
  // =====================================================
  const renderTransferConfirm = () => (
    <View style={s.fullScreen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Transfer Confirmation</Text>
        <View style={[s.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          {[
            { icon: 'arrow-down' as const, label: 'From', value: 'Primary Account' },
            { icon: 'arrow-up' as const, label: 'To', value: transferRecipient?.name ?? 'My Savings' },
            { icon: 'cash' as const, label: 'Amount', value: `$${transferAmount}` },
            { icon: 'card' as const, label: 'Payment Method', value: 'Bank Transfer' },
            { icon: 'receipt' as const, label: 'Fee', value: '$0.05' },
            { icon: 'document-text' as const, label: 'Reference', value: transferReference || 'None' },
          ].map((row) => (
            <View key={row.label} style={s.confirmRow}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[s.confirmLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[s.confirmValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('transfer-pin')}>
          <Text style={s.primaryBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Transfer PIN
  // =====================================================
  const renderTransferPin = () => {
    const handlePinKey = (val: string) => {
      if (val === 'backspace') {
        setTransferPin((prev) => prev.slice(0, -1));
      } else if (transferPin.length < 6) {
        const newPin = transferPin + val;
        setTransferPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep('transfer-progress'), 500);
        }
      }
    };

    return (
      <View style={s.fullScreen}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Enter your PIN</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>Please enter your 6 digit PIN code.</Text>
          <View style={s.pinDots}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <View
                key={idx}
                style={[s.pinDot, { backgroundColor: idx < transferPin.length ? colors.primary : colors.borderLight }]}
              />
            ))}
          </View>
        </View>
        <View style={[s.numpad, { backgroundColor: colors.surface }]}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'backspace']].map((row, rowIdx) => (
            <View key={rowIdx} style={s.numpadRow}>
              {row.map((key, keyIdx) =>
                key ? (
                  <TouchableOpacity key={key} style={s.numpadKey} onPress={() => handlePinKey(key)}>
                    {key === 'backspace' ? (
                      <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                    ) : (
                      <Text style={[s.numpadText, { color: colors.textPrimary }]}>{key}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View key={`empty-${keyIdx}`} style={s.numpadKey} />
                ),
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // =====================================================
  // Render: Transfer Progress
  // =====================================================
  const renderTransferProgress = () => (
    <View style={[s.fullScreen, s.centerContent]}>
      <View style={s.progressContainer}>
        <View style={[s.progressIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="swap-horizontal" size={32} color={colors.primary} />
        </View>
        <Text style={[s.progressTitle, { color: colors.textPrimary }]}>Transfer is on its way</Text>
        <Text style={[s.progressSubtitle, { color: colors.textSecondary }]}>
          Your ${transferAmount} Transfer is being processed
        </Text>

        <View style={s.progressSteps}>
          {[
            { label: 'Transfer Submitted', desc: 'Your transfer submission is received', done: true },
            { label: 'Processing', desc: 'The transfer is being processed', done: true },
            { label: 'Money Arrives', desc: 'Money will arrive on their balance', done: false },
          ].map((pStep) => (
            <View key={pStep.label} style={s.progressStep}>
              <View style={[s.progressStepIcon, { backgroundColor: pStep.done ? (colors.success ?? '#10B981') : colors.borderLight }]}>
                {pStep.done && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.progressStepLabel, { color: colors.textPrimary }]}>{pStep.label}</Text>
                <Text style={[s.progressStepDesc, { color: colors.textSecondary }]}>{pStep.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: 32, width: '100%' }]} onPress={() => setStep('transfer-success')}>
        <Text style={s.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // Render: Deposit Method
  // =====================================================
  const renderDepositMethod = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Deposit Money</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>How would you like to deposit?</Text>
      {DEPOSIT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[s.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setStep('deposit-account')}
        >
          <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
            <Ionicons name={method.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary} />
          </View>
          <View style={s.methodInfo}>
            <Text style={[s.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
            <Text style={[s.methodDesc, { color: colors.textSecondary }]}>{method.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Deposit Account
  // =====================================================
  const renderDepositAccount = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Select Account to Deposit Into</Text>
      {MOCK_ACCOUNTS.map((account) => (
        <TouchableOpacity
          key={account.id}
          style={[s.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setStep('deposit-amount')}
        >
          <View style={[s.iconCircle, { backgroundColor: colors.brand10 }]}>
            <Ionicons name={account.icon} size={24} color={colors.primary} />
          </View>
          <View style={s.accountCardInfo}>
            <Text style={[s.accountCardName, { color: colors.textPrimary }]}>{account.name}</Text>
            <Text style={[s.accountCardType, { color: colors.textSecondary }]}>{account.type} ••{account.lastFour}</Text>
          </View>
          <Text style={[s.accountCardBalance, { color: colors.textPrimary }]}>{formatCurrency(account.balance)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Deposit Amount
  // =====================================================
  const renderDepositAmount = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Deposit Money</Text>
        <View style={[s.accountSelector, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          <Ionicons name="business" size={20} color={colors.textSecondary} />
          <Text style={[s.accountSelectorText, { color: colors.textPrimary }]}>From Chase Bank ••4487</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </View>
        <View style={[s.amountDisplay, { marginTop: 32 }]}>
          <Text style={[s.amountLarge, { color: colors.textPrimary }]}>${depositAmount}</Text>
          <Text style={[s.amountSub, { color: colors.textSecondary }]}>$0.05 fee</Text>
        </View>
      </View>
      {renderNumpad(makeNumpadHandler(setDepositAmount), () => setStep('deposit-confirm'))}
    </View>
  );

  // =====================================================
  // Render: Deposit Confirmation
  // =====================================================
  const renderDepositConfirm = () => (
    <View style={s.fullScreen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Deposit Confirmation</Text>
        <View style={[s.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          {[
            { icon: 'business' as const, label: 'From', value: 'Chase Bank ••4487' },
            { icon: 'wallet' as const, label: 'To', value: 'Primary Account' },
            { icon: 'cash' as const, label: 'Amount', value: `$${depositAmount}` },
            { icon: 'card' as const, label: 'Payment Method', value: 'Bank Transfer' },
            { icon: 'receipt' as const, label: 'Fee', value: '$0.05' },
          ].map((row) => (
            <View key={row.label} style={s.confirmRow}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[s.confirmLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[s.confirmValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.confirmNote, { color: colors.textTertiary, marginTop: 16 }]}>Transactions are secure and protected 24/7</Text>
      </ScrollView>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('deposit-success')}>
          <Text style={s.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Recurring Schedule
  // =====================================================
  const renderRecurringSchedule = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Set up recurring transfer</Text>
      {[
        { icon: 'calendar' as const, label: 'Start Date', value: recurringStartDate },
        { icon: 'repeat' as const, label: 'Repeat', value: recurringRepeat },
        { icon: 'stop-circle' as const, label: 'Stops Repeat', value: recurringStopRepeat },
      ].map((row) => (
        <TouchableOpacity key={row.label} style={[s.scheduleRow, { borderBottomColor: colors.borderLight }]}>
          <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
          <Text style={[s.scheduleLabel, { color: colors.textPrimary }]}>{row.label}</Text>
          <Text style={[s.scheduleValue, { color: colors.textSecondary }]}>{row.value}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: 32 }]} onPress={() => setStep('recurring-destination')}>
        <Text style={s.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =====================================================
  // Render: Recurring Destination
  // =====================================================
  const renderRecurringDestination = () => (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Text style={[s.title, { color: colors.textPrimary }]}>Where would you like to transfer?</Text>
      {MOCK_RECIPIENTS.slice(0, 2).map((recipient) => (
        <TouchableOpacity
          key={recipient.id}
          style={[
            s.contactCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            recurringDestination === recipient.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => { setRecurringDestination(recipient.id); setStep('recurring-amount'); }}
        >
          <View style={[s.contactAvatar, { backgroundColor: colors.primary }]}>
            <Text style={s.contactAvatarText}>{recipient.initials}</Text>
          </View>
          <View style={s.contactInfo}>
            <Text style={[s.contactName, { color: colors.textPrimary }]}>{recipient.name}</Text>
            <Text style={[s.contactBank, { color: colors.textSecondary }]}>{recipient.bankName} ••{recipient.lastFour}</Text>
          </View>
          {recurringDestination === recipient.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // =====================================================
  // Render: Recurring Amount
  // =====================================================
  const renderRecurringAmount = () => (
    <View style={s.fullScreen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Recurring Transfer</Text>
        <View style={[s.amountDisplay, { marginTop: 32 }]}>
          <Text style={[s.amountLarge, { color: colors.textPrimary }]}>${recurringAmount}</Text>
          <Text style={[s.amountSub, { color: colors.textSecondary }]}>$3.25 fee</Text>
        </View>
      </View>
      {renderNumpad(makeNumpadHandler(setRecurringAmount), () => setStep('recurring-confirm'))}
    </View>
  );

  // =====================================================
  // Render: Recurring Confirmation
  // =====================================================
  const renderRecurringConfirm = () => (
    <View style={s.fullScreen}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Recurring Payment Set</Text>
        <View style={[s.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
          {[
            { icon: 'arrow-down' as const, label: 'From', value: 'Primary Account' },
            { icon: 'arrow-up' as const, label: 'To', value: 'Freddy Mercury Chase ••4489' },
            { icon: 'cash' as const, label: 'Amount', value: `$${recurringAmount}` },
            { icon: 'repeat' as const, label: 'Repeat', value: recurringRepeat },
            { icon: 'calendar' as const, label: 'Start Date', value: recurringStartDate },
            { icon: 'receipt' as const, label: 'Fee', value: '$0.05' },
          ].map((row) => (
            <View key={row.label} style={s.confirmRow}>
              <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
              <Text style={[s.confirmLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[s.confirmValue, { color: colors.textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('recurring-success')}>
          <Text style={s.primaryBtnText}>Set up recurring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Currency Picker Modal
  // =====================================================
  const renderCurrencyPickerModal = () => (
    <Modal visible={showCurrencyPicker} animationType="slide" transparent>
      <Pressable style={s.modalOverlay} onPress={() => setShowCurrencyPicker(false)}>
        <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Select Currency</Text>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[s.currencyRow, { borderBottomColor: colors.borderLight, paddingHorizontal: 20 }]}
                onPress={() => {
                  if (currencyPickerTarget === 'from') setFromCurrency(currency);
                  else if (currencyPickerTarget === 'to') setToCurrency(currency);
                  else setRequestCurrency(currency);
                  setShowCurrencyPicker(false);
                }}
              >
                <Text style={s.currencyFlag}>{currency.flag}</Text>
                <View style={s.currencyInfo}>
                  <Text style={[s.currencyCode, { color: colors.textPrimary }]}>{currency.code}</Text>
                  <Text style={[s.currencyName, { color: colors.textSecondary }]}>{currency.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  // =====================================================
  // Main Render
  // =====================================================
  const renderStep = () => {
    switch (step) {
      case 'hub': return renderHub();
      case 'contacts': return renderContacts();
      case 'convert-currency': return renderConvertCurrency();
      case 'convert-amount': return renderConvertAmount();
      case 'convert-confirm': return renderConvertConfirm();
      case 'convert-success': return renderSuccess(`\u20AC${getConvertedAmount().toFixed(2)}`, `From $${convertAmount} USD`, null, () => setStep('hub'));
      case 'request-currency': return renderRequestCurrency();
      case 'request-amount': return renderRequestAmount();
      case 'request-recipient': return renderRequestRecipient();
      case 'request-confirm': return renderRequestConfirm();
      case 'request-success': return renderSuccess('Request sent!', `$${requestAmount} to ${requestRecipient?.name ?? ''}`, null, () => setStep('hub'));
      case 'deposit-method': return renderDepositMethod();
      case 'deposit-account': return renderDepositAccount();
      case 'deposit-amount': return renderDepositAmount();
      case 'deposit-confirm': return renderDepositConfirm();
      case 'deposit-success': return renderSuccess('Deposit Complete', `$${depositAmount} to Primary Account`, 'The funds have arrived on your balance.', () => setStep('hub'));
      case 'transfer-destination': return renderTransferDestination();
      case 'transfer-recipient': return renderTransferRecipient();
      case 'transfer-amount': return renderTransferAmount();
      case 'transfer-category': return renderTransferCategory();
      case 'transfer-reference': return renderTransferReference();
      case 'transfer-confirm': return renderTransferConfirm();
      case 'transfer-pin': return renderTransferPin();
      case 'transfer-progress': return renderTransferProgress();
      case 'transfer-success': return renderSuccess('Transfer Complete', `$${transferAmount} to ${transferRecipient?.name ?? 'My Savings'}`, 'The funds have arrived on their balance.', () => setStep('hub'));
      case 'recurring-schedule': return renderRecurringSchedule();
      case 'recurring-destination': return renderRecurringDestination();
      case 'recurring-amount': return renderRecurringAmount();
      case 'recurring-confirm': return renderRecurringConfirm();
      case 'recurring-success': return renderSuccess('Recurring Payment Set', `$${recurringAmount} recurring monthly`, 'Every month to Freddy Mercury Chase ••4489', () => setStep('hub'));
      default: return renderHub();
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStep()}
      {renderCurrencyPickerModal()}
    </SafeAreaView>
  );
}

// =====================================================
// Styles
// =====================================================
const s = StyleSheet.create({
  container: { flex: 1 },
  fullScreen: { flex: 1 },
  centerContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Sections
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },

  // Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  actionBtn: { width: '30%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // Cards
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  emptyDesc: { fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 },

  // List Rows
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1, marginLeft: 12 },
  listTitle: { fontSize: 14, fontWeight: '600' },
  listSub: { fontSize: 12, marginTop: 2 },
  listAmount: { fontSize: 14, fontWeight: '600' },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginHorizontal: 20, marginTop: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

  // Contacts
  contactsCount: { fontSize: 12, marginBottom: 12 },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: '600' },
  contactBank: { fontSize: 13, marginTop: 2 },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  addContactText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Currency
  currencyLabel: { fontSize: 12, marginTop: 16, marginBottom: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  currencyFlag: { fontSize: 28, marginRight: 12 },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 15, fontWeight: '600' },
  currencyName: { fontSize: 13, marginTop: 2 },

  // Amount
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  amountCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  amountLabel: { fontSize: 12, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currencyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  amountInput: { fontSize: 24, fontWeight: '700', textAlign: 'right' },
  swapContainer: { alignItems: 'center', marginVertical: -8, zIndex: 1 },
  swapBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  conversionInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  conversionText: { fontSize: 12 },

  // Confirmation
  conversionVisual: { alignItems: 'center', marginVertical: 24 },
  conversionCurrencies: { flexDirection: 'row', alignItems: 'center' },
  confirmCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  confirmLabel: { flex: 1, fontSize: 13, marginLeft: 12 },
  confirmValue: { fontSize: 13, fontWeight: '600' },
  confirmNote: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Success
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  successSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  successNote: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  successPaymentId: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  successActions: { marginTop: 32, gap: 12, width: '100%' },
  successBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  successBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Numpad
  numpad: { padding: 16 },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  numpadKey: { width: 72, height: 56, alignItems: 'center', justifyContent: 'center' },
  numpadText: { fontSize: 24, fontWeight: '600' },

  // Destination
  destinationCard: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  destinationLabel: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  destinationDesc: { fontSize: 13, marginTop: 4 },

  // Account Selector
  accountSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  accountSelectorText: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Amount Display
  amountDisplay: { alignItems: 'center' },
  amountLarge: { fontSize: 48, fontWeight: '700' },
  amountSub: { fontSize: 12, marginTop: 4 },

  // Category Grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  categoryCard: { width: '30%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  categoryLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Reference
  referenceInput: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 120, textAlignVertical: 'top' },

  // PIN
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 48 },
  pinDot: { width: 16, height: 16, borderRadius: 8 },

  // Progress
  progressContainer: { alignItems: 'center', width: '100%' },
  progressIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  progressTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  progressSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  progressSteps: { marginTop: 32, width: '100%', gap: 24 },
  progressStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  progressStepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressStepLabel: { fontSize: 14, fontWeight: '600' },
  progressStepDesc: { fontSize: 12, marginTop: 2 },

  // Schedule
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  scheduleLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  scheduleValue: { fontSize: 14 },

  // Method
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodLabel: { fontSize: 15, fontWeight: '600' },
  methodDesc: { fontSize: 13, marginTop: 2 },

  // Account Card
  accountCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  accountCardInfo: { flex: 1, marginLeft: 12 },
  accountCardName: { fontSize: 15, fontWeight: '600' },
  accountCardType: { fontSize: 13, marginTop: 2 },
  accountCardBalance: { fontSize: 15, fontWeight: '700' },

  // Footer
  footer: { padding: 20, borderTopWidth: 1, gap: 12 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
});
