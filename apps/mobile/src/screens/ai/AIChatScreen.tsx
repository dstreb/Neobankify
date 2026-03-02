import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { ChatBubble } from '../../components/ai/ChatBubble';
import { TypingIndicator } from '../../components/ai/TypingIndicator';
import { QuickActions } from '../../components/ai/QuickActions';
import { ActionCard } from '../../components/ai/ActionCard';
import type { ChatMessage } from '../../types/models';

// =====================================================
// AI Chat Screen — Main conversational interface
// =====================================================

export function AIChatScreen() {
  const { theme } = useTheme();
  const { colors, borderRadius } = theme;
  const {
    messages,
    isTyping,
    voiceState,
    sendMessage,
    executeAction,
    startVoice,
    stopVoice,
    clearConversation,
  } = useAI();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isTyping]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  }, [inputText, sendMessage]);

  const handleQuickAction = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    return (
      <View>
        <ChatBubble message={item} />
        {/* Render action card if message has an actionable suggestion */}
        {item.metadata?.action && !item.metadata.action.executed && (
          <ActionCard action={item.metadata.action} onExecute={executeAction} />
        )}
      </View>
    );
  }, [executeAction]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Show quick actions only when conversation is short (initial state)
  const showQuickActions = messages.length <= 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {isTyping ? 'Thinking...' : voiceState === 'listening' ? 'Listening...' : 'Online'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surface }]}
          onPress={clearConversation}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      {showQuickActions && <QuickActions onSelect={handleQuickAction} />}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputArea, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          {/* Voice button */}
          <TouchableOpacity
            style={[
              styles.voiceBtn,
              {
                backgroundColor: voiceState === 'listening' ? colors.error : colors.surface,
                borderColor: voiceState === 'listening' ? colors.error : colors.border,
              },
            ]}
            onPressIn={startVoice}
            onPressOut={stopVoice}
            activeOpacity={0.7}
          >
            <Ionicons
              name={voiceState === 'listening' ? 'mic' : 'mic-outline'}
              size={20}
              color={voiceState === 'listening' ? colors.textInverse : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Text input */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Ask about your finances..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.surface,
                borderColor: inputText.trim() ? colors.primary : colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? colors.textInverse : colors.disabled}
            />
          </TouchableOpacity>
        </View>

        {/* Voice state indicator */}
        {voiceState === 'listening' && (
          <View style={[styles.voiceIndicator, { backgroundColor: colors.error + '10' }]}>
            <View style={[styles.voiceDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.voiceText, { color: colors.error }]}>
              Listening... Release to send
            </Text>
          </View>
        )}
        {voiceState === 'processing' && (
          <View style={[styles.voiceIndicator, { backgroundColor: colors.info + '10' }]}>
            <Ionicons name="hourglass-outline" size={14} color={colors.info} />
            <Text style={[styles.voiceText, { color: colors.info }]}>
              Processing your voice...
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  voiceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
