import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import {
  generateAIResponse,
  DEFAULT_CHAT_SETTINGS,
  matchPattern,
  RICH_CARDS,
  type AIChatMsg,
  type RichCard,
  type ChatSettings,
  type AIModelOption,
} from '../../data/aiResponses';
import { initElevenLabs, isElevenLabsReady, speakText } from '../../services/elevenlabs';
import {
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  startListening,
  stopListening,
} from '../../services/speechRecognition';
import { setupElevenLabs, getElevenLabsApiKey, getAgentId } from '../../config/elevenlabs';
import {
  startConversation,
  endConversation,
  isConversationActive,
} from '../../services/conversationalAI';
import { buildAgentSystemPrompt, buildAgentFirstMessage } from '../../data/financialContext';

// =====================================================
// AI Banking Assistant - Full-Featured Chat Screen
// =====================================================
// Features:
// - Onboarding (welcome + limitations screens)
// - Dark theme chat interface with rich response cards
// - Voice mode with ElevenLabs integration (placeholder)
// - Chat settings (General / Customize / Privacy tabs)
// - Model selector dropdown (GPT, LLama, Perplexity, Gemini)
// - Media upload / document scanning
// - Special screens: out of tokens, upgrade to pro, clear data
// - NOTE: Upgrade to Pro is MOCK -- needs full implementation later
// =====================================================

type ScreenStep =
  | 'onboarding_welcome'
  | 'onboarding_limitations'
  | 'chat'
  | 'voice_mode'
  | 'settings'
  | 'out_of_tokens'
  | 'upgrade_pro'
  | 'clear_data';

const AI_MODELS: AIModelOption[] = ['GPT', 'LLama', 'Perplexity', 'Gemini'];

const VOICE_OPTIONS = [
  'Caucasian Male (Peter)',
  'Caucasian Female (Sarah)',
  'African American Male (James)',
  'African American Female (Maya)',
  'Hispanic Male (Carlos)',
  'Hispanic Female (Maria)',
];

