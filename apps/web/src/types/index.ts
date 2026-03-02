// =====================================================
// Web Dashboard Types
// =====================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'suspended' | 'deactivated';
  kycStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  merchantName: string;
  category: string;
  status: 'pending' | 'posted' | 'declined' | 'reversed';
  transactionDate: string;
  enrichmentData?: {
    mcc: string;
    category: string;
    rewardEligible: boolean;
    pointsEarned?: number;
    cashbackEarned?: number;
    missedValue?: number;
  };
}

export interface Card {
  id: string;
  userId: string;
  cardNetwork: 'visa' | 'mastercard' | 'amex' | 'discover';
  lastFour: string;
  cardType: 'credit' | 'debit';
  nickname: string;
  isPrimary: boolean;
  status: 'active' | 'frozen' | 'cancelled';
  rewardRate: number;
  expirationDate: string;
}

export interface RewardsSummary {
  totalPoints: number;
  totalCashback: number;
  pendingPoints: number;
  redeemedPoints: number;
  optimizationScore: number;
  monthlyEarnings: number;
  missedOpportunities: number;
}

export interface ComplianceAlert {
  id: string;
  type: 'kyc_expiring' | 'suspicious_activity' | 'high_risk_transaction' | 'regulatory_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  description: string;
  userId?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'provisioning';
  plan: 'starter' | 'growth' | 'enterprise';
  branding: TenantBranding;
  features: Record<string, boolean>;
  userCount: number;
  createdAt: string;
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  appName: string;
  supportEmail: string;
  supportPhone?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  transactionVolume: number;
  totalRewardsEarned: number;
  complianceAlerts: number;
  tenantCount: number;
  aiDecisions: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}

export interface Recommendation {
  id: string;
  userId: string;
  agentType: string;
  outcome: 'recommended' | 'accepted' | 'dismissed' | 'executed';
  decision: Record<string, unknown>;
  confidence: number;
  createdAt: string;
}
