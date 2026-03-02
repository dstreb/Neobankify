// =====================================================
// Mock Data for Dashboard (used when backend is unavailable)
// =====================================================

import type {
  DashboardStats,
  User,
  Transaction,
  Card,
  RewardsSummary,
  ComplianceAlert,
  AuditLog,
  Tenant,
  Recommendation,
  ChartDataPoint,
} from '@/types';

export const MOCK_STATS: DashboardStats = {
  totalUsers: 12_847,
  activeUsers: 9_231,
  totalTransactions: 284_502,
  transactionVolume: 18_742_350,
  totalRewardsEarned: 1_243_890,
  complianceAlerts: 7,
  tenantCount: 14,
  aiDecisions: 48_291,
};

export const MOCK_REVENUE_CHART: ChartDataPoint[] = [
  { name: 'Jan', value: 1_240_000, value2: 980_000 },
  { name: 'Feb', value: 1_380_000, value2: 1_100_000 },
  { name: 'Mar', value: 1_520_000, value2: 1_250_000 },
  { name: 'Apr', value: 1_410_000, value2: 1_180_000 },
  { name: 'May', value: 1_680_000, value2: 1_350_000 },
  { name: 'Jun', value: 1_890_000, value2: 1_520_000 },
  { name: 'Jul', value: 2_010_000, value2: 1_680_000 },
  { name: 'Aug', value: 1_950_000, value2: 1_590_000 },
  { name: 'Sep', value: 2_180_000, value2: 1_780_000 },
  { name: 'Oct', value: 2_340_000, value2: 1_920_000 },
  { name: 'Nov', value: 2_510_000, value2: 2_080_000 },
  { name: 'Dec', value: 2_680_000, value2: 2_210_000 },
];

export const MOCK_CATEGORY_CHART: ChartDataPoint[] = [
  { name: 'Groceries', value: 35 },
  { name: 'Dining', value: 20 },
  { name: 'Gas', value: 12 },
  { name: 'Entertainment', value: 8 },
  { name: 'Shopping', value: 15 },
  { name: 'Other', value: 10 },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'sarah.johnson@email.com', firstName: 'Sarah', lastName: 'Johnson', status: 'active', kycStatus: 'approved', createdAt: '2025-08-15T10:30:00Z', updatedAt: '2026-02-20T14:22:00Z' },
  { id: 'u2', email: 'mike.chen@email.com', firstName: 'Mike', lastName: 'Chen', status: 'active', kycStatus: 'approved', createdAt: '2025-09-02T08:15:00Z', updatedAt: '2026-02-18T09:45:00Z' },
  { id: 'u3', email: 'emily.rodriguez@email.com', firstName: 'Emily', lastName: 'Rodriguez', status: 'active', kycStatus: 'in_review', createdAt: '2025-11-20T16:45:00Z', updatedAt: '2026-02-25T11:30:00Z' },
  { id: 'u4', email: 'james.wilson@email.com', firstName: 'James', lastName: 'Wilson', status: 'suspended', kycStatus: 'approved', createdAt: '2025-07-10T12:00:00Z', updatedAt: '2026-01-15T16:20:00Z' },
  { id: 'u5', email: 'anna.patel@email.com', firstName: 'Anna', lastName: 'Patel', status: 'active', kycStatus: 'pending', createdAt: '2026-02-01T09:20:00Z', updatedAt: '2026-02-28T08:10:00Z' },
  { id: 'u6', email: 'david.kim@email.com', firstName: 'David', lastName: 'Kim', status: 'active', kycStatus: 'approved', createdAt: '2025-10-05T14:30:00Z', updatedAt: '2026-02-22T10:15:00Z' },
  { id: 'u7', email: 'lisa.brown@email.com', firstName: 'Lisa', lastName: 'Brown', status: 'active', kycStatus: 'rejected', createdAt: '2026-01-12T11:00:00Z', updatedAt: '2026-02-10T15:40:00Z' },
  { id: 'u8', email: 'robert.taylor@email.com', firstName: 'Robert', lastName: 'Taylor', status: 'deactivated', kycStatus: 'expired', createdAt: '2025-06-20T08:45:00Z', updatedAt: '2025-12-30T09:00:00Z' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 'u1', amount: 127.43, currency: 'USD', merchantName: 'Whole Foods Market', category: 'Groceries', status: 'posted', transactionDate: '2026-02-28T14:30:00Z', enrichmentData: { mcc: '5411', category: 'Groceries', rewardEligible: true, pointsEarned: 382, cashbackEarned: 3.82 } },
  { id: 't2', userId: 'u2', amount: 54.20, currency: 'USD', merchantName: 'Olive Garden', category: 'Dining', status: 'posted', transactionDate: '2026-02-28T19:15:00Z', enrichmentData: { mcc: '5812', category: 'Dining', rewardEligible: true, pointsEarned: 162, cashbackEarned: 1.62 } },
  { id: 't3', userId: 'u1', amount: 42.50, currency: 'USD', merchantName: 'Shell Gas Station', category: 'Gas', status: 'posted', transactionDate: '2026-02-27T10:45:00Z', enrichmentData: { mcc: '5541', category: 'Gas', rewardEligible: true, pointsEarned: 127, cashbackEarned: 1.27 } },
  { id: 't4', userId: 'u3', amount: 299.99, currency: 'USD', merchantName: 'Apple Store', category: 'Shopping', status: 'posted', transactionDate: '2026-02-27T16:20:00Z', enrichmentData: { mcc: '5732', category: 'Electronics', rewardEligible: true, pointsEarned: 300, cashbackEarned: 3.00 } },
  { id: 't5', userId: 'u2', amount: 15.99, currency: 'USD', merchantName: 'Netflix', category: 'Entertainment', status: 'posted', transactionDate: '2026-02-26T00:00:00Z', enrichmentData: { mcc: '4899', category: 'Streaming', rewardEligible: true, pointsEarned: 48, cashbackEarned: 0.48 } },
  { id: 't6', userId: 'u5', amount: 1250.00, currency: 'USD', merchantName: 'ATM Withdrawal', category: 'ATM', status: 'posted', transactionDate: '2026-02-26T12:30:00Z', enrichmentData: { mcc: '6011', category: 'ATM', rewardEligible: false } },
  { id: 't7', userId: 'u6', amount: 67.85, currency: 'USD', merchantName: 'Target', category: 'Shopping', status: 'pending', transactionDate: '2026-02-28T20:10:00Z', enrichmentData: { mcc: '5311', category: 'Department Store', rewardEligible: true, pointsEarned: 68, cashbackEarned: 0.68 } },
  { id: 't8', userId: 'u1', amount: 3500.00, currency: 'USD', merchantName: 'Wire Transfer', category: 'Transfer', status: 'declined', transactionDate: '2026-02-25T09:00:00Z' },
];