export function AIChatScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  const [step, setStep] = useState<ScreenStep>('onboarding_welcome');
  const [messages, setMessages] = useState<AIChatMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({ ...DEFAULT_CHAT_SETTINGS });
  const [settingsTab, setSettingsTab] = useState<'general' | 'customize' | 'privacy'>('general');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState(getElevenLabsApiKey());
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [elevenLabsActive, setElevenLabsActive] = useState(isElevenLabsReady());
  // Conversational AI state
  const [convaiStatus, setConvaiStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [convaiMode, setConvaiMode] = useState<'listening' | 'speaking' | 'idle'>('idle');
  const [convaiUserText, setConvaiUserText] = useState('');
  const [convaiAgentText, setConvaiAgentText] = useState('');
  const [convaiMessages, setConvaiMessages] = useState<Array<{ source: string; text: string }>>([]); 
  const [voiceWidgets, setVoiceWidgets] = useState<RichCard[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const stopSpeakingRef = useRef<(() => void) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const chatsLeftRef = useRef(settings.chatsLeft);

  useEffect(() => {
    chatsLeftRef.current = settings.chatsLeft;
  }, [settings.chatsLeft]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length, isTyping]);

  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (voiceRecording) {
      setVoiceTimer(0);
      voiceTimerRef.current = setInterval(() => setVoiceTimer((t) => t + 1), 1000);
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(waveAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
        ])
      );
      loopAnim.start();
    } else {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (loopAnim) loopAnim.stop();
    };
  }, [voiceRecording, waveAnim]);

  // Handlers
  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    // Guard: use ref for synchronous check to prevent rapid-send bypass
    if (chatsLeftRef.current <= 0) {
      setStep('out_of_tokens');
      return;
    }
    // Decrement ref immediately (synchronous) to block rapid sends
    chatsLeftRef.current -= 1;
    setSettings((s) => ({ ...s, chatsLeft: Math.max(0, s.chatsLeft - 1) }));
    const userMsg: AIChatMsg = {
      id: `u${Date.now()}`,
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      const aiMsg = generateAIResponse(userMsg.text);
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      if (chatsLeftRef.current <= 0) {
        setTimeout(() => setStep('out_of_tokens'), 500);
      }
    }, 1200);
  }, [inputText]);

  // Start ElevenLabs Conversational AI voice session
  const handleStartVoice = useCallback(async () => {
    setVoiceError(null);
    setVoiceTranscript('');
    setConvaiStatus('connecting');
    setConvaiMode('idle');
    setConvaiUserText('');
    setConvaiAgentText('');
    setConvaiMessages([]);
    setVoiceWidgets([]);
    setVoiceRecording(true);

    try {
      const agentId = getAgentId();
      // Build dynamic financial context for the agent
      const systemPrompt = buildAgentSystemPrompt();
      const firstMessage = buildAgentFirstMessage();
      await startConversation(agentId, {
        onStatusChange: (status) => {
          setConvaiStatus(status as 'connecting' | 'connected' | 'disconnected');
        },
        onModeChange: (mode) => {
          setConvaiMode(mode.mode as 'listening' | 'speaking' | 'idle');
        },
        onMessage: (message) => {
          if (message.source === 'user') {
            setConvaiUserText(message.message);
            setConvaiMessages((prev) => [...prev, { source: 'user', text: message.message }]);
          } else if (message.source === 'ai') {
            setConvaiAgentText(message.message);
            setConvaiMessages((prev) => [...prev, { source: 'ai', text: message.message }]);
            // Detect topic keywords and show matching widget
            const pattern = matchPattern(message.message);
            if (pattern?.richCardKey) {
              const card = RICH_CARDS[pattern.richCardKey];
              if (card) {
                setVoiceWidgets((prev) => {
                  // Avoid duplicate cards of the same type
                  if (prev.some((w) => w.type === card.type)) return prev;
                  return [...prev, card];
                });
              }
            }
          }
        },
        onError: (error) => {
          setVoiceError(`Voice AI error: ${error}`);
        },
        onConnect: () => {
          setConvaiStatus('connected');
        },
        onDisconnect: () => {
          setConvaiStatus('disconnected');
          setConvaiMode('idle');
          setVoiceRecording(false);
        },
      }, {
        systemPrompt,
        firstMessage,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setVoiceError(msg);
      setVoiceRecording(false);
      setConvaiStatus('idle');
    }
  }, []);

  // End the Conversational AI session and return to chat
  const handleVoiceSend = useCallback(async () => {
    await endConversation();
    setVoiceRecording(false);
    setConvaiStatus('idle');
    setConvaiMode('idle');
    setStep('chat');

    // Add any conversation messages to the chat history
    const newMsgs: AIChatMsg[] = [];
    for (const msg of convaiMessages) {
      newMsgs.push({
        id: `conv${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: msg.source === 'user' ? 'user' : 'assistant',
        text: msg.text,
        timestamp: new Date().toISOString(),
      });
    }
    if (newMsgs.length > 0) {
      setMessages((prev) => [...prev, ...newMsgs]);
    }
  }, [convaiMessages]);

  // Speak an AI message using ElevenLabs TTS
  const handleSpeakMessage = useCallback(async (msgId: string, text: string) => {
    if (!isElevenLabsReady()) return;
    // Stop any current playback
    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
    }
    setSpeakingMsgId(msgId);
    setIsSpeaking(true);
    const cleanup = await speakText(text, {
      onStart: () => {
        setSpeakingMsgId(msgId);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setSpeakingMsgId(null);
        setIsSpeaking(false);
        stopSpeakingRef.current = null;
      },
      onError: () => {
        setSpeakingMsgId(null);
        setIsSpeaking(false);
        stopSpeakingRef.current = null;
      },
    });
    stopSpeakingRef.current = cleanup;
  }, []);

  // Stop TTS playback
  const handleStopSpeaking = useCallback(() => {
    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
    }
    setSpeakingMsgId(null);
    setIsSpeaking(false);
  }, []);

  const handleClearData = useCallback(() => {
    setMessages([]);
    setStep('chat');
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // =====================================================
  // RICH CARD RENDERER
  // =====================================================
  const renderRichCard = (card: RichCard) => {
    const d = card.data as Record<string, unknown>;

    switch (card.type) {
      case 'account_balance':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardAccount}>{String(d.accountName || '')} {String(d.accountNumber || '')}</Text>
            <Text style={st.richCardBalance}>{String(d.flag || '')} ${Number(d.balance || 0).toFixed(2)}</Text>
            <Text style={st.richCardMeta}>{String(d.date || '')}  {String(d.aer || '')}</Text>
          </View>
        );

      case 'spending_breakdown': {
        const cats = (d.categories || []) as Array<{ name: string; percent: number; color: string }>;
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || 'Spending')}</Text>
            <Text style={st.richCardMeta}>{String(d.period || '')}</Text>
            <View style={st.spendingBarContainer}>
              {cats.map((c) => (
                <View key={c.name} style={[st.spendingBarSegment, { width: `${c.percent}%`, backgroundColor: c.color }]} />
              ))}
            </View>
            {cats.map((c) => (
              <View key={c.name} style={st.spendingRow}>
                <View style={[st.spendingDot, { backgroundColor: c.color }]} />
                <Text style={st.spendingLabel}>{c.name}</Text>
                <Text style={st.spendingPercent}>{c.percent}%</Text>
              </View>
            ))}
            <Text style={st.richCardBalance}>${Number(d.total || 0).toFixed(2)}</Text>
          </View>
        );
      }

      case 'deposit_funds': {
        const quickAmts = (d.quickAmounts || []) as number[];
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.amount || 0).toFixed(2)}</Text>
            <View style={st.quickAmountsRow}>
              {quickAmts.map((a) => (
                <TouchableOpacity key={a} style={st.quickAmountBtn}>
                  <Text style={st.quickAmountText}>${a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={st.richCardMeta}>To: {String(d.targetAccount || '')}</Text>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Confirm Deposit</Text>
            </TouchableOpacity>
          </View>
        );
      }

      case 'currency_conversion':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.conversionRow}>
              <View style={st.conversionSide}>
                <Text style={st.conversionCurrency}>{String(d.fromCurrency || '')}</Text>
                <Text style={st.conversionAmount}>{Number(d.fromAmount || 0).toFixed(2)}</Text>
              </View>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
              <View style={st.conversionSide}>
                <Text style={st.conversionCurrency}>{String(d.toCurrency || '')}</Text>
                <Text style={st.conversionAmount}>{Number(d.toAmount || 0).toFixed(2)}</Text>
              </View>
            </View>
            <Text style={st.richCardMeta}>{String(d.rate || '')}  {String(d.speed || '')}</Text>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Confirm Conversion</Text>
            </TouchableOpacity>
          </View>
        );

      case 'transfer_money':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.amount || 0).toFixed(2)}</Text>
            <View style={st.transferDetail}>
              <Text style={st.transferLabel}>From</Text>
              <Text style={st.transferValue}>{String(d.fromAccount || '')}</Text>
            </View>
            <View style={st.transferDetail}>
              <Text style={st.transferLabel}>To</Text>
              <Text style={st.transferValue}>{String(d.to || '')} - {String(d.toAccount || '')}</Text>
            </View>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Confirm Transfer</Text>
            </TouchableOpacity>
          </View>
        );

      case 'payment_request':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.amount || 0).toFixed(2)}</Text>
            <Text style={st.richCardMeta}>To: {String(d.to || '')}</Text>
            <Text style={st.richCardMeta}>{String(d.recipientBank || '')}</Text>
            <View style={st.shareRow}>
              {((d.shareOptions || []) as string[]).map((opt) => (
                <TouchableOpacity key={opt} style={st.shareBtn}>
                  <Text style={st.shareBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'account_details':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            {['accountType', 'accountNumber', 'routingNumber', 'interestRate', 'type'].map((key) => (
              d[key] ? (
                <View key={key} style={st.detailRow}>
                  <Text style={st.detailLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (ch: string) => ch.toUpperCase())}</Text>
                  <Text style={st.detailValue}>{String(d[key])}</Text>
                </View>
              ) : null
            ))}
            <Text style={st.richCardBalance}>${Number(d.amountAvailable || 0).toFixed(2)}</Text>
          </View>
        );

      case 'credit_breakdown': {
        const credits = (d.credits || []) as Array<{ name: string; balance: number }>;
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>Score: {String(d.creditScore || '')}</Text>
            {credits.map((c) => (
              <View key={c.name} style={st.creditRow}>
                <Text style={st.creditName}>{c.name}</Text>
                <Text style={st.creditAmount}>${c.balance.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        );
      }

      case 'loan_repayment':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardAccount}>{String(d.loanName || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.totalAmount || 0).toFixed(2)}</Text>
            <Text style={st.richCardMeta}>Payment {String(d.repaymentNumber || '')} of {String(d.totalRepayments || '')}</Text>
            <Text style={st.richCardMeta}>Left to pay: ${Number(d.leftToPay || 0).toFixed(2)}</Text>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        );

      case 'card_management': {
        const actions = (d.actions || []) as string[];
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardAccount}>{String(d.cardName || '')} ----{String(d.lastFour || '')}</Text>
            <Text style={[st.cardStatusBadge, d.isLocked ? st.lockedBadge : st.unlockedBadge]}>
              {d.isLocked ? 'LOCKED' : 'ACTIVE'}
            </Text>
            <View style={st.cardActionsRow}>
              {actions.map((a) => (
                <TouchableOpacity key={a} style={st.cardMgmtBtn}>
                  <Text style={st.cardMgmtText}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      case 'recent_transactions': {
        const txns = (d.transactions || []) as Array<{ type: string; to: string; amount: number; date: string }>;
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            {txns.map((t, i) => (
              <View key={i} style={st.txnRow}>
                <View style={st.txnInfo}>
                  <Text style={st.txnType}>{t.type}</Text>
                  <Text style={st.txnTo}>{t.to}</Text>
                </View>
                <Text style={[st.txnAmount, { color: t.amount >= 0 ? '#10B981' : '#EF4444' }]}>
                  {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      case 'savings_pot_creation':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardAccount}>{String(d.potName || '')} Pot</Text>
            <Text style={st.richCardBalance}>Goal: ${Number(d.goalAmount || 0).toLocaleString()}</Text>
            <Text style={st.richCardMeta}>Target: {String(d.selectedDate || '')}</Text>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Create Pot</Text>
            </TouchableOpacity>
          </View>
        );

      case 'recurring_deposit':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.amount || 0).toFixed(2)} / {String(d.frequency || '')}</Text>
            <Text style={st.richCardMeta}>Next: {String(d.nextPaymentDate || '')}</Text>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Set Up Recurring</Text>
            </TouchableOpacity>
          </View>
        );

      case 'spending_categories': {
        const categories = (d.categories || []) as Array<{ name: string; icon: string }>;
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.categoriesGrid}>
              {categories.map((c) => (
                <View key={c.name} style={st.categoryItem}>
                  <View style={st.categoryIcon}>
                    <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                  </View>
                  <Text style={st.categoryLabel}>{c.name}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      }

      case 'bank_statement':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.fileRow}>
              <View style={st.fileIcon}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
              <View style={st.fileInfo}>
                <Text style={st.fileName}>{String(d.fileName || '')}</Text>
                <Text style={st.fileDesc}>{String(d.description || '')}</Text>
                <Text style={st.fileMeta}>{String(d.size || '')} - {String(d.format || '')}</Text>
              </View>
            </View>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Download</Text>
            </TouchableOpacity>
          </View>
        );

      case 'income_spending_insights': {
        const months = (d.months || []) as string[];
        const incomeData = (d.income || []) as number[];
        const spendingData = (d.spending || []) as number[];
        const maxVal = Math.max(...incomeData, ...spendingData, 1);
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.insightChart}>
              {months.map((m, i) => (
                <View key={m} style={st.insightBar}>
                  <View style={st.barGroup}>
                    <View style={[st.bar, { height: (incomeData[i] / maxVal) * 50, backgroundColor: colors.primary }]} />
                    <View style={[st.bar, { height: (spendingData[i] / maxVal) * 50, backgroundColor: '#F59E0B' }]} />
                  </View>
                  <Text style={st.barLabel}>{m}</Text>
                </View>
              ))}
            </View>
            <View style={st.legendRow}>
              <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: colors.primary }]} /><Text style={st.legendText}>Income</Text></View>
              <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={st.legendText}>Spending</Text></View>
            </View>
          </View>
        );
      }

      case 'savings_projection':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <Text style={st.richCardBalance}>${Number(d.projectedAmount || 0).toLocaleString()}</Text>
            <Text style={st.richCardMeta}>Current: ${Number(d.currentBalance || 0).toLocaleString()}</Text>
            <Text style={st.richCardMeta}>APR: {String(d.apr || '')}% | Avg Return: {String(d.avgReturn || '')}%</Text>
            <Text style={st.richCardMeta}>Growth Period: {String(d.yearsToGrow || '')} years</Text>
          </View>
        );

      case 'activity_summary': {
        const days = (d.days || []) as string[];
        const withdrawals = (d.withdrawals || []) as number[];
        const deposits = (d.deposits || []) as number[];
        const maxVal = Math.max(...withdrawals, ...deposits, 1);
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.insightChart}>
              {days.map((day, i) => (
                <View key={day} style={st.insightBar}>
                  <View style={st.barGroup}>
                    <View style={[st.bar, { height: (deposits[i] / maxVal) * 50, backgroundColor: '#10B981' }]} />
                    <View style={[st.bar, { height: (withdrawals[i] / maxVal) * 50, backgroundColor: '#EF4444' }]} />
                  </View>
                  <Text style={st.barLabel}>{day}</Text>
                </View>
              ))}
            </View>
            <View style={st.legendRow}>
              <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: '#10B981' }]} /><Text style={st.legendText}>Deposits</Text></View>
              <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={st.legendText}>Withdrawals</Text></View>
            </View>
          </View>
        );
      }

      case 'financial_resources': {
        const items = (d.items || []) as Array<{ name: string; type: string; detail: string; icon: string }>;
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            {items.map((item) => (
              <TouchableOpacity key={item.name} style={st.resourceRow}>
                <View style={st.resourceIcon}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                </View>
                <View style={st.resourceInfo}>
                  <Text style={st.resourceName}>{item.name}</Text>
                  <Text style={st.resourceDetail}>{item.type} - {item.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      case 'credit_score':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.scoreCircle}>
              <Text style={st.scoreValue}>{String(d.score || '')}</Text>
              <Text style={st.scoreMax}>/ {String(d.maxScore || '850')}</Text>
            </View>
            <Text style={[st.scoreBadge, { color: '#10B981' }]}>{String(d.rating || '')}</Text>
            <Text style={st.richCardMeta}>Next update: {String(d.nextUpdate || '')}</Text>
          </View>
        );

      case 'nearest_atm':
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{String(d.title || '')}</Text>
            <View style={st.atmRow}>
              <View style={st.atmIcon}>
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={st.atmName}>{String(d.bankName || '')}</Text>
                <Text style={st.atmAddress}>{String(d.address || '')}</Text>
                <Text style={st.atmDistance}>{String(d.distance || '')}</Text>
              </View>
            </View>
            <TouchableOpacity style={[st.cardActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={st.cardActionText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={[st.richCard, { backgroundColor: '#1A2B3C' }]}>
            <Text style={st.richCardTitle}>{card.type}</Text>
            <Text style={st.richCardMeta}>Card data available</Text>
          </View>
        );
    }
  };

  // =====================================================
  // ONBOARDING: Welcome
  // =====================================================
  const renderOnboardingWelcome = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
        <View style={st.onboardCenter}>
          <View style={[st.aiLogoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={40} color="#FFFFFF" />
          </View>
          <Text style={st.onboardTitle}>{'AI Banking\nAssistant'}</Text>
          <Text style={st.onboardSubtitle}>
            Your personal AI-powered financial assistant. Get insights, manage accounts,
            and optimize your finances with intelligent conversation.
          </Text>
          <View style={st.onboardFeatures}>
            {[
              { icon: 'chatbubbles-outline' as const, label: 'Smart Conversations' },
              { icon: 'mic-outline' as const, label: 'Voice Enabled' },
              { icon: 'analytics-outline' as const, label: 'Financial Insights' },
              { icon: 'shield-checkmark-outline' as const, label: 'Secure & Private' },
            ].map((f) => (
              <View key={f.label} style={st.featureRow}>
                <View style={st.featureIcon}>
                  <Ionicons name={f.icon} size={20} color={colors.primary} />
                </View>
                <Text style={st.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('onboarding_limitations')}>
          <Text style={st.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // ONBOARDING: Limitations
  // =====================================================
  const renderOnboardingLimitations = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
        <TouchableOpacity style={st.backBtn} onPress={() => setStep('onboarding_welcome')}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={st.onboardCenter}>
          <View style={[st.warningCircle, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="alert-circle-outline" size={40} color="#F59E0B" />
          </View>
          <Text style={st.onboardTitle}>Before You Start</Text>
          <Text style={st.onboardSubtitle}>Please keep the following in mind while using the AI assistant:</Text>
          <View style={st.limitationsList}>
            {[
              'AI responses are generated and may not always be accurate',
              'Do not share sensitive passwords or PINs in chat',
              'Financial advice is for informational purposes only',
              'Always verify important transactions manually',
              'Your conversations are encrypted and private',
            ].map((item, i) => (
              <View key={i} style={st.limitItem}>
                <View style={st.limitBullet}>
                  <Text style={st.limitBulletText}>{i + 1}</Text>
                </View>
                <Text style={st.limitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('chat')}>
          <Text style={st.primaryBtnText}>I Understand, Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // CHAT INTERFACE
  // =====================================================
  const renderChat = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top']}>
        <View style={st.chatHeader}>
          <View style={st.chatHeaderLeft}>
            <View style={[st.chatAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={st.chatHeaderTitle}>AI Assistant</Text>
              <Text style={st.chatHeaderSub}>{isTyping ? 'Typing...' : `${settings.chatsLeft} chats left`}</Text>
            </View>
          </View>
          <View style={st.chatHeaderRight}>
            <TouchableOpacity style={st.headerIconBtn} onPress={() => setStep('settings')}>
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={st.headerIconBtn} onPress={() => setStep('clear_data')}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollViewRef} style={st.chatMessages} contentContainerStyle={st.chatMessagesContent} showsVerticalScrollIndicator={false}>
          {messages.length === 0 && (
            <View style={st.welcomeContainer}>
              <View style={[st.welcomeAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={32} color="#FFFFFF" />
              </View>
              <Text style={st.welcomeTitle}>How can I help you today?</Text>
              <Text style={st.welcomeSubtitle}>Ask me anything about your finances, accounts, or banking needs.</Text>
              <View style={st.suggestionsGrid}>
                {['Show my balance', 'Spending breakdown', 'Transfer money', 'Credit score', 'Find nearest ATM', 'Recent transactions'].map((s) => (
                  <TouchableOpacity key={s} style={st.suggestionChip} onPress={() => setInputText(s)}>
                    <Text style={st.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {messages.map((msg) => (
            <View key={msg.id}>
              {msg.role === 'user' ? (
                <View style={st.userBubble}>
                  <Text style={st.userBubbleText}>{msg.text}</Text>
                </View>
              ) : (
                <View style={st.aiBubbleContainer}>
                  <View style={[st.aiAvatarSmall, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  </View>
                  <View style={st.aiBubble}>
                    <Text style={st.aiBubbleText}>{msg.text}</Text>
                    {msg.richCard && renderRichCard(msg.richCard)}
                    {isElevenLabsReady() && (
                      <TouchableOpacity
                        style={st.speakBtn}
                        onPress={() => speakingMsgId === msg.id ? handleStopSpeaking() : handleSpeakMessage(msg.id, msg.text)}
                      >
                        <Ionicons
                          name={speakingMsgId === msg.id ? 'stop-circle-outline' : 'volume-high-outline'}
                          size={16}
                          color={speakingMsgId === msg.id ? '#EF4444' : '#94A3B8'}
                        />
                        <Text style={[st.speakBtnText, speakingMsgId === msg.id && { color: '#EF4444' }]}>
                          {speakingMsgId === msg.id ? 'Stop' : 'Listen'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
          {isTyping && (
            <View style={st.aiBubbleContainer}>
              <View style={[st.aiAvatarSmall, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              </View>
              <View style={st.aiBubble}>
                <Text style={st.typingDots}>. . .</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <View style={st.inputBar}>
            <TouchableOpacity style={st.attachBtn} onPress={() => setShowMediaOptions(!showMediaOptions)}>
              <Ionicons name="add-circle-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
            <View style={st.inputField}>
              <TextInput style={st.textInput} placeholder="Type a message..." placeholderTextColor="#64748B" value={inputText} onChangeText={setInputText} onSubmitEditing={handleSend} returnKeyType="send" multiline maxLength={500} />
            </View>
            {inputText.trim() ? (
              <TouchableOpacity style={[st.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={st.micBtn} onPress={() => { setStep('voice_mode'); handleStartVoice(); }}>
                <Ionicons name="mic" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {showMediaOptions && (
            <View style={st.mediaBar}>
              {[
                { icon: 'image-outline' as const, label: 'Photo' },
                { icon: 'camera-outline' as const, label: 'Camera' },
                { icon: 'document-outline' as const, label: 'File' },
                { icon: 'scan-outline' as const, label: 'Scan' },
              ].map((m) => (
                <TouchableOpacity key={m.label} style={st.mediaOption} onPress={() => setShowMediaOptions(false)}>
                  <View style={st.mediaOptionIcon}><Ionicons name={m.icon} size={22} color={colors.primary} /></View>
                  <Text style={st.mediaOptionLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // VOICE MODE
  // =====================================================
  const renderVoiceMode = () => {
    const waveScale = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
    const statusLabel =
      convaiStatus === 'connecting' ? 'Connecting to AI Agent...' :
      convaiStatus === 'connected' && convaiMode === 'speaking' ? 'Agent is speaking...' :
      convaiStatus === 'connected' && convaiMode === 'listening' ? 'Listening to you...' :
      convaiStatus === 'connected' ? 'Connected — speak to start' :
      convaiStatus === 'disconnected' ? 'Disconnected' :
      'Tap to start conversation';

    const micColor =
      convaiMode === 'speaking' ? '#22C55E' :
      convaiMode === 'listening' ? colors.primary :
      colors.primary;

    const hasWidgets = voiceWidgets.length > 0;

    return (
      <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
        <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
          {/* ---- Header row: close + title + stop/start ---- */}
          <View style={st.voiceHeaderRow}>
            <TouchableOpacity
              style={st.voiceHeaderCloseBtn}
              onPress={async () => { await endConversation(); setVoiceRecording(false); setConvaiStatus('idle'); setConvaiMode('idle'); setStep('chat'); }}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={st.voiceHeaderCenter}>
              <Text style={st.voiceHeaderRowTitle}>Voice Mode</Text>
              <Text style={st.voiceHeaderRowSub}>{statusLabel}</Text>
            </View>
            {voiceRecording || convaiStatus === 'connected' || convaiStatus === 'connecting' ? (
              <TouchableOpacity style={[st.voiceHeaderActionBtn, { backgroundColor: '#EF4444' }]} onPress={handleVoiceSend}>
                <Ionicons name="stop" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[st.voiceHeaderActionBtn, { backgroundColor: colors.primary }]} onPress={handleStartVoice}>
                <Ionicons name="mic" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* ---- Compact voice visualizer ---- */}
          <View style={st.voiceVisualizerCompact}>
            <Animated.View style={[st.voiceWaveOuterCompact, { transform: [{ scale: waveScale }] }]}>
              <View style={[st.voiceWaveInnerCompact, { backgroundColor: micColor }]}>
                <Ionicons name={convaiMode === 'speaking' ? 'volume-high' : 'mic'} size={28} color="#FFFFFF" />
              </View>
            </Animated.View>
            <View style={st.voiceVisualizerInfo}>
              <Text style={st.voiceTimerCompact}>{formatTime(voiceTimer)}</Text>
              {/* Latest transcript snippet */}
              {convaiUserText ? (
                <Text style={st.voiceSnippetUser} numberOfLines={1}>You: "{convaiUserText}"</Text>
              ) : null}
              {convaiAgentText ? (
                <Text style={st.voiceSnippetAgent} numberOfLines={2}>AI: "{convaiAgentText}"</Text>
              ) : null}
              {voiceError ? (
                <Text style={st.voiceErrorCompact} numberOfLines={1}>{voiceError}</Text>
              ) : null}
            </View>
          </View>

          {/* ---- Divider ---- */}
          <View style={st.voiceDivider} />

          {/* ---- Scrollable widget panel ---- */}
          <ScrollView
            style={st.flex1}
            contentContainerStyle={st.voiceWidgetContent}
          >
            {hasWidgets ? (
              <>
                <Text style={st.voiceWidgetSectionTitle}>Related Information</Text>
                {voiceWidgets.map((card, idx) => (
                  <View key={`${card.type}-${idx}`} style={st.voiceWidgetCard}>
                    {renderRichCard(card)}
                  </View>
                ))}
              </>
            ) : (
              <View style={st.voiceWidgetEmpty}>
                <Ionicons name="sparkles" size={32} color="#334155" />
                <Text style={st.voiceWidgetEmptyTitle}>Ask a question to see visuals</Text>
                <Text style={st.voiceWidgetEmptyDesc}>
                  When you ask about balances, spending, transactions, or other topics,
                  relevant widgets will appear here in real time.
                </Text>
              </View>
            )}

            {/* Full conversation transcript at bottom */}
            {convaiMessages.length > 0 ? (
              <View style={st.voiceTranscriptSection}>
                <Text style={st.voiceTranscriptSectionTitle}>Conversation</Text>
                {convaiMessages.map((msg, i) => (
                  <View key={i} style={msg.source === 'user' ? st.voiceTranscriptUserRow : st.voiceTranscriptAgentRow}>
                    <Text style={msg.source === 'user' ? st.voiceTranscriptUserLabel : st.voiceTranscriptAgentLabel}>
                      {msg.source === 'user' ? 'You' : 'AI'}
                    </Text>
                    <Text style={msg.source === 'user' ? st.voiceTranscriptUserText : st.voiceTranscriptAgentText}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  // =====================================================
  // SETTINGS
  // =====================================================
  const renderSettings = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top']}>
        <View style={st.settingsHeader}>
          <TouchableOpacity onPress={() => setStep('chat')}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={st.settingsTitle}>Chat Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={st.settingsTabs}>
          {(['general', 'customize', 'privacy'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[st.settingsTab, settingsTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setSettingsTab(tab)}>
              <Text style={[st.settingsTabText, settingsTab === tab && { color: colors.primary }]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView style={st.settingsContent} showsVerticalScrollIndicator={false}>
          {settingsTab === 'general' && (
            <>
              <Text style={st.settingsLabel}>AI Model</Text>
              <TouchableOpacity style={st.settingsDropdown} onPress={() => setShowModelPicker(true)}>
                <Text style={st.settingsDropdownText}>{settings.aiModel}</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
              <Text style={st.settingsLabel}>Custom Instructions</Text>
              <TextInput style={st.settingsTextArea} placeholder="Tell the AI how to respond..." placeholderTextColor="#64748B" value={settings.customInstructions} onChangeText={(t) => setSettings((s) => ({ ...s, customInstructions: t }))} multiline numberOfLines={3} />
              <Text style={st.settingsLabel}>Suggest Insights</Text>
              {Object.entries(settings.suggestInsights).map(([key, val]) => (
                <View key={key} style={st.switchRow}>
                  <Text style={st.switchLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (ch: string) => ch.toUpperCase())}</Text>
                  <Switch value={val} onValueChange={(v) => setSettings((s) => ({ ...s, suggestInsights: { ...s.suggestInsights, [key]: v } }))} trackColor={{ false: '#334155', true: colors.primary + '60' }} thumbColor={val ? colors.primary : '#94A3B8'} />
                </View>
              ))}
            </>
          )}
          {settingsTab === 'customize' && (
            <>
              <Text style={st.settingsLabel}>Nickname</Text>
              <TextInput style={st.settingsInput} value={settings.nickname} onChangeText={(t) => setSettings((s) => ({ ...s, nickname: t }))} placeholderTextColor="#64748B" />
              <Text style={st.settingsLabel}>Voice Selection</Text>
              <TouchableOpacity style={st.settingsDropdown} onPress={() => setShowVoicePicker(true)}>
                <Text style={st.settingsDropdownText}>{settings.voiceSelection}</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
              <Text style={st.settingsLabel}>Language</Text>
              <View style={st.settingsDropdown}>
                <Text style={st.settingsDropdownText}>{settings.languagePreference}</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </View>
              <Text style={st.settingsLabel}>ElevenLabs API Key</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[st.settingsInput, { flex: 1 }]}
                  value={elevenLabsKey}
                  onChangeText={setElevenLabsKey}
                  placeholder="Enter API key for voice..."
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[st.cardActionBtn, { backgroundColor: colors.primary, paddingHorizontal: 16, marginTop: 0 }]}
                  onPress={() => {
                    if (elevenLabsKey.trim()) {
                      setupElevenLabs(elevenLabsKey.trim());
                      setElevenLabsActive(true);
                    }
                  }}
                >
                  <Text style={st.cardActionText}>Save</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                {elevenLabsActive ? 'Voice AI active (Listen buttons visible on AI responses)' : 'Enter your key to enable voice features'}
              </Text>
              <Text style={st.settingsLabel}>Response Type</Text>
              <View style={st.responseTypeRow}>
                {(['Neutral', 'Motivating'] as const).map((rt) => (
                  <TouchableOpacity key={rt} style={[st.responseTypeBtn, settings.responseType === rt && { backgroundColor: colors.primary }]} onPress={() => setSettings((s) => ({ ...s, responseType: rt }))}>
                    <Text style={[st.responseTypeText, settings.responseType === rt && { color: '#FFFFFF' }]}>{rt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {settingsTab === 'privacy' && (
            <>
              <View style={st.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.switchLabel}>Data Sharing</Text>
                  <Text style={st.switchDesc}>Allow AI to access your financial data for better insights</Text>
                </View>
                <Switch value={settings.dataSharing} onValueChange={(v) => setSettings((s) => ({ ...s, dataSharing: v }))} trackColor={{ false: '#334155', true: colors.primary + '60' }} thumbColor={settings.dataSharing ? colors.primary : '#94A3B8'} />
              </View>
              <View style={st.chatsLeftCard}>
                <Text style={st.chatsLeftTitle}>Chats Remaining</Text>
                <Text style={st.chatsLeftValue}>{settings.chatsLeft}</Text>
                <Text style={st.chatsLeftDesc}>Free tier: 251 chats/month</Text>
                <TouchableOpacity style={[st.upgradeBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('upgrade_pro')}>
                  <Text style={st.upgradeBtnText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={st.clearDataBtn} onPress={() => setStep('clear_data')}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={st.clearDataText}>Clear All Chat Data</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        <Modal visible={showModelPicker} transparent animationType="slide" onRequestClose={() => setShowModelPicker(false)}>
          <Pressable style={st.modalOverlay} onPress={() => setShowModelPicker(false)}>
            <View style={st.pickerSheet}>
              <Text style={st.pickerTitle}>Select AI Model</Text>
              {AI_MODELS.map((m) => (
                <TouchableOpacity key={m} style={[st.pickerOption, settings.aiModel === m && { backgroundColor: colors.primary + '20' }]} onPress={() => { setSettings((s) => ({ ...s, aiModel: m })); setShowModelPicker(false); }}>
                  <Text style={[st.pickerOptionText, settings.aiModel === m && { color: colors.primary }]}>{m}</Text>
                  {settings.aiModel === m && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
        <Modal visible={showVoicePicker} transparent animationType="slide" onRequestClose={() => setShowVoicePicker(false)}>
          <Pressable style={st.modalOverlay} onPress={() => setShowVoicePicker(false)}>
            <View style={st.pickerSheet}>
              <Text style={st.pickerTitle}>Select Voice</Text>
              {VOICE_OPTIONS.map((v) => (
                <TouchableOpacity key={v} style={[st.pickerOption, settings.voiceSelection === v && { backgroundColor: colors.primary + '20' }]} onPress={() => { setSettings((s) => ({ ...s, voiceSelection: v })); setShowVoicePicker(false); }}>
                  <Text style={[st.pickerOptionText, settings.voiceSelection === v && { color: colors.primary }]}>{v}</Text>
                  {settings.voiceSelection === v && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // OUT OF TOKENS
  // =====================================================
  const renderOutOfTokens = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
        <View style={st.onboardCenter}>
          <View style={[st.warningCircle, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
          </View>
          <Text style={st.onboardTitle}>Out of Chats</Text>
          <Text style={st.onboardSubtitle}>You have used all your free chats this month. Upgrade to Pro for unlimited conversations.</Text>
        </View>
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('upgrade_pro')}>
          <Text style={st.primaryBtnText}>Upgrade to Pro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.secondaryBtn} onPress={() => setStep('chat')}>
          <Text style={st.secondaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // UPGRADE TO PRO (MOCK -- TODO: Full implementation later in build cycle)
  // =====================================================
  const renderUpgradePro = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
        <TouchableOpacity style={st.backBtn} onPress={() => setStep('chat')}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={st.onboardCenter}>
          <View style={[st.aiLogoCircle, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="star" size={40} color="#FFFFFF" />
          </View>
          <Text style={st.onboardTitle}>Upgrade to Pro</Text>
          <Text style={st.onboardSubtitle}>Unlock unlimited AI conversations, premium voice options, and advanced financial insights.</Text>
          <View style={st.proFeatures}>
            {['Unlimited chat messages', 'Premium AI models', 'Advanced voice synthesis', 'Priority support', 'Custom AI personality', 'Detailed financial reports'].map((f) => (
              <View key={f} style={st.proFeatureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={st.proFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={st.pricingCard}>
            <Text style={st.pricingTitle}>Pro Plan</Text>
            <Text style={st.pricingAmount}>$9.99<Text style={st.pricingPeriod}>/month</Text></Text>
          </View>
        </View>
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: '#F59E0B' }]} onPress={() => setStep('chat')}>
          <Text style={[st.primaryBtnText, { color: '#0C1B2A' }]}>Subscribe Now (Mock)</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // CLEAR DATA CONFIRMATION
  // =====================================================
  const renderClearData = () => (
    <View style={[st.fullScreen, { backgroundColor: '#0C1B2A' }]}>
      <SafeAreaView style={st.flex1} edges={['top', 'bottom']}>
        <View style={st.onboardCenter}>
          <View style={[st.warningCircle, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="trash" size={40} color="#EF4444" />
          </View>
          <Text style={st.onboardTitle}>Clear Chat Data?</Text>
          <Text style={st.onboardSubtitle}>This will permanently delete all your chat history and reset your AI assistant. This action cannot be undone.</Text>
        </View>
        <TouchableOpacity style={[st.primaryBtn, { backgroundColor: '#EF4444' }]} onPress={handleClearData}>
          <Text style={st.primaryBtnText}>Clear All Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.secondaryBtn} onPress={() => setStep('chat')}>
          <Text style={st.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );

  // =====================================================
  // RENDER MAIN
  // =====================================================
  switch (step) {
    case 'onboarding_welcome': return renderOnboardingWelcome();
    case 'onboarding_limitations': return renderOnboardingLimitations();
    case 'chat': return renderChat();
    case 'voice_mode': return renderVoiceMode();
    case 'settings': return renderSettings();
    case 'out_of_tokens': return renderOutOfTokens();
    case 'upgrade_pro': return renderUpgradePro();
    case 'clear_data': return renderClearData();
    default: return renderChat();
  }
}

// =====================================================
// STYLES
// =====================================================
const st = StyleSheet.create({
  fullScreen: { flex: 1 },
  flex1: { flex: 1 },
  onboardCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  aiLogoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  warningCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  onboardTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  onboardSubtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  onboardFeatures: { width: '100%', gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 15, color: '#E2E8F0', fontWeight: '500' },
  primaryBtn: { marginHorizontal: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: { marginHorizontal: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  limitationsList: { width: '100%', gap: 16 },
  limitItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  limitBullet: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  limitBulletText: { color: '#0EA5E9', fontSize: 13, fontWeight: '700' },
  limitText: { flex: 1, fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  chatHeaderSub: { fontSize: 12, color: '#64748B' },
  chatHeaderRight: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  chatMessages: { flex: 1 },
  chatMessagesContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  welcomeContainer: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  welcomeAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#334155' },
  suggestionText: { fontSize: 13, color: '#E2E8F0' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0369A1', borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%', marginBottom: 12 },
  userBubbleText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  aiBubbleContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  aiAvatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  aiBubble: { backgroundColor: '#1E3A5F', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%' },
  aiBubbleText: { fontSize: 14, color: '#E2E8F0', lineHeight: 20 },
  typingDots: { fontSize: 16, color: '#94A3B8', letterSpacing: 3 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1E3A5F', gap: 8 },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputField: { flex: 1, backgroundColor: '#1E3A5F', borderRadius: 20, minHeight: 40, maxHeight: 100, justifyContent: 'center' },
  textInput: { fontSize: 14, color: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  mediaBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1E3A5F' },
  mediaOption: { alignItems: 'center', gap: 4 },
  mediaOptionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  mediaOptionLabel: { fontSize: 11, color: '#94A3B8' },
  richCard: { borderRadius: 12, padding: 14, marginTop: 10 },
  richCardTitle: { fontSize: 14, fontWeight: '700', color: '#E2E8F0', marginBottom: 6 },
  richCardAccount: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  richCardBalance: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginVertical: 6 },
  richCardMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardActionBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  cardActionText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  spendingBarContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 10 },
  spendingBarSegment: { height: '100%' },
  spendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  spendingDot: { width: 8, height: 8, borderRadius: 4 },
  spendingLabel: { flex: 1, fontSize: 12, color: '#CBD5E1' },
  spendingPercent: { fontSize: 12, color: '#94A3B8' },
  quickAmountsRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  quickAmountBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#334155' },
  quickAmountText: { fontSize: 13, color: '#E2E8F0' },
  conversionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  conversionSide: { alignItems: 'center', gap: 4 },
  conversionCurrency: { fontSize: 14, fontWeight: '700', color: '#E2E8F0' },
  conversionAmount: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  transferDetail: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  transferLabel: { fontSize: 12, color: '#64748B' },
  transferValue: { fontSize: 13, color: '#CBD5E1', flex: 1, textAlign: 'right' },
  shareRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  shareBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#334155' },
  shareBtnText: { fontSize: 12, color: '#E2E8F0' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: '#64748B' },
  detailValue: { fontSize: 13, color: '#E2E8F0' },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#334155' },
  creditName: { fontSize: 13, color: '#CBD5E1' },
  creditAmount: { fontSize: 13, color: '#EF4444' },
  cardStatusBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginVertical: 6, overflow: 'hidden' },
  lockedBadge: { backgroundColor: '#EF444420', color: '#EF4444' },
  unlockedBadge: { backgroundColor: '#10B98120', color: '#10B981' },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cardMgmtBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#334155' },
  cardMgmtText: { fontSize: 12, color: '#E2E8F0' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  txnInfo: { flex: 1 },
  txnType: { fontSize: 13, fontWeight: '600', color: '#E2E8F0' },
  txnTo: { fontSize: 11, color: '#64748B' },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  categoryItem: { alignItems: 'center', width: 60, gap: 4 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 11, color: '#CBD5E1' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  fileIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#E2E8F0' },
  fileDesc: { fontSize: 12, color: '#94A3B8' },
  fileMeta: { fontSize: 11, color: '#64748B' },
  insightChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 70, marginVertical: 10 },
  insightBar: { alignItems: 'center', gap: 4 },
  barGroup: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 8, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#64748B' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#94A3B8' },
  scoreCircle: { alignItems: 'center', marginVertical: 10 },
  scoreValue: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
  scoreMax: { fontSize: 16, color: '#64748B' },
  scoreBadge: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  atmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  atmIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  atmName: { fontSize: 15, fontWeight: '600', color: '#E2E8F0' },
  atmAddress: { fontSize: 13, color: '#94A3B8' },
  atmDistance: { fontSize: 12, color: '#64748B' },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  resourceIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: 14, fontWeight: '600', color: '#E2E8F0' },
  resourceDetail: { fontSize: 12, color: '#64748B' },
  // --- Legacy voice styles (kept for compatibility) ---
  voiceHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  voiceHeaderTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 10 },
  voiceHeaderSub: { fontSize: 13, color: '#64748B' },
  voiceCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  voiceWaveOuter: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#0369A120', alignItems: 'center', justifyContent: 'center' },
  voiceWaveInner: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  voiceTimerText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginTop: 24 },
  voiceStatusText: { fontSize: 14, color: '#94A3B8', marginTop: 8 },
  voiceTranscriptText: { fontSize: 16, color: '#E2E8F0', marginTop: 16, paddingHorizontal: 32, textAlign: 'center', fontStyle: 'italic' },
  voiceErrorText: { fontSize: 13, color: '#EF4444', marginTop: 12, paddingHorizontal: 32, textAlign: 'center' },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 4 },
  speakBtnText: { fontSize: 12, color: '#94A3B8' },
  voiceActions: { alignItems: 'center', paddingBottom: 40 },
  voiceStopBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  voiceStartBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },

  // --- New compact voice + widget styles ---
  voiceHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  voiceHeaderCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  voiceHeaderCenter: { flex: 1, marginHorizontal: 12 },
  voiceHeaderRowTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  voiceHeaderRowSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  voiceHeaderActionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  voiceVisualizerCompact: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  voiceWaveOuterCompact: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0369A120', alignItems: 'center', justifyContent: 'center' },
  voiceWaveInnerCompact: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  voiceVisualizerInfo: { flex: 1, gap: 2 },
  voiceTimerCompact: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  voiceSnippetUser: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  voiceSnippetAgent: { fontSize: 13, color: '#22C55E', fontStyle: 'italic', lineHeight: 18 },
  voiceErrorCompact: { fontSize: 12, color: '#EF4444' },

  voiceDivider: { height: 1, backgroundColor: '#1E3A5F', marginHorizontal: 16 },

  voiceWidgetContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  voiceWidgetSectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  voiceWidgetCard: { marginBottom: 12 },

  voiceWidgetEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  voiceWidgetEmptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 12 },
  voiceWidgetEmptyDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19, marginTop: 6 },

  voiceTranscriptSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1E3A5F' },
  voiceTranscriptSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  voiceTranscriptUserRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  voiceTranscriptAgentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  voiceTranscriptUserLabel: { fontSize: 11, fontWeight: '700', color: '#0EA5E9', width: 28, paddingTop: 2 },
  voiceTranscriptAgentLabel: { fontSize: 11, fontWeight: '700', color: '#22C55E', width: 28, paddingTop: 2 },
  voiceTranscriptUserText: { flex: 1, fontSize: 13, color: '#CBD5E1', lineHeight: 18 },
  voiceTranscriptAgentText: { flex: 1, fontSize: 13, color: '#E2E8F0', lineHeight: 18 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingsTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  settingsTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  settingsTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  settingsTabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  settingsContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  settingsLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 6, marginTop: 16 },
  settingsDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14 },
  settingsDropdownText: { fontSize: 14, color: '#E2E8F0' },
  settingsTextArea: { backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14, color: '#E2E8F0', fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  settingsInput: { backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14, color: '#E2E8F0', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  switchLabel: { fontSize: 14, color: '#E2E8F0', flex: 1 },
  switchDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  responseTypeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  responseTypeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1E3A5F' },
  responseTypeText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  chatsLeftCard: { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 20, marginTop: 20, alignItems: 'center' },
  chatsLeftTitle: { fontSize: 14, color: '#94A3B8', marginBottom: 4 },
  chatsLeftValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  chatsLeftDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  upgradeBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  clearDataBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14 },
  clearDataText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  proFeatures: { width: '100%', gap: 12, marginBottom: 20 },
  proFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proFeatureText: { fontSize: 14, color: '#E2E8F0' },
  pricingCard: { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%' },
  pricingTitle: { fontSize: 14, color: '#94A3B8', marginBottom: 4 },
  pricingAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  pricingPeriod: { fontSize: 16, fontWeight: '400', color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#1A2B3C', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 20, paddingHorizontal: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  pickerOptionText: { fontSize: 15, color: '#E2E8F0' },
});
