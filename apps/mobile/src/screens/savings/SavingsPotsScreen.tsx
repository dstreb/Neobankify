import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  MOCK_LINKED_ACCOUNTS,
  POT_ICONS,
  POT_COLORS,
  FREQUENCY_OPTIONS,
  TARGET_DATES,
} from '../../data/savingsPots';
import type { SavingsPot, PotIcon, PotColor } from '../../data/savingsPots';
import { useSavingsPots } from '../../contexts/SavingsPotsContext';

// =====================================================
// Helpers
// =====================================================
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

function getIoniconName(icon: PotIcon): string {
  const map: Record<PotIcon, string> = {
    airplane: 'airplane',
    home: 'home',
    school: 'school',
    car: 'car',
    heart: 'heart',
    gift: 'gift',
    briefcase: 'briefcase',
    leaf: 'leaf',
    star: 'star',
    rocket: 'rocket',
  };
  return map[icon] || 'wallet';
}

// =====================================================
// Progress Ring Component
// =====================================================
function ProgressRing({ progress, size, color }: { progress: number; size: number; color: string }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'rgba(255,255,255,0.15)',
      }} />
      {/* Progress arc approximation using a View */}
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderTopColor: progress < 0.25 ? 'rgba(255,255,255,0.15)' : color,
        borderRightColor: progress < 0.5 ? 'rgba(255,255,255,0.15)' : color,
        borderBottomColor: progress < 0.75 ? 'rgba(255,255,255,0.15)' : color,
        transform: [{ rotate: '-90deg' }],
      }} />
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.18, fontWeight: '700' }}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

// =====================================================
// Main Screen
// =====================================================
type Step =
  | 'list'
  | 'create_welcome'
  | 'create_name'
  | 'create_goal'
  | 'create_visual'
  | 'create_date'
  | 'create_roundups'
  | 'create_recurring'
  | 'create_custom_freq'
  | 'create_confirm'
  | 'create_success'
  | 'pot_detail'
  | 'pot_edit'
  | 'pot_roundup_detail'
  | 'pot_roundup_explainer'
  | 'pot_roundup_edit'
  | 'pot_goal_reached'
  | 'pot_delete_confirm'
  | 'select_account';