export const MOCK_CARDS: Card[] = [
  { id: 'c1', userId: 'u1', cardNetwork: 'visa', lastFour: '4242', cardType: 'credit', nickname: 'Chase Sapphire Preferred', isPrimary: true, status: 'active', rewardRate: 2.0, expirationDate: '2028-03-01' },
  { id: 'c2', userId: 'u1', cardNetwork: 'discover', lastFour: '1234', cardType: 'credit', nickname: 'Discover It Cash Back', isPrimary: false, status: 'active', rewardRate: 5.0, expirationDate: '2027-11-01' },
  { id: 'c3', userId: 'u2', cardNetwork: 'amex', lastFour: '3456', cardType: 'credit', nickname: 'Amex Gold', isPrimary: true, status: 'active', rewardRate: 4.0, expirationDate: '2028-06-01' },
  { id: 'c4', userId: 'u3', cardNetwork: 'mastercard', lastFour: '5678', cardType: 'debit', nickname: 'Citi Double Cash', isPrimary: true, status: 'active', rewardRate: 2.0, expirationDate: '2027-09-01' },
  { id: 'c5', userId: 'u4', cardNetwork: 'visa', lastFour: '9012', cardType: 'credit', nickname: 'Capital One Venture', isPrimary: true, status: 'frozen', rewardRate: 2.0, expirationDate: '2028-01-01' },
];

export const MOCK_REWARDS: RewardsSummary = {
  totalPoints: 1_243_890,
  totalCashback: 18_742.35,
  pendingPoints: 45_230,
  redeemedPoints: 892_100,
  optimizationScore: 78,
  monthlyEarnings: 4_520,
  missedOpportunities: 1_234,
};

