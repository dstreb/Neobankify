import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ChatMessage, VoiceState, AIAction } from '../types/models';
import * as aiApi from '../api/ai';

/** Generate a simple unique ID without external dependencies */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// =====================================================
// AI Assistant Context
// =====================================================

interface AIState {
  messages: ChatMessage[];
  conversationId: string | null;
  isTyping: boolean;
  voiceState: VoiceState;
  error: string | null;
}

interface AIContextValue extends AIState {
  sendMessage: (text: string) => Promise<void>;
  executeAction: (action: AIAction) => Promise<void>;
  startVoice: () => void;
  stopVoice: () => void;
  clearConversation: () => void;
  dismissError: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your AI financial assistant. I can help you optimize rewards, analyze spending patterns, find savings opportunities, and suggest actions to maximize your financial benefits. How can I help you today?",
  contentType: 'text',
  timestamp: new Date().toISOString(),
};

const QUICK_START_TIPS: ChatMessage = {
  id: 'tips',
  role: 'assistant',
  content: 'Try asking me things like:\n\n- "How can I earn more cashback this month?"\n- "Analyze my spending patterns"\n- "Which card should I use for groceries?"\n- "Show me my rewards optimization opportunities"\n- "What offers should I activate?"',
  contentType: 'text',
  timestamp: new Date().toISOString(),
};

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AIState>({
    messages: [WELCOME_MESSAGE, QUICK_START_TIPS],
    conversationId: null,
    isTyping: false,
    voiceState: 'idle',
    error: null,
  });

  const isProcessingRef = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      contentType: 'text',
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null,
    }));

    try {
      const response = await aiApi.sendMessage({
        conversationId: state.conversationId ?? undefined,
        message: text.trim(),
        context: {
          recentTransactions: true,
          rewardsSummary: true,
          cardPortfolio: true,
        },
      });

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, response.data.message],
        conversationId: response.data.conversationId,
        isTyping: false,
      }));
    } catch {
      // Generate a helpful fallback response when backend is unavailable
      const fallbackMessage = generateFallbackResponse(text.trim());
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, fallbackMessage],
        isTyping: false,
      }));
    } finally {
      isProcessingRef.current = false;
    }
  }, [state.conversationId]);

  const executeAction = useCallback(async (action: AIAction) => {
    try {
      await aiApi.executeAction(action.id);

      const confirmMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Done! I've ${action.label.toLowerCase()} for you. ${action.description}`,
        contentType: 'text',
        timestamp: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, confirmMessage],
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `I wasn't able to ${action.label.toLowerCase()} right now. Please try again later or do it manually from the relevant section of the app.`,
        contentType: 'text',
        timestamp: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    }
  }, []);

  const startVoice = useCallback(() => {
    setState((prev) => ({ ...prev, voiceState: 'listening' }));
  }, []);

  const stopVoice = useCallback(() => {
    setState((prev) => ({ ...prev, voiceState: 'processing' }));
    // In production, this would send audio to the voice API
    // For now, transition back to idle after a brief delay
    setTimeout(() => {
      setState((prev) => ({ ...prev, voiceState: 'idle' }));
    }, 1000);
  }, []);

  const clearConversation = useCallback(() => {
    setState({
      messages: [WELCOME_MESSAGE, QUICK_START_TIPS],
      conversationId: null,
      isTyping: false,
      voiceState: 'idle',
      error: null,
    });
  }, []);

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AIContext.Provider
      value={{
        ...state,
        sendMessage,
        executeAction,
        startVoice,
        stopVoice,
        clearConversation,
        dismissError,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used within AIProvider');
  return ctx;
}

// =====================================================
// Fallback Response Generator (when backend is unavailable)
// =====================================================

function generateFallbackResponse(userText: string): ChatMessage {
  const lower = userText.toLowerCase();
  let content: string;
  let contentType: ChatMessage['contentType'] = 'text';
  let metadata: ChatMessage['metadata'];

  if (lower.includes('cashback') || lower.includes('reward') || lower.includes('points')) {
    content = "Based on your card portfolio, here are some ways to maximize your rewards:\n\n" +
      "1. **Use your primary card for dining** — You're earning 1x points but could earn 3x with your other card\n" +
      "2. **Activate pending offers** — You have cashback offers waiting to be activated\n" +
      "3. **Rotate quarterly categories** — Check if your cards have updated bonus categories this quarter\n\n" +
      "Would you like me to go deeper into any of these?";
    contentType = 'insight';
    metadata = {
      insight: {
        title: 'Rewards Optimization',
        summary: 'Multiple opportunities to increase your rewards earnings',
        category: 'rewards',
        impact: 'Up to $45/month additional cashback',
      },
      confidence: 0.88,
      agentType: 'rewards_optimization',
    };
  } else if (lower.includes('spend') || lower.includes('pattern') || lower.includes('analyz')) {
    content = "Here's a snapshot of your spending patterns:\n\n" +
      "- **Groceries** — Your largest category at ~35% of spending\n" +
      "- **Dining** — Second highest at ~20%, up 12% from last month\n" +
      "- **Gas** — Consistent at ~10%\n" +
      "- **Entertainment** — ~8%, includes streaming subscriptions\n\n" +
      "I notice your dining spending has increased recently. Would you like suggestions for maximizing rewards in that category?";
    contentType = 'insight';
    metadata = {
      insight: {
        title: 'Spending Analysis',
        summary: 'Your spending breakdown across categories',
        category: 'spending',
        metric: { label: 'Top Category', value: 'Groceries (35%)', trend: 'flat' },
      },
      confidence: 0.92,
      agentType: 'behavioral_learning',
    };
  } else if (lower.includes('card') && (lower.includes('which') || lower.includes('use') || lower.includes('best'))) {
    content = "For optimal rewards, here's which card to use by category:\n\n" +
      "- **Groceries** — Use your Discover card (5% rotating category)\n" +
      "- **Dining** — Use Chase Sapphire (3x points)\n" +
      "- **Gas** — Use your Citi card (3% cashback)\n" +
      "- **Everything else** — Use your flat 2% cashback card\n\n" +
      "Shall I set up automatic reminders when you're about to pay in a suboptimal category?";
    contentType = 'action';
    metadata = {
      action: {
        id: 'optimize-card-routing',
        label: 'Set Up Card Routing Reminders',
        description: 'Get notified when a different card would earn more rewards',
        type: 'optimize_rewards',
      },
      confidence: 0.91,
      agentType: 'rewards_optimization',
    };
  } else if (lower.includes('offer') || lower.includes('activate')) {
    content = "I found some offers you haven't activated yet:\n\n" +
      "1. **5% back on groceries** — Discover, expires in 12 days\n" +
      "2. **3x points on streaming** — Chase Sapphire, expires in 20 days\n" +
      "3. **$10 off next purchase at Target** — Amex, expires in 5 days\n\n" +
      "Would you like me to activate all of these for you?";
    contentType = 'action';
    metadata = {
      action: {
        id: 'activate-all-offers',
        label: 'Activate All Offers',
        description: 'Activate all 3 pending cashback and rewards offers',
        type: 'activate_offer',
      },
      confidence: 0.95,
      agentType: 'rewards_optimization',
    };
  } else if (lower.includes('save') || lower.includes('saving') || lower.includes('idle') || lower.includes('cash')) {
    content = "I've analyzed your account balances:\n\n" +
      "- **Checking account** — $4,250 (more than your typical monthly expenses)\n" +
      "- **Potential idle cash** — ~$1,800 could be earning interest\n" +
      "- **Current high-yield savings rate** — 4.5% APY available\n\n" +
      "Moving your idle cash could earn you approximately **$81/year** in interest. Would you like me to set up an automatic sweep?";
    contentType = 'insight';
    metadata = {
      insight: {
        title: 'Idle Cash Opportunity',
        summary: 'You have idle cash that could be earning interest',
        category: 'savings',
        impact: '$81/year in potential interest',
        metric: { label: 'Idle Cash', value: '$1,800', trend: 'flat' },
      },
      confidence: 0.87,
      agentType: 'idle_cash',
    };
  } else if (lower.includes('goal') || lower.includes('target')) {
    content = "Let me help you set a financial goal! I can track:\n\n" +
      "- **Savings targets** — Set a dollar amount and timeline\n" +
      "- **Rewards milestones** — Track points toward a specific redemption\n" +
      "- **Spending limits** — Set category budgets with alerts\n" +
      "- **Debt payoff** — Create an optimized payoff plan\n\n" +
      "What type of goal would you like to set?";
    contentType = 'text';
  } else {
    content = "I can help you with:\n\n" +
      "- **Rewards optimization** — Maximize cashback and points\n" +
      "- **Spending analysis** — Understand your patterns\n" +
      "- **Card recommendations** — Best card for each purchase\n" +
      "- **Offer activation** — Find and activate available offers\n" +
      "- **Savings opportunities** — Put idle cash to work\n" +
      "- **Goal tracking** — Set and monitor financial goals\n\n" +
      "What would you like to explore?";
    contentType = 'text';
  }

  return {
    id: generateId(),
    role: 'assistant',
    content,
    contentType,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