export function SavingsPotsScreen({ navigation }: { navigation: { goBack: () => void; navigate: (s: string) => void } }) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [step, setStep] = useState<Step>('list');
  const { pots, addPot, updatePot, deletePot, totalSaved } = useSavingsPots();
  const [selectedPot, setSelectedPot] = useState<SavingsPot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create flow state
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState(0);
  const [newIcon, setNewIcon] = useState<PotIcon>('airplane');
  const [newColor, setNewColor] = useState(POT_COLORS[8]);
  const [newDateIndex, setNewDateIndex] = useState(2);
  const [newRoundupsEnabled, setNewRoundupsEnabled] = useState(false);
  const [newMultiplier, setNewMultiplier] = useState(5);
  const [newRecurringEnabled, setNewRecurringEnabled] = useState(false);
  const [newFrequency, setNewFrequency] = useState('Monthly');
  const [newCustomDays, setNewCustomDays] = useState(17);
  const [newRecurringAmount, setNewRecurringAmount] = useState(0);

  // Edit flow state
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState(0);
  const [editIcon, setEditIcon] = useState<PotIcon>('airplane');
  const [editColor, setEditColor] = useState(POT_COLORS[0]);
  const [editRoundupsEnabled, setEditRoundupsEnabled] = useState(false);
  const [editMultiplier, setEditMultiplier] = useState(1);
  const [editRecurringEnabled, setEditRecurringEnabled] = useState(false);
  const [editFrequency, setEditFrequency] = useState('Monthly');
  const [editRecurringAmount, setEditRecurringAmount] = useState(0);
  const [editLinkedAccountId, setEditLinkedAccountId] = useState('1');

  // Select account modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTarget, setAccountModalTarget] = useState<'create' | 'edit'>('create');

  // Roundup edit state
  const [editRoundupMultiplier, setEditRoundupMultiplier] = useState(5);
  const [editRoundupEnabled, setEditRoundupEnabled] = useState(true);

  // totalSaved comes from useSavingsPots() context
  const roundupTotal = 52.25;

  // =====================================================
  // Handlers
  // =====================================================
  const handleBack = () => {
    switch (step) {
      case 'create_welcome': setStep('list'); break;
      case 'create_name': setStep('create_welcome'); break;
      case 'create_goal': setStep('create_name'); break;
      case 'create_visual': setStep('create_goal'); break;
      case 'create_date': setStep('create_visual'); break;
      case 'create_roundups': setStep('create_date'); break;
      case 'create_recurring': setStep('create_roundups'); break;
      case 'create_custom_freq': setStep('create_recurring'); break;
      case 'create_confirm': setStep('create_recurring'); break;
      case 'pot_detail': setStep('list'); setSelectedPot(null); break;
      case 'pot_edit': setStep('pot_detail'); break;
      case 'pot_roundup_detail': setStep('pot_detail'); break;
      case 'pot_roundup_explainer': setStep('pot_roundup_detail'); break;
      case 'pot_roundup_edit': setStep('pot_roundup_detail'); break;
      case 'pot_goal_reached': setStep('pot_detail'); break;
      case 'pot_delete_confirm': setStep('pot_edit'); break;
      default: setStep('list');
    }
  };

  const openPot = (pot: SavingsPot) => {
    setSelectedPot(pot);
    setStep('pot_detail');
  };

  const openEdit = (pot: SavingsPot) => {
    setEditName(pot.name);
    setEditGoal(pot.goalAmount);
    setEditIcon(pot.icon);
    setEditColor(pot.color);
    setEditRoundupsEnabled(pot.roundupsEnabled);
    setEditMultiplier(pot.roundupMultiplier);
    setEditRecurringEnabled(pot.recurringEnabled);
    setEditFrequency(pot.recurringFrequency);
    setEditRecurringAmount(pot.recurringAmount);
    setEditLinkedAccountId(pot.linkedAccountId);
    setStep('pot_edit');
  };

  const handleCreatePot = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newPot: SavingsPot = {
        id: String(Date.now()),
        name: newName || 'My Savings Pot',
        icon: newIcon,
        color: newColor,
        currentAmount: 0,
        goalAmount: newGoal,
        targetDate: `${TARGET_DATES[newDateIndex].month} ${TARGET_DATES[newDateIndex].day}, ${TARGET_DATES[newDateIndex].year}`,
        roundupsEnabled: newRoundupsEnabled,
        roundupMultiplier: newMultiplier,
        recurringEnabled: newRecurringEnabled,
        recurringAmount: newRecurringAmount,
        recurringFrequency: newFrequency === 'Custom Frequency' ? `Every ${newCustomDays} days` : newFrequency,
        linkedAccountId: '1',
        activities: [],
      };
      addPot(newPot);
      setIsProcessing(false);
      setStep('create_success');
    }, 1500);
  };

  const handleUpdatePot = () => {
    if (!selectedPot) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updated: SavingsPot = {
        ...selectedPot,
        name: editName,
        goalAmount: editGoal,
        icon: editIcon,
        color: editColor,
        roundupsEnabled: editRoundupsEnabled,
        roundupMultiplier: editMultiplier,
        recurringEnabled: editRecurringEnabled,
        recurringFrequency: editFrequency,
        recurringAmount: editRecurringAmount,
        linkedAccountId: editLinkedAccountId,
      };
      updatePot(updated);
      setSelectedPot(updated);
      setIsProcessing(false);
      setStep('pot_detail');
    }, 1000);
  };

  const [deleteError, setDeleteError] = useState('');

  const handleDeletePot = () => {
    if (!selectedPot) return;
    if (selectedPot.currentAmount > 0) {
      // Cannot delete pot with balance — show error message on the delete confirmation screen
      setDeleteError(`Please withdraw your ${formatCurrency(selectedPot.currentAmount)} balance before deleting this pot.`);
      return;
    }
    setDeleteError('');
    deletePot(selectedPot.id);
    setSelectedPot(null);
    setStep('list');
  };

  const resetCreate = () => {
    setNewName('');
    setNewGoal(0);
    setNewIcon('airplane');
    setNewColor(POT_COLORS[8]);
    setNewDateIndex(2);
    setNewRoundupsEnabled(false);
    setNewMultiplier(5);
    setNewRecurringEnabled(false);
    setNewFrequency('Monthly');
    setNewCustomDays(17);
    setNewRecurringAmount(0);
  };

  // =====================================================
  // Render: List (Dashboard-style)
  // =====================================================
  const renderList = () => (
    <SafeAreaView style={[s.container, { backgroundColor: '#0C1B2A' }]} edges={['top']}>
      {/* Yellow header */}
      <View style={s.listHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={s.listHeaderCenter}>
          <Text style={s.listHeaderBalance}>{formatCurrency(totalSaved)}</Text>
          <Text style={s.listHeaderSub}>Total Savings</Text>
        </View>
        <TouchableOpacity style={s.listHeaderAdd} onPress={() => { resetCreate(); setStep('create_welcome'); }}>
          <Ionicons name="add" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#0C1B2A' }} showsVerticalScrollIndicator={false}>
        {/* My Savings Pots */}
        <View style={[s.listSection, { backgroundColor: '#0C1B2A' }]}>
          <Text style={s.listSectionTitle}>My Savings Pots</Text>
          {pots.map((pot) => {
            const progress = pot.goalAmount > 0 ? pot.currentAmount / pot.goalAmount : 0;
            return (
              <TouchableOpacity
                key={pot.id}
                style={s.potListItem}
                onPress={() => openPot(pot)}
              >
                <View style={[s.potListIcon, { backgroundColor: pot.color }]}>
                  <Ionicons name={getIoniconName(pot.icon) as any} size={20} color="#FFFFFF" />
                </View>
                <View style={s.potListInfo}>
                  <Text style={s.potListName}>{pot.name}</Text>
                  <Text style={s.potListGoal}>{formatCurrency(pot.goalAmount)} Goal</Text>
                  <View style={s.potListProgressBar}>
                    <View style={[s.potListProgressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: pot.color }]} />
                  </View>
                </View>
                <View style={s.potListRight}>
                  <Text style={s.potListAmount}>{formatCurrency(pot.currentAmount)}</Text>
                  <Text style={s.potListPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={s.addPotListBtn}
            onPress={() => { resetCreate(); setStep('create_welcome'); }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#0369A1" />
            <Text style={s.addPotListText}>Add New Pot</Text>
          </TouchableOpacity>
        </View>

        {/* Round-ups */}
        <View style={[s.listSection, { backgroundColor: '#0C1B2A', marginTop: 8 }]}>
          <Text style={s.listSectionTitle}>Round-ups</Text>
          <View style={s.roundupCard}>
            <View style={s.roundupCardLeft}>
              <Text style={s.roundupAmount}>{formatCurrency(roundupTotal)}</Text>
              <Text style={s.roundupSub}>saved last month</Text>
            </View>
            <View style={s.roundupMultiplierBadge}>
              <Text style={s.roundupMultiplierText}>5x</Text>
            </View>
          </View>
          <Text style={s.roundupDesc}>Round-up every purchase for extra efficiency</Text>
          <TouchableOpacity style={s.roundupEditBtn}>
            <Text style={s.roundupEditText}>Edit round-ups</Text>
          </TouchableOpacity>
        </View>

        {/* Saving Activities */}
        <View style={[s.listSection, { backgroundColor: '#0C1B2A', marginTop: 8, marginBottom: 32 }]}>
          <View style={s.activitiesHeader}>
            <Text style={s.listSectionTitle}>Saving Activities</Text>
            <Text style={s.activitiesDate}>January 2026</Text>
          </View>
          {pots.flatMap((p) => p.activities).slice(0, 5).map((act) => (
            <View key={act.id} style={s.activityItem}>
              <View style={[s.activityIcon, { backgroundColor: act.type === 'roundup' ? '#FEF3C7' : '#D1FAE5' }]}>
                <Ionicons
                  name={act.type === 'roundup' ? 'refresh-circle' : 'arrow-down-circle'}
                  size={20}
                  color={act.type === 'roundup' ? '#F59E0B' : '#10B981'}
                />
              </View>
              <View style={s.activityInfo}>
                <Text style={s.activityDesc}>{act.description}</Text>
                <Text style={s.activityDate}>{act.date}</Text>
              </View>
              <Text style={[s.activityAmount, { color: '#10B981' }]}>+{formatCurrency(act.amount)}</Text>
            </View>
          ))}
          {pots.flatMap((p) => p.activities).length === 0 && (
            <View style={s.emptyActivities}>
              <Ionicons name="time-outline" size={32} color="#6B7280" />
              <Text style={s.emptyActivitiesText}>No activity to show just yet</Text>
              <Text style={s.emptyActivitiesSub}>Your saving is in progress, no activity yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // =====================================================
  // Render: Create Welcome
  // =====================================================
  const renderCreateWelcome = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>Hey John! I'm here to assist you to make your savings pot. Are you ready? Let's Go!</Text>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity style={s.wizardPrimaryBtn} onPress={() => setStep('create_name')}>
          <Text style={s.wizardPrimaryBtnText}>Yes, Start</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.wizardSecondaryBtn} onPress={() => setStep('list')}>
          <Text style={s.wizardSecondaryBtnText}>No, Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Name
  // =====================================================
  const renderCreateName = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>What's the name of your saving pot?</Text>
        <TextInput
          style={s.wizardInput}
          placeholder="Enter name..."
          placeholderTextColor="#6B7280"
          value={newName}
          onChangeText={setNewName}
        />
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity
          style={[s.wizardPrimaryBtn, !newName.trim() && { opacity: 0.5 }]}
          disabled={!newName.trim()}
          onPress={() => setStep('create_goal')}
        >
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Goal Amount
  // =====================================================
  const renderCreateGoal = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>What is the goal or target amount for your pot?</Text>
        <Text style={s.wizardLabel}>Goal Amount</Text>
        <View style={s.amountRow}>
          <TouchableOpacity style={s.amountBtn} onPress={() => setNewGoal(Math.max(0, newGoal - 500))}>
            <Ionicons name="remove" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.amountValue}>{formatCurrency(newGoal)}</Text>
          <TouchableOpacity style={s.amountBtn} onPress={() => setNewGoal(newGoal + 500)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={s.amountHint}>I wanna save {formatCurrency(newGoal)} for {newName || 'my pot'}.</Text>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity
          style={[s.wizardPrimaryBtn, newGoal <= 0 && { opacity: 0.5 }]}
          disabled={newGoal <= 0}
          onPress={() => setStep('create_visual')}
        >
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Visual (icon + color)
  // =====================================================
  const renderCreateVisual = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: newColor }]}>
          <Ionicons name={getIoniconName(newIcon) as any} size={28} color="#FFFFFF" />
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>How would you like your {newName} pot to appear visually?</Text>
        {/* Icon picker */}
        <View style={s.iconGrid}>
          {POT_ICONS.map((item) => (
            <TouchableOpacity
              key={item.icon}
              style={[s.iconOption, newIcon === item.icon && { borderColor: newColor, borderWidth: 2 }]}
              onPress={() => setNewIcon(item.icon)}
            >
              <Ionicons name={getIoniconName(item.icon) as any} size={22} color={newIcon === item.icon ? newColor : '#9CA3AF'} />
            </TouchableOpacity>
          ))}
        </View>
        {/* Color picker */}
        <View style={s.colorRow}>
          {POT_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.colorDot, { backgroundColor: c }, newColor === c && s.colorDotSelected]}
              onPress={() => setNewColor(c)}
            />
          ))}
        </View>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity style={s.wizardPrimaryBtn} onPress={() => setStep('create_date')}>
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Target Date
  // =====================================================
  const renderCreateDate = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>When would you like to achieve this goal?</Text>
        <View style={s.datePicker}>
          {TARGET_DATES.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[s.dateRow, i === newDateIndex && s.dateRowSelected]}
              onPress={() => setNewDateIndex(i)}
            >
              <Text style={[s.dateMonth, i === newDateIndex && s.dateTextSelected]}>{d.month}</Text>
              <Text style={[s.dateDay, i === newDateIndex && s.dateTextSelected]}>{d.day}</Text>
              <Text style={[s.dateYear, i === newDateIndex && s.dateTextSelected]}>{d.year}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.asapCheck}>
          <View style={s.checkbox} />
          <Text style={s.asapText}>As and as you from now</Text>
        </TouchableOpacity>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity style={s.wizardPrimaryBtn} onPress={() => setStep('create_roundups')}>
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Round-ups
  // =====================================================
  const renderCreateRoundups = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>Would you like to enable round-ups feature?</Text>
        <Text style={s.multiplierDisplay}>{newMultiplier}x</Text>
        <View style={s.multiplierRow}>
          {[1, 2, 3, 4, 5].map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.multiplierBtn, newMultiplier === m && s.multiplierBtnSelected]}
              onPress={() => { setNewRoundupsEnabled(true); setNewMultiplier(m); }}
            >
              <Text style={[s.multiplierBtnText, newMultiplier === m && s.multiplierBtnTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.multiplierHint}>Spend $1.10, save ${((Math.ceil(1.10) - 1.10) * newMultiplier).toFixed(2)}</Text>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity style={s.wizardPrimaryBtn} onPress={() => { setNewRoundupsEnabled(true); setStep('create_recurring'); }}>
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.wizardSecondaryBtn} onPress={() => { setNewRoundupsEnabled(false); setStep('create_recurring'); }}>
          <Text style={s.wizardSecondaryBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Recurring Payment
  // =====================================================
  const renderCreateRecurring = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardLogo}>
        <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
          <Text style={s.wizardLogoText}>S</Text>
        </View>
      </View>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>Would you like to set up recurring payment?</Text>
        <View style={s.frequencyList}>
          {FREQUENCY_OPTIONS.map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[s.frequencyItem, newFrequency === freq && s.frequencyItemSelected]}
              onPress={() => { setNewFrequency(freq); setNewRecurringEnabled(true); }}
            >
              <Text style={[s.frequencyText, newFrequency === freq && s.frequencyTextSelected]}>{freq}</Text>
              {newFrequency === freq && <Ionicons name="checkmark" size={18} color="#0369A1" />}
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.wizardInput}
          placeholder="Next payment: Jan 1st, 1st..."
          placeholderTextColor="#6B7280"
          value={newRecurringAmount > 0 ? String(newRecurringAmount) : ''}
          onChangeText={(v) => setNewRecurringAmount(Number(v) || 0)}
          keyboardType="numeric"
        />
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity
          style={s.wizardPrimaryBtn}
          onPress={() => newFrequency === 'Custom Frequency' ? setStep('create_custom_freq') : setStep('create_confirm')}
        >
          <Text style={s.wizardPrimaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.wizardSecondaryBtn} onPress={() => { setNewRecurringEnabled(false); setStep('create_confirm'); }}>
          <Text style={s.wizardSecondaryBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Custom Frequency
  // =====================================================
  const renderCreateCustomFreq = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
        <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
      <View style={s.wizardContent}>
        <Text style={s.wizardTitle}>Set Custom Frequency</Text>
        <Text style={s.customFreqDisplay}>Every {newCustomDays} days</Text>
        {/* Slider approximation */}
        <View style={s.sliderContainer}>
          <View style={[s.sliderTrack, { backgroundColor: '#1F2937' }]}>
            <View style={[s.sliderFill, { width: `${(newCustomDays / 30) * 100}%`, backgroundColor: '#0369A1' }]} />
          </View>
          <View style={s.sliderBtns}>
            <TouchableOpacity onPress={() => setNewCustomDays(Math.max(1, newCustomDays - 1))}>
              <Ionicons name="remove-circle" size={28} color="#0369A1" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNewCustomDays(Math.min(30, newCustomDays + 1))}>
              <Ionicons name="add-circle" size={28} color="#0369A1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={s.wizardActions}>
        <TouchableOpacity style={s.wizardPrimaryBtn} onPress={() => setStep('create_confirm')}>
          <Text style={s.wizardPrimaryBtnText}>Set Frequency</Text>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Render: Create Confirm
  // =====================================================
  const renderCreateConfirm = () => {
    const targetDate = TARGET_DATES[newDateIndex];
    return (
      <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A' }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C1B2A' }}>
          <TouchableOpacity onPress={handleBack} style={s.wizardBack}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={s.wizardLogo}>
          <View style={[s.wizardLogoCircle, { backgroundColor: '#0369A1' }]}>
            <Text style={s.wizardLogoText}>S</Text>
          </View>
        </View>
        <View style={s.wizardContent}>
          <Text style={s.wizardTitle}>OK John, can you please confirm the following before we proceed?</Text>
          <View style={s.confirmCard}>
            <View style={[s.confirmPotIcon, { backgroundColor: newColor }]}>
              <Ionicons name={getIoniconName(newIcon) as any} size={24} color="#FFFFFF" />
            </View>
            <Text style={s.confirmPotName}>{newName}</Text>
            <Text style={s.confirmPotSub}>Savings Pot</Text>
            <View style={s.confirmDivider} />
            <View style={s.confirmRow}>
              <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
              <Text style={s.confirmLabel}>Target Date</Text>
              <Text style={s.confirmValue}>{targetDate.month} {targetDate.day}, {targetDate.year}</Text>
            </View>
            <View style={s.confirmRow}>
              <Ionicons name="refresh-circle-outline" size={16} color="#9CA3AF" />
              <Text style={s.confirmLabel}>Recurring Payment</Text>
              <Text style={s.confirmValue}>{newRecurringEnabled ? newFrequency : 'None'}</Text>
            </View>
            <View style={s.confirmRow}>
              <Ionicons name="trending-up-outline" size={16} color="#9CA3AF" />
              <Text style={s.confirmLabel}>Round-ups</Text>
              <Text style={s.confirmValue}>{newRoundupsEnabled ? `${newMultiplier}x` : 'No Rule'}</Text>
            </View>
            <View style={s.confirmRow}>
              <Ionicons name="cash-outline" size={16} color="#9CA3AF" />
              <Text style={s.confirmLabel}>Goal</Text>
              <Text style={s.confirmValue}>{formatCurrency(newGoal)}</Text>
            </View>
          </View>
        </View>
        <View style={s.wizardActions}>
          <TouchableOpacity
            style={[s.wizardPrimaryBtn, isProcessing && { opacity: 0.6 }]}
            disabled={isProcessing}
            onPress={handleCreatePot}
          >
            <Text style={s.wizardPrimaryBtnText}>{isProcessing ? 'Creating...' : 'Confirm and create'}</Text>
            {!isProcessing && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =====================================================
  // Render: Create Success
  // =====================================================
  const renderCreateSuccess = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A', justifyContent: 'center', alignItems: 'center' }]}>
      <View style={s.successConfetti}>
        {['🎉', '🎊', '✨', '🎈', '⭐'].map((e, i) => (
          <Text key={i} style={[s.confettiEmoji, { top: 40 + (i * 30), left: 20 + (i * 60) }]}>{e}</Text>
        ))}
      </View>
      <View style={[s.successIcon, { backgroundColor: '#0369A1' }]}>
        <Ionicons name="checkmark" size={40} color="#FFFFFF" />
      </View>
      <Text style={s.successTitle}>Savings pot created!</Text>
      <Text style={s.successSub}>
        You have successfully created your {newName} savings pot. Now let's go!
      </Text>
      <TouchableOpacity
        style={[s.wizardPrimaryBtn, { marginTop: 32, width: '80%' }]}
        onPress={() => {
          const created = pots[pots.length - 1];
          if (created) {
            setSelectedPot(created);
            setStep('pot_detail');
          } else {
            setStep('list');
          }
        }}
      >
        <Text style={s.wizardPrimaryBtnText}>Start contributing</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // Render: Pot Detail
  // =====================================================
  const renderPotDetail = () => {
    if (!selectedPot) return null;
    const progress = selectedPot.goalAmount > 0 ? selectedPot.currentAmount / selectedPot.goalAmount : 0;
    const isGoalReached = progress >= 1;

    return (
      <SafeAreaView style={[s.container, { backgroundColor: '#0C1B2A' }]} edges={['top']}>
        {/* Pot header */}
        <View style={[s.potDetailHeader, { backgroundColor: '#0C1B2A' }]}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.potDetailHeaderTitle}>{selectedPot.name} Pot</Text>
          <TouchableOpacity onPress={() => openEdit(selectedPot)}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#0C1B2A' }} showsVerticalScrollIndicator={false}>
          {/* Balance + progress */}
          <View style={s.potDetailBalance}>
            <Text style={s.potDetailAmount}>{formatCurrency(selectedPot.currentAmount)}</Text>
            <Text style={s.potDetailGoalLabel}>Total Contribution</Text>
            <Text style={s.potDetailGoalSub}>Goal Completed {Math.round(progress * 100)}%</Text>
            <View style={{ marginTop: 16 }}>
              <ProgressRing progress={progress} size={120} color={isGoalReached ? '#10B981' : selectedPot.color} />
            </View>
            <Text style={s.potDetailGoalAmount}>{formatCurrency(selectedPot.goalAmount)} target</Text>
            {isGoalReached && (
              <TouchableOpacity
                style={[s.goalReachedBadge, { backgroundColor: '#10B981' }]}
                onPress={() => setStep('pot_goal_reached')}
              >
                <Ionicons name="trophy" size={16} color="#FFFFFF" />
                <Text style={s.goalReachedText}>Goal Reached!</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick actions */}
          <View style={s.potActions}>
            {[
              { icon: 'arrow-down-circle-outline', label: 'Deposit' },
              { icon: 'arrow-up-circle-outline', label: 'Withdraw' },
              { icon: 'people-outline', label: 'Fund' },
              { icon: 'create-outline', label: 'Edit' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={s.potActionBtn}
                onPress={() => action.label === 'Edit' ? openEdit(selectedPot) : undefined}
              >
                <View style={[s.potActionIcon, { backgroundColor: '#1F2937' }]}>
                  <Ionicons name={action.icon as any} size={22} color="#FFFFFF" />
                </View>
                <Text style={s.potActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Saving Activities */}
          <View style={[s.listSection, { backgroundColor: '#0C1B2A', marginTop: 8 }]}>
            <View style={s.activitiesHeader}>
              <Text style={s.listSectionTitle}>Saving Activities</Text>
              <Text style={s.activitiesDate}>Jan 2026</Text>
            </View>
            {selectedPot.activities.length > 0 ? selectedPot.activities.map((act) => (
              <View key={act.id} style={s.activityItem}>
                <View style={[s.activityIcon, { backgroundColor: act.type === 'roundup' ? '#FEF3C7' : '#D1FAE5' }]}>
                  <Ionicons
                    name={act.type === 'roundup' ? 'refresh-circle' : 'arrow-down-circle'}
                    size={20}
                    color={act.type === 'roundup' ? '#F59E0B' : '#10B981'}
                  />
                </View>
                <View style={s.activityInfo}>
                  <Text style={s.activityDesc}>{act.description}</Text>
                  <Text style={s.activityDate}>{act.date}</Text>
                </View>
                <Text style={[s.activityAmount, { color: '#10B981' }]}>+{formatCurrency(act.amount)}</Text>
              </View>
            )) : (
              <View style={s.emptyActivities}>
                <Ionicons name="time-outline" size={32} color="#6B7280" />
                <Text style={s.emptyActivitiesText}>No activity to show just yet</Text>
                <Text style={s.emptyActivitiesSub}>Your saving is in progress, no activity yet.</Text>
              </View>
            )}
          </View>

          {/* Recurring Payment */}
          <View style={[s.listSection, { backgroundColor: '#0C1B2A', marginTop: 8, marginBottom: 32 }]}>
            <Text style={s.listSectionTitle}>Recurring Payment</Text>
            {selectedPot.recurringEnabled ? (
              <>
                {[
                  { label: 'Recurring', amount: selectedPot.recurringAmount, sub: selectedPot.recurringFrequency },
                  { label: 'Recurring', amount: selectedPot.recurringAmount, sub: 'Every 5th month' },
                ].map((r, i) => (
                  <View key={i} style={s.activityItem}>
                    <View style={[s.activityIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="repeat" size={20} color="#3B82F6" />
                    </View>
                    <View style={s.activityInfo}>
                      <Text style={s.activityDesc}>{r.label}</Text>
                      <Text style={s.activityDate}>{r.sub}</Text>
                    </View>
                    <Text style={[s.activityAmount, { color: '#10B981' }]}>+{formatCurrency(r.amount)}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={s.emptyActivities}>
                <Ionicons name="calendar-outline" size={32} color="#6B7280" />
                <Text style={s.emptyActivitiesText}>No automatic payment</Text>
                <Text style={s.emptyActivitiesSub}>You haven't set up any automatic payment for this pot.</Text>
                <TouchableOpacity style={s.setupRecurringBtn} onPress={() => openEdit(selectedPot)}>
                  <Text style={s.setupRecurringText}>Set up recurring payment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // =====================================================
  // Render: Edit Pot
  // =====================================================
  const renderPotEdit = () => {
    if (!selectedPot) return null;
    return (
      <SafeAreaView style={[s.container, { backgroundColor: '#111827' }]} edges={['top']}>
        <View style={s.editHeader}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.editHeaderTitle}>Edit Savings Pot</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={s.editSection}>
            <Text style={s.editSectionLabel}>General</Text>

            {/* Pot Name */}
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Pot Name</Text>
              <TextInput
                style={s.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Goal Amount */}
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Goal Amount</Text>
              <View style={s.editAmountRow}>
                <TouchableOpacity onPress={() => setEditGoal(Math.max(0, editGoal - 500))}>
                  <Ionicons name="remove-circle-outline" size={24} color="#9CA3AF" />
                </TouchableOpacity>
                <Text style={s.editAmountValue}>{formatCurrency(editGoal)}</Text>
                <TouchableOpacity onPress={() => setEditGoal(editGoal + 500)}>
                  <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Target Date */}
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Target Date</Text>
              <View style={s.editInputRow}>
                <Text style={s.editInputValue}>{selectedPot.targetDate}</Text>
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
              </View>
            </View>

            {/* Savings Account */}
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Savings Account</Text>
              <TouchableOpacity
                style={s.editInputRow}
                onPress={() => { setAccountModalTarget('edit'); setShowAccountModal(true); }}
              >
                <Text style={s.editInputValue}>
                  {MOCK_LINKED_ACCOUNTS.find((a) => a.id === editLinkedAccountId)?.name || 'Select account'} ••{MOCK_LINKED_ACCOUNTS.find((a) => a.id === editLinkedAccountId)?.lastFour}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Appearance */}
          <View style={s.editSection}>
            <Text style={s.editSectionLabel}>Appearance</Text>
            <View style={s.iconGrid}>
              {POT_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[s.iconOption, editIcon === item.icon && { borderColor: editColor, borderWidth: 2 }]}
                  onPress={() => setEditIcon(item.icon)}
                >
                  <Ionicons name={getIoniconName(item.icon) as any} size={22} color={editIcon === item.icon ? editColor : '#9CA3AF'} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.colorRow}>
              {POT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, editColor === c && s.colorDotSelected]}
                  onPress={() => setEditColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Round-ups */}
          <View style={s.editSection}>
            <Text style={s.editSectionLabel}>Round-ups</Text>
            <View style={s.editToggleRow}>
              <View>
                <Text style={s.editFieldLabel}>Round-up account</Text>
                <Text style={s.editFieldSub}>Tracks round-up savings</Text>
              </View>
              <Switch
                value={editRoundupsEnabled}
                onValueChange={setEditRoundupsEnabled}
                trackColor={{ false: '#374151', true: '#0369A1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {editRoundupsEnabled && (
              <View style={s.editField}>
                <Text style={s.editFieldLabel}>Round-up Multiplier</Text>
                <View style={s.multiplierRow}>
                  {[1, 2, 3, 4, 5].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[s.multiplierBtn, editMultiplier === m && s.multiplierBtnSelected]}
                      onPress={() => setEditMultiplier(m)}
                    >
                      <Text style={[s.multiplierBtnText, editMultiplier === m && s.multiplierBtnTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Automatic Transfer */}
          <View style={s.editSection}>
            <Text style={s.editSectionLabel}>Automatic Transfer</Text>
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Transfer Incoming Source</Text>
              <TextInput
                style={s.editInput}
                placeholder="Enter source..."
                placeholderTextColor="#6B7280"
                value={editRecurringEnabled ? 'Auto transfer' : ''}
                onChangeText={() => setEditRecurringEnabled(true)}
              />
            </View>
            <View style={s.editField}>
              <Text style={s.editFieldLabel}>Transfer Frequency</Text>
              <TouchableOpacity style={s.editInputRow}>
                <Text style={s.editInputValue}>{editFrequency}</Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons */}
          <View style={s.editActions}>
            <TouchableOpacity
              style={[s.updateBtn, isProcessing && { opacity: 0.6 }]}
              disabled={isProcessing}
              onPress={handleUpdatePot}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={s.updateBtnText}>{isProcessing ? 'Updating...' : 'Update Savings Pot'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={() => { setDeleteError(''); setStep('pot_delete_confirm'); }}>
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={s.deleteBtnText}>Delete Savings Pot</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // =====================================================
  // Render: Goal Reached
  // =====================================================
  const renderGoalReached = () => (
    <View style={[s.wizardContainer, { backgroundColor: '#0C1B2A', justifyContent: 'center', alignItems: 'center' }]}>
      <View style={s.successConfetti}>
        {['🎉', '🎊', '✨', '🎈', '⭐', '🏆'].map((e, i) => (
          <Text key={i} style={[s.confettiEmoji, { top: 30 + (i * 25), left: 10 + (i * 55) }]}>{e}</Text>
        ))}
      </View>
      <View style={[s.successIcon, { backgroundColor: '#10B981' }]}>
        <Ionicons name="trophy" size={40} color="#FFFFFF" />
      </View>
      <Text style={s.successTitle}>Saving Goal reached!</Text>
      <Text style={s.successSub}>
        Spend your card and save the change to your {selectedPot?.name} savings pot. You've reached your goal!
      </Text>
      <View style={s.goalReachedCard}>
        <View style={[s.potListIcon, { backgroundColor: selectedPot?.color || '#0369A1', width: 40, height: 40, borderRadius: 20 }]}>
          <Ionicons name={getIoniconName(selectedPot?.icon || 'star') as any} size={20} color="#FFFFFF" />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={s.goalReachedCardName}>{selectedPot?.name}</Text>
          <Text style={s.goalReachedCardAmount}>{formatCurrency(selectedPot?.goalAmount || 0)} total</Text>
        </View>
        <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginLeft: 'auto' }} />
      </View>
      <TouchableOpacity style={[s.wizardPrimaryBtn, { marginTop: 24, width: '80%', backgroundColor: '#10B981' }]} onPress={() => setStep('pot_detail')}>
        <Text style={s.wizardPrimaryBtnText}>Awesome, thanks!</Text>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity style={[s.wizardSecondaryBtn, { marginTop: 8 }]} onPress={() => setStep('pot_detail')}>
        <Text style={s.wizardSecondaryBtnText}>I've noted my goal</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // Render: Delete Confirm
  // =====================================================
  const renderDeleteConfirm = () => (
    <View style={[s.wizardContainer, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }]}>
      <View style={[s.deleteModal, { backgroundColor: '#1F2937' }]}>
        <View style={[s.deleteModalIcon, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="trash" size={28} color="#FFFFFF" />
        </View>
        <Text style={s.deleteModalTitle}>Are you sure to delete {selectedPot?.name} Pot?</Text>
        <Text style={s.deleteModalSub}>
          You need to withdraw all of your money from that. Then please let me can delete it.
        </Text>
        {deleteError !== '' && (
          <View style={{ backgroundColor: '#EF444420', borderRadius: 8, padding: 10, marginBottom: 10, width: '100%' }}>
            <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{deleteError}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.deleteConfirmBtn, selectedPot && selectedPot.currentAmount > 0 && { opacity: 0.5 }]}
          onPress={handleDeletePot}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={s.deleteConfirmBtnText}>Yes, delete pot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setStep('pot_edit')}>
          <Text style={s.deleteCancelBtnText}>No, cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =====================================================
  // Select Account Modal
  // =====================================================
  const renderSelectAccountModal = () => (
    <Modal visible={showAccountModal} transparent animationType="slide" onRequestClose={() => setShowAccountModal(false)}>
      <Pressable style={s.modalOverlay} onPress={() => setShowAccountModal(false)}>
        <Pressable style={[s.accountSheet, { backgroundColor: '#1F2937' }]} onPress={(e) => e.stopPropagation()}>
          <Text style={s.accountSheetTitle}>Select Savings Account</Text>
          {MOCK_LINKED_ACCOUNTS.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[
                s.accountItem,
                (accountModalTarget === 'edit' ? editLinkedAccountId : '1') === acc.id && { backgroundColor: '#0369A1' },
              ]}
              onPress={() => {
                if (accountModalTarget === 'edit') setEditLinkedAccountId(acc.id);
                setShowAccountModal(false);
              }}
            >
              <View style={[s.accountItemIcon, { backgroundColor: acc.color }]}>
                <Ionicons name="card" size={18} color="#FFFFFF" />
              </View>
              <View style={s.accountItemInfo}>
                <Text style={s.accountItemName}>{acc.name} ••{acc.lastFour}</Text>
                <Text style={s.accountItemSub}>Checking account ••{acc.lastFour}</Text>
              </View>
              <Text style={s.accountItemBalance}>{formatCurrency(acc.balance)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.accountSelectBtn} onPress={() => setShowAccountModal(false)}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={s.accountSelectBtnText}>Select</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // =====================================================
  // Main render router
  // =====================================================
  const renderStep = () => {
    switch (step) {
      case 'list': return renderList();
      case 'create_welcome': return renderCreateWelcome();
      case 'create_name': return renderCreateName();
      case 'create_goal': return renderCreateGoal();
      case 'create_visual': return renderCreateVisual();
      case 'create_date': return renderCreateDate();
      case 'create_roundups': return renderCreateRoundups();
      case 'create_recurring': return renderCreateRecurring();
      case 'create_custom_freq': return renderCreateCustomFreq();
      case 'create_confirm': return renderCreateConfirm();
      case 'create_success': return renderCreateSuccess();
      case 'pot_detail': return renderPotDetail();
      case 'pot_edit': return renderPotEdit();
      case 'pot_goal_reached': return renderGoalReached();
      case 'pot_delete_confirm': return renderDeleteConfirm();
      default: return renderList();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderStep()}
      {renderSelectAccountModal()}
    </View>
  );
}

// =====================================================
// Styles
// =====================================================
const s = StyleSheet.create({
  container: { flex: 1 },

  // List header (yellow)
  listHeader: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 4 },
  listHeaderCenter: { flex: 1, alignItems: 'center' },
  listHeaderBalance: { fontSize: 28, fontWeight: '700', color: '#111827' },
  listHeaderSub: { fontSize: 13, color: '#374151', marginTop: 2 },
  listHeaderAdd: { padding: 4 },

  // List sections
  listSection: { paddingHorizontal: 16, paddingVertical: 16 },
  listSectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },

  // Pot list items
  potListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  potListIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  potListInfo: { flex: 1 },
  potListName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  potListGoal: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  potListProgressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  potListProgressFill: { height: '100%', borderRadius: 2 },
  potListRight: { alignItems: 'flex-end', marginRight: 4 },
  potListAmount: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  potListPct: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  addPotListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addPotListText: { fontSize: 14, color: '#0369A1', fontWeight: '600' },

  // Round-ups card
  roundupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  roundupCardLeft: {},
  roundupAmount: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  roundupSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  roundupMultiplierBadge: {
    backgroundColor: '#0369A1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roundupMultiplierText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  roundupDesc: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  roundupEditBtn: { alignSelf: 'flex-start' },
  roundupEditText: { fontSize: 13, color: '#0369A1', fontWeight: '600' },

  // Activities
  activitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activitiesDate: { fontSize: 12, color: '#9CA3AF' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: { flex: 1 },
  activityDesc: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },
  activityDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '600' },
  emptyActivities: { alignItems: 'center', paddingVertical: 24 },
  emptyActivitiesText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginTop: 8 },
  emptyActivitiesSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  setupRecurringBtn: {
    marginTop: 12,
    backgroundColor: '#0369A1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  setupRecurringText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  // Wizard
  wizardContainer: { flex: 1, paddingHorizontal: 24 },
  wizardBack: { padding: 8, marginTop: 8 },
  wizardLogo: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  wizardLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardLogoText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  wizardContent: { flex: 1 },
  wizardTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 30, marginBottom: 24 },
  wizardLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  wizardInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  wizardActions: { paddingBottom: 40, gap: 12 },
  wizardPrimaryBtn: {
    backgroundColor: '#0369A1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wizardPrimaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  wizardSecondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  wizardSecondaryBtnText: { fontSize: 15, color: '#9CA3AF' },

  // Amount picker
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 16 },
  amountBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountValue: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  amountHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Icon grid
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Color picker
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFFFFF' },

  // Date picker
  datePicker: { gap: 4 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 16,
  },
  dateRowSelected: { backgroundColor: '#0369A1' },
  dateMonth: { fontSize: 15, color: '#9CA3AF', width: 36 },
  dateDay: { fontSize: 15, color: '#9CA3AF', width: 24 },
  dateYear: { fontSize: 15, color: '#9CA3AF' },
  dateTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  asapCheck: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#6B7280' },
  asapText: { fontSize: 13, color: '#9CA3AF' },

  // Multiplier
  multiplierDisplay: { fontSize: 64, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginVertical: 16 },
  multiplierRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  multiplierBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierBtnSelected: { backgroundColor: '#0369A1' },
  multiplierBtnText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF' },
  multiplierBtnTextSelected: { color: '#FFFFFF' },
  multiplierHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Frequency list
  frequencyList: { gap: 4, marginBottom: 16 },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  frequencyItemSelected: { backgroundColor: '#0C2A45' },
  frequencyText: { fontSize: 15, color: '#9CA3AF' },
  frequencyTextSelected: { color: '#0369A1', fontWeight: '600' },

  // Custom frequency
  customFreqDisplay: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginVertical: 24 },
  sliderContainer: { gap: 16 },
  sliderTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderBtns: { flexDirection: 'row', justifyContent: 'space-between' },

  // Confirm card
  confirmCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  confirmPotIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmPotName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  confirmPotSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  confirmDivider: { width: '100%', height: 1, backgroundColor: '#374151', marginBottom: 16 },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    gap: 8,
  },
  confirmLabel: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  confirmValue: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  // Success
  successConfetti: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  confettiEmoji: { position: 'absolute', fontSize: 24 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },

  // Pot detail
  potDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  potDetailHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  potDetailBalance: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  potDetailAmount: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  potDetailGoalLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  potDetailGoalSub: { fontSize: 13, color: '#9CA3AF' },
  potDetailGoalAmount: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  goalReachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  goalReachedText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // Pot actions
  potActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  potActionBtn: { alignItems: 'center', gap: 6 },
  potActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potActionLabel: { fontSize: 12, color: '#9CA3AF' },

  // Edit
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  editHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  editSection: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  editSectionLabel: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  editField: { marginBottom: 16 },
  editFieldLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  editFieldSub: { fontSize: 12, color: '#6B7280' },
  editInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  editInputValue: { fontSize: 15, color: '#FFFFFF' },
  editAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editAmountValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  editToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editActions: { padding: 16, gap: 12, marginBottom: 40 },
  updateBtn: {
    backgroundColor: '#0369A1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  deleteBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Goal reached
  goalReachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    marginTop: 24,
  },
  goalReachedCardName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  goalReachedCardAmount: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  // Delete modal
  deleteModal: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  deleteModalSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  deleteConfirmBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  deleteConfirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  deleteCancelBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  deleteCancelBtnText: { fontSize: 15, color: '#9CA3AF' },

  // Account modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  accountSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  accountSheetTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#374151',
  },
  accountItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountItemInfo: { flex: 1 },
  accountItemName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  accountItemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  accountItemBalance: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  accountSelectBtn: {
    backgroundColor: '#0369A1',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  accountSelectBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
