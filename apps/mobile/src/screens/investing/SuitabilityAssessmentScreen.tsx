import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/Card';

interface Question {
  id: string;
  question: string;
  options: { label: string; value: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'risk_tolerance',
    question: 'How would you describe your risk tolerance?',
    options: [
      { label: 'Conservative — I prefer stability', value: 'conservative', score: 1 },
      { label: 'Moderate — Some risk for growth', value: 'moderate', score: 2 },
      { label: 'Aggressive — Maximum growth potential', value: 'aggressive', score: 3 },
    ],
  },
  {
    id: 'investment_horizon',
    question: 'When do you plan to use this money?',
    options: [
      { label: 'Less than 3 years', value: 'short', score: 1 },
      { label: '3-10 years', value: 'medium', score: 2 },
      { label: 'More than 10 years', value: 'long', score: 3 },
    ],
  },
  {
    id: 'loss_reaction',
    question: 'If your portfolio dropped 20%, what would you do?',
    options: [
      { label: 'Sell everything immediately', value: 'sell', score: 1 },
      { label: 'Sell some to reduce risk', value: 'reduce', score: 2 },
      { label: 'Hold and wait for recovery', value: 'hold', score: 3 },
      { label: 'Buy more at lower prices', value: 'buy_more', score: 4 },
    ],
  },
  {
    id: 'investment_objective',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve capital', value: 'preservation', score: 1 },
      { label: 'Generate income', value: 'income', score: 2 },
      { label: 'Balanced growth and income', value: 'balanced', score: 3 },
      { label: 'Maximize long-term growth', value: 'growth', score: 4 },
    ],
  },
  {
    id: 'experience',
    question: 'How much investing experience do you have?',
    options: [
      { label: 'None — I am new to investing', value: 'none', score: 1 },
      { label: 'Some — Basic knowledge', value: 'some', score: 2 },
      { label: 'Experienced — Active investor', value: 'experienced', score: 3 },
    ],
  },
];

export function SuitabilityAssessmentScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / QUESTIONS.length;

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const goNext = () => {
    if (!answers[currentQuestion.id]) {
      Alert.alert('Please select an answer');
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Submit assessment
      Alert.alert(
        'Assessment Complete',
        'Your risk profile has been saved. We will create a personalized portfolio for you.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Risk Assessment</Text>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>{currentIndex + 1}/{QUESTIONS.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{currentQuestion.question}</Text>

        {currentQuestion.options.map((option) => {
          const selected = answers[currentQuestion.id] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
                selected && { borderWidth: 2 },
              ]}
              onPress={() => selectAnswer(currentQuestion.id, option.value)}
            >
              <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                {selected && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: answers[currentQuestion.id] ? colors.primary : colors.border }]}
          onPress={goNext}
          disabled={!answers[currentQuestion.id]}
        >
          <Text style={[styles.nextButtonText, { color: answers[currentQuestion.id] ? '#fff' : colors.textSecondary }]}>
            {currentIndex === QUESTIONS.length - 1 ? 'Complete' : 'Next'}
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
  progress: { fontSize: 14, fontWeight: '500' },
  progressBar: { height: 3, marginHorizontal: 16 },
  progressFill: { height: 3, borderRadius: 2 },
  content: { padding: 16, paddingBottom: 100 },
  question: { fontSize: 22, fontWeight: '700', marginBottom: 24, lineHeight: 30 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  optionText: { fontSize: 15, fontWeight: '500', flex: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  nextButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: '600' },
});
