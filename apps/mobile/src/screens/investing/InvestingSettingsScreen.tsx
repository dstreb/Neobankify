import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';

export function InvestingSettingsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [taxLossHarvesting, setTaxLossHarvesting] = useState(true);
  const [dividendReinvest, setDividendReinvest] = useState(true);
  const [roundUps, setRoundUps] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Investment Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>AUTOMATION</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Auto-Rebalance</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Automatically rebalance when allocations drift beyond threshold
              </Text>
            </View>
            <Switch value={autoRebalance} onValueChange={setAutoRebalance} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tax-Loss Harvesting</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Automatically harvest tax losses with wash-sale protection
              </Text>
            </View>
            <Switch value={taxLossHarvesting} onValueChange={setTaxLossHarvesting} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Dividend Reinvestment</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Automatically reinvest dividends into your portfolio
              </Text>
            </View>
            <Switch value={dividendReinvest} onValueChange={setDividendReinvest} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Round-Up Investing</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                Round up purchases and invest the spare change
              </Text>
            </View>
            <Switch value={roundUps} onValueChange={setRoundUps} trackColor={{ true: colors.primary }} />
          </View>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RISK PROFILE</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Current Risk Level</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>Moderate</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.settingDivider, { backgroundColor: colors.borderLight }]} />
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Rebalance Threshold</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>5% drift</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 13, marginTop: 2 },
  settingDivider: { height: 1, marginVertical: 8 },
});
