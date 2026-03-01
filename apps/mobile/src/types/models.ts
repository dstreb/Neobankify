// =====================================================
// Domain Models
// =====================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  brandConfig: BrandConfig;
  featureFlags: FeatureFlags;
}

export interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  appName: string;
  fontFamily?: string;
}

export interface FeatureFlags {
  rewardsEnabled: boolean;
  idleCashEnabled: boolean;
  investingEnabled: boolean;
  tradingEnabled: boolean;
  lendingEnabled: boolean;
  cardManagementEnabled: boolean;
  accountAggregationEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  kycStatus: KycStatus;
  status: 'active' | 'suspended' | 'deactivated';
  createdAt: string;
}

export type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'review' | 'expired';

export interface UserGoal {
  id: string;
  type: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface Card {
  id: string;
  cardName: string;
  lastFour: string;
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  rewardProgramId?: string;
  isPrimary: boolean;
  status: 'active' | 'frozen' | 'closed';
  expirationDate: string;
}

export interface Transaction {
  id: string;
  amount: number;
  merchantName: string;
  merchantNormalized?: string;
  category?: string;
  subcategory?: string;
  mccCode?: string;
  transactionDate: string;
  status: 'pending' | 'posted' | 'cancelled' | 'returned';
  rewardEligible?: boolean;
  enrichmentData?: Record<string, unknown>;
}

export interface RewardProgram {
  id: string;
  name: string;
  issuer: string;
  programType: string;
  baseEarnRate: number;
  categoryRates: Record<string, number>;
  pointValueCents: number;
  annualFee: number;
  signupBonus?: Record<string, unknown>;
  isActive: boolean;
}

export interface Recommendation {
  id: string;
  agentType: string;
  decisionType: string;
  decision: Record<string, unknown>;
  reasoning: string;
  confidenceScore: number;
  guardrailsTriggered: string[];
  outcome: 'recommended' | 'executed' | 'dismissed' | 'overridden' | 'expired' | 'blocked';
  createdAt: string;
}

export interface RewardsSummary {
  totalPointsEarned: number;
  totalCashbackEarned: string;
  totalMissedValue: string;
  period: string;
}

export interface LinkedAccount {
  id: string;
  institutionName: string;
  accountType: string;
  accountName: string;
  mask: string;
  currentBalance?: number;
  availableBalance?: number;
  status: 'active' | 'disconnected' | 'error';
  lastSyncAt?: string;
}

export interface Notification {
  id: string;
  type: 'reward' | 'transaction' | 'security' | 'system' | 'recommendation';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// =====================================================
// AI Assistant Models
// =====================================================

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessageContentType = 'text' | 'insight' | 'action' | 'chart';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  contentType: ChatMessageContentType;
  timestamp: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  /** Structured insight data for rich rendering */
  insight?: AIInsight;
  /** Actionable suggestion the user can execute */
  action?: AIAction;
  /** Confidence score for AI-generated content (0–1) */
  confidence?: number;
  /** Agent that produced this response */
  agentType?: string;
}

export interface AIInsight {
  title: string;
  summary: string;
  category: 'spending' | 'rewards' | 'savings' | 'risk' | 'general';
  impact?: string;
  metric?: { label: string; value: string; trend?: 'up' | 'down' | 'flat' };
}

export interface AIAction {
  id: string;
  label: string;
  description: string;
  type: 'switch_card' | 'activate_offer' | 'optimize_rewards' | 'set_goal' | 'link_account' | 'custom';
  payload?: Record<string, unknown>;
  executed?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
