import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// =====================================================
// Navigation Type Definitions
// =====================================================

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  ConnectBank: undefined;
  SetGoals: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Offers: undefined;
  AI: undefined;
  Wallet: undefined;
  History: undefined;
};

export type AIStackParamList = {
  AIChat: undefined;
};

export type OffersStackParamList = {
  OffersHome: undefined;
  ProfileMain: undefined;
  AddAccount: undefined;
  SavingsPots: undefined;
  // Profile sub-screens
  Security: undefined;
  Notifications: undefined;
  LinkedAccounts: undefined;
  // Wealth screens accessible from Profile
  RewardsSummary: undefined;
  InvestingDashboard: undefined;
  TradingDashboard: undefined;
  LendingDashboard: undefined;
};

export type WalletStackParamList = {
  WalletHome: undefined;
  Payments: { flow?: string } | undefined;
  ProfileMain: undefined;
  AddAccount: undefined;
  SavingsPots: undefined;
  // Profile sub-screens
  Security: undefined;
  Notifications: undefined;
  LinkedAccounts: undefined;
  // Wealth screens accessible from Profile
  RewardsSummary: undefined;
  InvestingDashboard: undefined;
  TradingDashboard: undefined;
  LendingDashboard: undefined;
};

export type HistoryStackParamList = {
  HistoryHome: undefined;
  ProfileMain: undefined;
  TransactionDetail: { transactionId: string };
  AddAccount: undefined;
  SavingsPots: undefined;
  // Profile sub-screens
  Security: undefined;
  Notifications: undefined;
  LinkedAccounts: undefined;
  // Wealth screens accessible from Profile
  RewardsSummary: undefined;
  InvestingDashboard: undefined;
  TradingDashboard: undefined;
  LendingDashboard: undefined;
};

export type HomeStackParamList = {
  DashboardHome: undefined;
  NotificationsList: undefined;
  ProfileMain: undefined;
  AddAccount: undefined;
  SavingsPots: undefined;
  // Profile sub-screens
  Security: undefined;
  Notifications: undefined;
  LinkedAccounts: undefined;
  // Sub-features accessible from Home
  RewardsSummary: undefined;
  RewardsHistory: undefined;
  OffersList: undefined;
  RecommendationDetail: { recommendationId: string };
  InvestingDashboard: undefined;
  SuitabilityAssessment: undefined;
  HoldingDetail: { holdingId: string };
  InvestingOrder: { side?: string };
  InvestingSettings: undefined;
  TradingDashboard: undefined;
  TradeOrder: { side?: string };
  PositionDetail: { positionId: string };
  AISignals: undefined;
  PaperTrading: undefined;
  LendingDashboard: undefined;
  LoanApplication: undefined;
  LoanDetail: { loanId: string };
  MakePayment: { loanId?: string };
  // Transaction detail accessible from dashboard
  TransactionDetail: { transactionId: string };
};

export type PaymentsStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
};

export type CardsStackParamList = {
  CardsList: undefined;
  CardDetail: { cardId: string };
  AddCard: undefined;
};

export type RewardsStackParamList = {
  RewardsSummary: undefined;
  RewardsHistory: undefined;
  OffersList: undefined;
  RecommendationDetail: { recommendationId: string };
};

export type TransactionsStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Security: undefined;
  Notifications: undefined;
  LinkedAccounts: undefined;
  // Sub-features accessible from Profile
  RewardsSummary: undefined;
  RewardsHistory: undefined;
  OffersList: undefined;
  RecommendationDetail: { recommendationId: string };
  InvestingDashboard: undefined;
  TradingDashboard: undefined;
  LendingDashboard: undefined;
};

export type InvestingStackParamList = {
  InvestingDashboard: undefined;
  SuitabilityAssessment: undefined;
  HoldingDetail: { holdingId: string };
  InvestingOrder: { side?: string };
  InvestingSettings: undefined;
};

export type TradingStackParamList = {
  TradingDashboard: undefined;
  TradeOrder: { side?: string };
  PositionDetail: { positionId: string };
  AISignals: undefined;
  PaperTrading: undefined;
};

export type LendingStackParamList = {
  LendingDashboard: undefined;
  LoanApplication: undefined;
  LoanDetail: { loanId: string };
  MakePayment: { loanId?: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen prop types
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type CardsScreenProps<T extends keyof CardsStackParamList> =
  NativeStackScreenProps<CardsStackParamList, T>;

export type RewardsScreenProps<T extends keyof RewardsStackParamList> =
  NativeStackScreenProps<RewardsStackParamList, T>;

export type TransactionsScreenProps<T extends keyof TransactionsStackParamList> =
  NativeStackScreenProps<TransactionsStackParamList, T>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type AIScreenProps<T extends keyof AIStackParamList> =
  NativeStackScreenProps<AIStackParamList, T>;

export type InvestingScreenProps<T extends keyof InvestingStackParamList> =
  NativeStackScreenProps<InvestingStackParamList, T>;

export type TradingScreenProps<T extends keyof TradingStackParamList> =
  NativeStackScreenProps<TradingStackParamList, T>;

export type LendingScreenProps<T extends keyof LendingStackParamList> =
  NativeStackScreenProps<LendingStackParamList, T>;
