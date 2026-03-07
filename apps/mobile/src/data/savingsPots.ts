// =====================================================
// Shared Savings Pots Data Module
// =====================================================
// This module serves as the single source of truth for savings pot data.
// Both DashboardScreen (summary view) and SavingsPotsScreen (detail view)
// import from here so names, balances, and details always match.
//
// In production, this would be replaced by API calls to the savings-pots
// microservice which reads from the savings_pots table in the database.
// =====================================================

export type PotIcon = 'airplane' | 'home' | 'school' | 'car' | 'heart' | 'gift' | 'briefcase' | 'leaf' | 'star' | 'rocket';
export type PotColor = string;

export interface PotActivity {
  id: string;
  type: 'deposit' | 'withdraw' | 'roundup' | 'recurring';
  amount: number;
  date: string;
  description: string;
}

export interface SavingsPot {
  id: string;
  name: string;
  icon: PotIcon;
  color: PotColor;
  currentAmount: number;
  goalAmount: number;
  targetDate: string;
  roundupsEnabled: boolean;
  roundupMultiplier: number;
  recurringEnabled: boolean;
  recurringAmount: number;
  recurringFrequency: string;
  linkedAccountId: string;
  activities: PotActivity[];
}

export interface LinkedAccount {
  id: string;
  name: string;
  lastFour: string;
  balance: number;
  color: string;
}

// =====================================================
// Mock Data — simulates database records
// =====================================================

export const MOCK_LINKED_ACCOUNTS: LinkedAccount[] = [
  { id: '1', name: 'Chase Bank', lastFour: '4497', balance: 4411, color: '#117ACA' },
  { id: '2', name: 'Bank of America', lastFour: '4467', balance: 2411, color: '#E31837' },
  { id: '3', name: 'Capital One', lastFour: '5483', balance: 4411, color: '#004977' },
];

export const INITIAL_POTS: SavingsPot[] = [
  {
    id: '1',
    name: 'Vacation',
    icon: 'airplane',
    color: '#0369A1',
    currentAmount: 3750,
    goalAmount: 5000,
    targetDate: 'Mar 13, 2027',
    roundupsEnabled: true,
    roundupMultiplier: 5,
    recurringEnabled: true,
    recurringAmount: 5000,
    recurringFrequency: 'Every 17 days',
    linkedAccountId: '1',
    activities: [
      { id: 'a1', type: 'deposit', amount: 5000, date: 'Fri January, +#472', description: 'Deposit' },
      { id: 'a2', type: 'deposit', amount: 5000, date: 'Fri January, +#472', description: 'Deposit' },
      { id: 'a3', type: 'roundup', amount: 3000, date: 'Fri January, +#472', description: 'Round-Up' },
    ],
  },
  {
    id: '2',
    name: 'Education',
    icon: 'school',
    color: '#7C3AED',
    currentAmount: 6800,
    goalAmount: 10000,
    targetDate: 'Jun 1, 2027',
    roundupsEnabled: false,
    roundupMultiplier: 1,
    recurringEnabled: false,
    recurringAmount: 0,
    recurringFrequency: 'Monthly',
    linkedAccountId: '2',
    activities: [
      { id: 'b1', type: 'deposit', amount: 2000, date: 'Fri January, +#472', description: 'Deposit' },
    ],
  },
  {
    id: '3',
    name: 'Bills & Subscription',
    icon: 'briefcase',
    color: '#059669',
    currentAmount: 1200,
    goalAmount: 1200,
    targetDate: 'Dec 31, 2026',
    roundupsEnabled: false,
    roundupMultiplier: 1,
    recurringEnabled: true,
    recurringAmount: 100,
    recurringFrequency: 'Monthly',
    linkedAccountId: '1',
    activities: [],
  },
];

export const POT_ICONS: { icon: PotIcon; label: string }[] = [
  { icon: 'airplane', label: 'Travel' },
  { icon: 'home', label: 'Home' },
  { icon: 'school', label: 'Education' },
  { icon: 'car', label: 'Car' },
  { icon: 'heart', label: 'Health' },
  { icon: 'gift', label: 'Gift' },
  { icon: 'briefcase', label: 'Business' },
  { icon: 'leaf', label: 'Nature' },
  { icon: 'star', label: 'Goals' },
  { icon: 'rocket', label: 'Dreams' },
];

export const POT_COLORS: PotColor[] = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#0369A1', '#059669',
];

export const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Custom Frequency'];

export const TARGET_DATES = [
  { month: 'Jan', day: 11, year: 2027 },
  { month: 'Feb', day: 12, year: 2027 },
  { month: 'Mar', day: 13, year: 2027 },
  { month: 'Apr', day: 14, year: 2028 },
  { month: 'May', day: 15, year: 2029 },
];
