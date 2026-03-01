// ============================================================
// Shared Types for Neobank Platform
// ============================================================

// --- Tenant Types ---
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  config: TenantConfig;
  theme: TenantTheme;
  featureFlags: FeatureFlags;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = 'active' | 'suspended' | 'onboarding';

export interface TenantConfig {
  allowedYieldVehicles: string[];
  maxIdleCashSweepPct: number;
  defaultLiquidityThreshold: number;
  rewardProgramIds: string[];
  kycProvider: 'persona' | 'alloy' | 'socure';
  notificationChannels: ('push' | 'email' | 'sms')[];
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontFamily: string;
  appName: string;
}

export interface FeatureFlags {
  rewardsOptimization: boolean;
  idleCashSweep: boolean;
  behavioralLearning: boolean;
  cardRouting: boolean;
  investing: boolean;
  trading: boolean;
  lending: boolean;
}

// --- User Types ---
export interface User {
  id: string;
  tenantId: string;
  externalAuthId: string;
  email: string;
  emailVerified: boolean;
  kycStatus: KycStatus;
  kycProvider: string | null;
  kycReferenceId: string | null;
  riskProfile: RiskProfile;
  goals: UserGoal[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type KycStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'review' | 'expired';
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface UserGoal {
  id: string;
  type: GoalType;
  parameters: Record<string, unknown>;
  priority: number;
  active: boolean;
}

export type GoalType =
  | 'maximize_cashback'
  | 'travel_rewards'
  | 'points_maximizer'
  | 'minimize_fees'
  | 'grow_savings';

export interface UserPreferences {
  notificationFrequency: 'realtime' | 'daily' | 'weekly';
  autoSweepEnabled: boolean;
  recommendationStyle: 'proactive' | 'on_demand';
  preferredRedemptionType: 'cashback' | 'travel' | 'transfer' | 'gift_cards';
}

// --- Account Types ---
export interface LinkedAccount {
  id: string;
  userId: string;
  provider: AccountProvider;
  providerAccountId: string;
  accountType: AccountType;
  institutionName: string;
  mask: string;
  currentBalance: number;
  availableBalance: number;
  creditLimit: number | null;
  lastSyncedAt: Date;
  status: AccountStatus;
  createdAt: Date;
}

export type AccountProvider = 'plaid' | 'mx' | 'finicity' | 'manual';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'debit_card' | 'investment';
export type AccountStatus = 'active' | 'disconnected' | 'error';

// --- Transaction Types ---
export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  merchantName: string;
  merchantNormalized: string;
  mccCode: string;
  category: SpendingCategory;
  subcategory: string;
  transactionDate: Date;
  postedDate: Date | null;
  pending: boolean;
  rewardEligible: boolean;
  enrichmentData: TransactionEnrichment;
  createdAt: Date;
}

export type SpendingCategory =
  | 'dining'
  | 'groceries'
  | 'gas'
  | 'travel'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'transportation'
  | 'subscriptions'
  | 'other';

export interface TransactionEnrichment {
  rewardRateApplied: number | null;
  pointsEarned: number | null;
  cashbackEarned: number | null;
  optimalCard: string | null;
  optimalCardRate: number | null;
  missedValue: number | null;
}

// --- Card Types ---
export interface UserCard {
  id: string;
  userId: string;
  cardName: string;
  issuer: string;
  network: CardNetwork;
  lastFour: string;
  cardType: 'credit' | 'debit';
  rewardProgramId: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover';

export interface RewardProgram {
  id: string;
  tenantId: string;
  name: string;
  issuer: string;
  programType: 'cashback' | 'points' | 'miles';
  baseEarnRate: number;
  categoryRates: Record<SpendingCategory, number>;
  pointValueCents: number;
  transferPartners: TransferPartner[];
  annualFee: number;
  signupBonus: SignupBonus | null;
  activeOffers: CardOffer[];
  lastUpdatedAt: Date;
}

export interface TransferPartner {
  name: string;
  ratio: number; // e.g., 1:1.5 = 1.5
  airline: boolean;
  hotel: boolean;
}

export interface SignupBonus {
  points: number;
  spendRequirement: number;
  timeframeDays: number;
}

export interface CardOffer {
  id: string;
  merchantName: string;
  discountPct: number;
  cashbackPct: number;
  expiresAt: Date;
  enrolled: boolean;
}

// --- AI Agent Types ---
export interface AgentDecision {
  id: string;
  userId: string;
  agentType: AgentType;
  decisionType: string;
  inputFeatures: Record<string, unknown>;
  decision: Record<string, unknown>;
  reasoning: string;
  confidenceScore: number;
  guardrailsTriggered: string[];
  status: DecisionStatus;
  userAction: UserDecisionAction | null;
  outcomeTracked: boolean;
  createdAt: Date;
}

export type AgentType =
  | 'orchestrator'
  | 'rewards_optimization'
  | 'idle_cash'
  | 'risk_guardrail'
  | 'behavioral_learning';

export type DecisionStatus = 'recommended' | 'executed' | 'blocked' | 'expired';
export type UserDecisionAction = 'accepted' | 'dismissed' | 'overridden';

export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  title: string;
  summary: string;
  explanation: string;
  valueDelta: number;
  confidenceScore: number;
  data: Record<string, unknown>;
  status: DecisionStatus;
  expiresAt: Date;
  createdAt: Date;
}

export type RecommendationType =
  | 'card_routing'
  | 'redemption_optimization'
  | 'offer_enrollment'
  | 'idle_cash_sweep'
  | 'spending_alert'
  | 'utilization_warning';

// --- Idle Cash Types ---
export interface IdleCashPosition {
  id: string;
  userId: string;
  accountId: string;
  vehicleType: YieldVehicle;
  provider: string;
  amount: number;
  apy: number;
  initiatedAt: Date;
  maturityDate: Date | null;
  status: 'active' | 'pending' | 'matured' | 'withdrawn';
}

export type YieldVehicle = 'hysa' | 'money_market' | 'treasury_bill' | 'cd';

export interface IdleCashAnalysis {
  userId: string;
  totalIdleCash: number;
  liquidityThreshold: number;
  sweepableAmount: number;
  currentYield: number;
  projectedYieldImprovement: number;
  recommendedVehicle: YieldVehicle;
  recommendedVehicleApy: number;
  fdicCoverageRemaining: number;
}

// --- Audit Types ---
export interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  actorType: 'user' | 'agent' | 'system' | 'admin';
  actorId: string;
  action: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
}

export type AuditEventType =
  | 'agent_decision'
  | 'user_action'
  | 'system_event'
  | 'compliance_event'
  | 'admin_action';

// --- API Response Types ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  total: number;
}

// --- Event Types (Kafka) ---
export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  tenantId: string;
  userId: string;
  timestamp: Date;
  version: number;
  data: T;
}
