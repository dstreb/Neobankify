import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRelativeTime } from '../../utils/formatters';
import type { ChatMessage } from '../../types/models';

// =====================================================
// Chat Bubble Component
// =====================================================

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { theme } = useTheme();
  const { colors, borderRadius } = theme;
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderRadius: borderRadius.lg,
            maxWidth: '80%',
          },
          isUser
            ? { borderBottomRightRadius: 4 }
            : { borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        {/* Insight header */}
        {message.contentType === 'insight' && message.metadata?.insight && (
          <View style={[styles.insightHeader, { borderBottomColor: isUser ? 'rgba(255,255,255,0.15)' : colors.borderLight }]}>
            <Ionicons
              name={getCategoryIcon(message.metadata.insight.category)}
              size={14}
              color={isUser ? colors.textInverse : colors.primary}
            />
            <Text
              style={[
                styles.insightTitle,
                { color: isUser ? colors.textInverse : colors.primary, marginLeft: 6 },
              ]}
            >
              {message.metadata.insight.title}
            </Text>
          </View>
        )}

        {/* Message content */}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? colors.textInverse : colors.textPrimary },
          ]}
        >
          {formatMarkdownBold(message.content)}
        </Text>

        {/* Metric badge */}
        {message.metadata?.insight?.metric && (
          <View style={[styles.metricBadge, { backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : colors.primaryLight + '15' }]}>
            <Text style={[styles.metricLabel, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              {message.metadata.insight.metric.label}
            </Text>
            <View style={styles.metricRow}>
              <Text style={[styles.metricValue, { color: isUser ? colors.textInverse : colors.primary }]}>
                {message.metadata.insight.metric.value}
              </Text>
              {message.metadata.insight.metric.trend && (
                <Ionicons
                  name={message.metadata.insight.metric.trend === 'up' ? 'trending-up' : message.metadata.insight.metric.trend === 'down' ? 'trending-down' : 'remove'}
                  size={14}
                  color={
                    message.metadata.insight.metric.trend === 'up'
                      ? colors.success
                      : message.metadata.insight.metric.trend === 'down'
                        ? colors.error
                        : colors.textTertiary
                  }
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        )}

        {/* Impact line */}
        {message.metadata?.insight?.impact && (
          <Text style={[styles.impactText, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.success }]}>
            Potential impact: {message.metadata.insight.impact}
          </Text>
        )}

        {/* Timestamp */}
        <Text
          style={[
            styles.timestamp,
            { color: isUser ? 'rgba(255,255,255,0.5)' : colors.textTertiary },
          ]}
        >
          {formatRelativeTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'spending': return 'cart-outline';
    case 'rewards': return 'gift-outline';
    case 'savings': return 'wallet-outline';
    case 'risk': return 'shield-outline';
    default: return 'bulb-outline';
  }
}

/**
 * Simple bold rendering: replaces **text** with styled text.
 * For React Native, we return plain text (bold markers stripped).
 * A production app would use a Markdown renderer.
 */
function formatMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
});
