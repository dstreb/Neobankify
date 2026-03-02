// ============================================================
// Kafka Event Schemas for Neobank Platform
// ============================================================

import type { SpendingCategory, AgentType, YieldVehicle, KycStatus } from '@neobank/shared-types';

// --- Base Event ---
export interface BaseEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  userId: string;
  timestamp: string; // ISO8601
  version: number;
  correlationId: string;
  source: string;
}

// --- Transaction Events ---
export interface TransactionRawEvent extends BaseEvent {
  eventType: 'transaction.raw';
  data: {
    providerTransactionId: string;
    accountId: string;
    amount: number;
    currency: string;
    merchantName: string;
    mccCode: string;
    transactionDate: string;
    pending: boolean;
    rawPayload: Record<string, unknown>;
  };
}

export interface TransactionEnrichedEvent extends BaseEvent {
  eventType: 'transaction.enriched';
  data: {
    transactionId: string;
    accountId: string;
    amount: number;
    currency: string;
    merchantName: string;
    merchantNormalized: string;
    mccCode: string;
    category: SpendingCategory;
    subcategory: string;
    transactionDate: string;
    pending: boolean;
    rewardEligible: boolean;
    enrichmentConfidence: number;
  };
}

// --- Agent Decision Events ---
export interface AgentDecisionEvent extends BaseEvent {
  eventType: 'agent.decision';
  data: {
    agentType: AgentType;
    decisionType: string;
    decision: Record<string, unknown>;
    reasoning: string;
    confidenceScore: number;
    inputFeatureKeys: string[];
    guardrailsChecked: string[];
    guardrailsTriggered: string[];
    outcome: 'recommended' | 'executed' | 'blocked';
  };
}

export interface AgentRecommendationEvent extends BaseEvent {
  eventType: 'agent.recommendation';
  data: {
    recommendationId: string;
    type: string;
    title: string;
    summary: string;
    explanation: string;
    valueDelta: number;
    confidenceScore: number;
    expiresAt: string;
    actionRequired: boolean;
  };
}

// --- Rewards Events ---
export interface RewardsUpdateEvent extends BaseEvent {
  eventType: 'rewards.catalog_updated' | 'rewards.offer_activated' | 'rewards.offer_expired';
  data: {
    rewardProgramId: string;
    changeType: string;
    previousValue: Record<string, unknown> | null;
    newValue: Record<string, unknown>;
  };
}

export interface RewardsEarnedEvent extends BaseEvent {
  eventType: 'rewards.earned';
  data: {
    transactionId: string;
    cardId: string;
    rewardProgramId: string;
    pointsEarned: number;
    cashbackEarned: number;
    earnRate: number;
    category: SpendingCategory;
    wasOptimal: boolean;
    missedValue: number;
  };
}

// --- Idle Cash Events ---
export interface IdleCashSweepEvent extends BaseEvent {
  eventType: 'idle_cash.sweep_initiated' | 'idle_cash.sweep_completed' | 'idle_cash.sweep_failed';
  data: {
    positionId: string;
    sourceAccountId: string;
    vehicleType: YieldVehicle;
    provider: string;
    amount: number;
    apy: number;
    reason: string;
  };
}

// --- User Events ---
export interface UserProfileChangeEvent extends BaseEvent {
  eventType: 'user.profile_updated' | 'user.goals_updated' | 'user.preferences_updated';
  data: {
    field: string;
    previousValue: unknown;
    newValue: unknown;
  };
}

export interface UserAccountLinkedEvent extends BaseEvent {
  eventType: 'user.account_linked' | 'user.account_unlinked';
  data: {
    accountId: string;
    provider: string;
    accountType: string;
    institutionName: string;
  };
}

// --- Compliance Events ---
export interface ComplianceEvent extends BaseEvent {
  eventType: 'compliance.alert' | 'compliance.kyc_update' | 'compliance.sar_filed';
  data: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ruleTriggered: string;
    requiresAction: boolean;
    kycStatus?: KycStatus;
  };
}

// --- Audit Events ---
export interface AuditEvent extends BaseEvent {
  eventType: 'audit.immutable';
  data: {
    entityType: string;
    entityId: string;
    actorType: 'user' | 'agent' | 'system' | 'admin';
    actorId: string;
    action: string;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
  };
}

// --- Notification Events ---
export interface NotificationEvent extends BaseEvent {
  eventType: 'notification.send';
  data: {
    channel: 'push' | 'email' | 'sms' | 'in_app';
    templateId: string;
    templateData: Record<string, unknown>;
    priority: 'low' | 'medium' | 'high';
  };
}

// --- Union Type for all events ---
export type PlatformEvent =
  | TransactionRawEvent
  | TransactionEnrichedEvent
  | AgentDecisionEvent
  | AgentRecommendationEvent
  | RewardsUpdateEvent
  | RewardsEarnedEvent
  | IdleCashSweepEvent
  | UserProfileChangeEvent
  | UserAccountLinkedEvent
  | ComplianceEvent
  | AuditEvent
  | NotificationEvent;

// --- Kafka Topic Mapping ---
export const KAFKA_TOPICS = {
  TRANSACTIONS_RAW: 'transactions.raw',
  TRANSACTIONS_ENRICHED: 'transactions.enriched',
  AGENT_DECISIONS: 'agent.decisions',
  AGENT_RECOMMENDATIONS: 'agent.recommendations',
  REWARDS_UPDATES: 'rewards.updates',
  REWARDS_EARNED: 'rewards.earned',
  IDLE_CASH_EVENTS: 'idle-cash.events',
  USER_PROFILE_CHANGES: 'user.profile.changes',
  USER_ACCOUNT_EVENTS: 'user.account.events',
  COMPLIANCE_EVENTS: 'compliance.events',
  AUDIT_IMMUTABLE: 'audit.immutable',
  NOTIFICATIONS: 'notifications.send',
} as const;

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];