export const MOCK_COMPLIANCE_ALERTS: ComplianceAlert[] = [
  { id: 'ca1', type: 'suspicious_activity', severity: 'high', status: 'open', description: 'Unusual transaction pattern detected: 5 high-value transactions within 10 minutes from user u1', userId: 'u1', createdAt: '2026-02-28T15:30:00Z' },
  { id: 'ca2', type: 'kyc_expiring', severity: 'medium', status: 'open', description: 'KYC documentation for user u8 expired 60 days ago', userId: 'u8', createdAt: '2026-02-25T09:00:00Z' },
  { id: 'ca3', type: 'high_risk_transaction', severity: 'high', status: 'in_review', description: 'Transaction of $3,500 flagged as potentially fraudulent wire transfer', userId: 'u1', createdAt: '2026-02-25T09:05:00Z' },
  { id: 'ca4', type: 'regulatory_breach', severity: 'critical', status: 'open', description: 'Daily transaction limit exceeded for user u6 - requires manual review', userId: 'u6', createdAt: '2026-02-27T18:00:00Z' },
  { id: 'ca5', type: 'suspicious_activity', severity: 'low', status: 'resolved', description: 'Login from new device detected for user u3', userId: 'u3', createdAt: '2026-02-20T10:15:00Z', resolvedAt: '2026-02-20T11:00:00Z', resolution: 'User confirmed new device login' },
  { id: 'ca6', type: 'kyc_expiring', severity: 'medium', status: 'open', description: 'KYC documentation for user u4 will expire in 30 days', userId: 'u4', createdAt: '2026-02-26T08:00:00Z' },
  { id: 'ca7', type: 'high_risk_transaction', severity: 'high', status: 'resolved', description: 'Multiple declined transactions from different IPs for user u5', userId: 'u5', createdAt: '2026-02-22T14:20:00Z', resolvedAt: '2026-02-22T16:45:00Z', resolution: 'False positive - user traveling internationally' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', action: 'user.login', entityType: 'user', entityId: 'u1', userId: 'u1', tenantId: 't1', ipAddress: '192.168.1.100', createdAt: '2026-02-28T14:25:00Z' },
  { id: 'al2', action: 'transaction.create', entityType: 'transaction', entityId: 't1', userId: 'u1', tenantId: 't1', createdAt: '2026-02-28T14:30:00Z' },
  { id: 'al3', action: 'card.set_primary', entityType: 'card', entityId: 'c1', userId: 'u1', tenantId: 't1', beforeState: { isPrimary: false }, afterState: { isPrimary: true }, createdAt: '2026-02-28T14:35:00Z' },
  { id: 'al4', action: 'compliance.alert_created', entityType: 'compliance_alert', entityId: 'ca1', userId: 'system', tenantId: 't1', createdAt: '2026-02-28T15:30:00Z' },
  { id: 'al5', action: 'user.kyc_submitted', entityType: 'user', entityId: 'u3', userId: 'u3', tenantId: 't1', createdAt: '2026-02-25T11:30:00Z' },
  { id: 'al6', action: 'agent.decision', entityType: 'recommendation', entityId: 'r1', userId: 'u1', tenantId: 't1', afterState: { agentType: 'rewards_optimization', outcome: 'recommended', confidence: 0.92 }, createdAt: '2026-02-28T14:31:00Z' },
  { id: 'al7', action: 'tenant.config_updated', entityType: 'tenant', entityId: 'tn1', userId: 'admin', tenantId: 'tn1', beforeState: { primaryColor: '#3B82F6' }, afterState: { primaryColor: '#2563EB' }, createdAt: '2026-02-27T10:00:00Z' },
  { id: 'al8', action: 'user.suspended', entityType: 'user', entityId: 'u4', userId: 'admin', tenantId: 't1', createdAt: '2026-01-15T16:20:00Z' },
];

export const MOCK_TENANTS: Tenant[] = [
  { id: 'tn1', name: 'Neobankify Default', slug: 'neobankify', status: 'active', plan: 'enterprise', branding: { primaryColor: '#3B82F6', secondaryColor: '#1E40AF', appName: 'Neobankify', supportEmail: 'support@neobankify.com' }, features: { rewards: true, aiInsights: true, idleCash: true, investing: false, lending: false }, userCount: 5420, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'tn2', name: 'FinTech Partners', slug: 'fintech-partners', status: 'active', plan: 'growth', branding: { primaryColor: '#059669', secondaryColor: '#065F46', appName: 'GreenBank', supportEmail: 'help@fintechpartners.com' }, features: { rewards: true, aiInsights: true, idleCash: false, investing: false, lending: false }, userCount: 3210, createdAt: '2025-03-15T00:00:00Z' },
  { id: 'tn3', name: 'Rewards Plus', slug: 'rewards-plus', status: 'active', plan: 'growth', branding: { primaryColor: '#DC2626', secondaryColor: '#991B1B', appName: 'RewardsPlus', supportEmail: 'support@rewardsplus.io' }, features: { rewards: true, aiInsights: true, idleCash: true, investing: false, lending: false }, userCount: 2847, createdAt: '2025-06-20T00:00:00Z' },
  { id: 'tn4', name: 'CashFlow AI', slug: 'cashflow-ai', status: 'active', plan: 'enterprise', branding: { primaryColor: '#7C3AED', secondaryColor: '#5B21B6', appName: 'CashFlow', supportEmail: 'hello@cashflowai.com' }, features: { rewards: true, aiInsights: true, idleCash: true, investing: true, lending: false }, userCount: 1370, createdAt: '2025-09-01T00:00:00Z' },
  { id: 'tn5', name: 'QuickSave Bank', slug: 'quicksave', status: 'provisioning', plan: 'starter', branding: { primaryColor: '#F59E0B', secondaryColor: '#D97706', appName: 'QuickSave', supportEmail: 'info@quicksave.bank' }, features: { rewards: true, aiInsights: false, idleCash: false, investing: false, lending: false }, userCount: 0, createdAt: '2026-02-20T00:00:00Z' },
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', userId: 'u1', agentType: 'rewards_optimization', outcome: 'recommended', decision: { action: 'switch_card', category: 'dining', fromCard: 'c1', toCard: 'c2', estimatedSavings: 15.40 }, confidence: 0.92, createdAt: '2026-02-28T14:31:00Z' },
  { id: 'r2', userId: 'u2', agentType: 'idle_cash', outcome: 'accepted', decision: { action: 'sweep_to_hys', amount: 2500, targetRate: 4.5, estimatedReturn: 112.50 }, confidence: 0.88, createdAt: '2026-02-27T10:00:00Z' },
  { id: 'r3', userId: 'u1', agentType: 'rewards_optimization', outcome: 'executed', decision: { action: 'activate_offer', offerId: 'off-1', description: '5% back on groceries' }, confidence: 0.95, createdAt: '2026-02-26T08:15:00Z' },
  { id: 'r4', userId: 'u3', agentType: 'behavioral_learning', outcome: 'dismissed', decision: { action: 'budget_alert', category: 'dining', currentSpend: 450, suggestedLimit: 300 }, confidence: 0.85, createdAt: '2026-02-25T16:30:00Z' },
  { id: 'r5', userId: 'u6', agentType: 'risk_guardrail', outcome: 'recommended', decision: { action: 'utilization_warning', currentUtilization: 72, threshold: 70, recommendation: 'Pay down balance' }, confidence: 0.97, createdAt: '2026-02-28T09:00:00Z' },
];

export const MOCK_USER_GROWTH: ChartDataPoint[] = [
  { name: 'Jan', value: 8200 },
  { name: 'Feb', value: 8850 },
  { name: 'Mar', value: 9400 },
  { name: 'Apr', value: 9900 },
  { name: 'May', value: 10_450 },
  { name: 'Jun', value: 10_980 },
  { name: 'Jul', value: 11_300 },
  { name: 'Aug', value: 11_650 },
  { name: 'Sep', value: 11_920 },
  { name: 'Oct', value: 12_200 },
  { name: 'Nov', value: 12_540 },
  { name: 'Dec', value: 12_847 },
];

export const MOCK_REWARDS_CHART: ChartDataPoint[] = [
  { name: 'Jan', value: 78_200 },
  { name: 'Feb', value: 82_400 },
  { name: 'Mar', value: 91_300 },
  { name: 'Apr', value: 87_600 },
  { name: 'May', value: 95_200 },
  { name: 'Jun', value: 102_800 },
  { name: 'Jul', value: 108_400 },
  { name: 'Aug', value: 112_100 },
  { name: 'Sep', value: 118_700 },
  { name: 'Oct', value: 125_300 },
  { name: 'Nov', value: 132_500 },
  { name: 'Dec', value: 139_290 },
];
