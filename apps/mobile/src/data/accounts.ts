// =====================================================
// Shared Accounts & Transactions Data Module
// =====================================================
// This module serves as the single source of truth for account,
// transaction, card, and spending data. Both DashboardScreen (Home)
// and the AI Banking Assistant import from here so balances, names,
// and details always match across the entire app.
//
// In production, this would be replaced by API calls to the
// accounts / transactions microservices.
// =====================================================

export interface MockAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit';
  lastFour: string;
  balance: number;
  icon: 'wallet-outline' | 'cash-outline' | 'card-outline';
}

export interface MockTransaction {
  id: string;
  type: 'Transfer' | 'Withdraw' | 'Deposit' | 'Convert';
  description: string;
  amount: number;
  icon: 'swap-horizontal-outline' | 'arrow-down-outline' | 'arrow-up-outline' | 'repeat-outline';
}

export interface MockCard {
  id: string;
  name: string;
  type: 'Virtual' | 'Physical';
  lastFour: string;
  balance: number;
}

export interface MockOffer {
  id: string;
  brand: string;
  description: string;
  endsIn: string;
  color: string;
}

export interface MockNewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
}

export interface WeeklySpendingDay {
  day: string;
  income: number;
  spending: number;
}

// =====================================================
// Mock Data — simulates database records
// =====================================================

export const MOCK_ACCOUNTS: MockAccount[] = [
  { id: '1', name: 'Personal', type: 'Checking', lastFour: '8815', balance: 4522.25, icon: 'wallet-outline' },
  { id: '2', name: 'Savings', type: 'Savings', lastFour: '1179', balance: 8458.22, icon: 'cash-outline' },
  { id: '3', name: 'Credit', type: 'Credit', lastFour: '9718', balance: 1858.58, icon: 'card-outline' },
];

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  { id: '1', type: 'Transfer', description: 'To Jane Doe \u2022\u20222287', amount: -1250.00, icon: 'swap-horizontal-outline' },
  { id: '2', type: 'Withdraw', description: 'From Savings \u2022\u20228813', amount: -52.25, icon: 'arrow-down-outline' },
  { id: '3', type: 'Deposit', description: 'To Primary \u2022\u20228872', amount: 7.55, icon: 'arrow-up-outline' },
  { id: '4', type: 'Convert', description: 'SGD \u2192 USD', amount: 10125.00, icon: 'repeat-outline' },
];

export const MOCK_CARDS: MockCard[] = [
  { id: '1', name: 'swiftbank Platinum', type: 'Virtual', lastFour: '8812', balance: 1485.25 },
  { id: '2', name: 'swiftbank Gold', type: 'Physical', lastFour: '8812', balance: 500.00 },
];

export const MOCK_OFFERS: MockOffer[] = [
  { id: '1', brand: "McDonald's", description: '10% Cashback your first order!', endsIn: '3d', color: '#DA291C' },
  { id: '2', brand: 'Walmart', description: '25% Cashback your first order!', endsIn: '3d', color: '#0071CE' },
];

export const MOCK_NEWS: MockNewsItem[] = [
  { id: '1', title: 'What are homeowners association fees and what do they cover?', date: 'December 12, 2025', category: 'Stock Market' },
  { id: '2', title: 'What are the fees and when do they apply?', date: 'December 12, 2025', category: 'Finance' },
  { id: '3', title: 'How to maximize your savings with high-yield accounts', date: 'December 11, 2025', category: 'Savings' },
];

export const WEEKLY_SPENDING: WeeklySpendingDay[] = [
  { day: 'Mon', income: 20, spending: 15 },
  { day: 'Tue', income: 10, spending: 8 },
  { day: 'Wed', income: 15, spending: 25 },
  { day: 'Thu', income: 30, spending: 20 },
  { day: 'Fri', income: 10, spending: 12 },
  { day: 'Sat', income: 5, spending: 18 },
  { day: 'Sun', income: 8, spending: 10 },
];

// =====================================================
// Helpers
// =====================================================

/** Total consolidated balance (credits subtracted as liabilities) */
export function getConsolidatedBalance(accounts: MockAccount[] = MOCK_ACCOUNTS): number {
  return accounts.reduce(
    (sum, acc) => (acc.type === 'Credit' ? sum - acc.balance : sum + acc.balance),
    0,
  );
}

/** Format a number as USD currency */
export function formatUSD(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
