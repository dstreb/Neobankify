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
  Dashboard: undefined;
  Cards: undefined;
  AI: undefined;
  Rewards: undefined;
  Transactions: undefined;
  Profile: undefined;
};

export type AIStackParamList = {
  AIChat: undefined;
};

export type HomeStackParamList = {
  DashboardHome: undefined;
  NotificationsList: undefined;
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
