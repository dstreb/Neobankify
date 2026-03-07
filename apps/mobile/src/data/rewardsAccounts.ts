// =====================================================
// Shared Rewards Accounts Data Module
// =====================================================
// This module serves as the single source of truth for rewards account data.
// The OffersTabScreen (overview) and RewardsAccountDetail (management)
// import from here so balances, points, and details always match.
//
// In production, this would be replaced by API calls to the rewards
// microservice which reads from the rewards_accounts table in the database.
// =====================================================

export type RewardsAccountType = 'airline' | 'coffee' | 'hotel' | 'grocery' | 'gas' | 'retail' | 'crypto';

export interface RewardsAccount {
  id: string;
  name: string;
  programName: string;
  icon: string; // Ionicons name
  color: string;
  type: RewardsAccountType;
  pointsBalance: number;
  pointsUnit: string; // e.g. "Miles", "Stars", "Points"
  cashValuePerPoint: number; // how much 1 point is worth in USD
  accountNumber: string; // masked
  memberSince: string;
  tier: string;
  linkedSince: string;
  // Buy/Sell rates
  buyRatePerPoint: number; // cost to buy 1 point in USD
  sellRatePerPoint: number; // what you get for selling 1 point in USD
}

export interface RewardsOffer {
  id: string;
  accountId: string;
  title: string;
  description: string;
  pointsCost: number;
  cashValue: number;
  expiresIn: string;
  category: string;
}

// =====================================================
// Mock Rewards Accounts
// =====================================================
export const REWARDS_ACCOUNTS: RewardsAccount[] = [
  {
    id: 'r1',
    name: 'Air Miles',
    programName: 'Air Miles Rewards',
    icon: 'airplane',
    color: '#0066CC',
    type: 'airline',
    pointsBalance: 24500,
    pointsUnit: 'Miles',
    cashValuePerPoint: 0.012,
    accountNumber: '****7821',
    memberSince: 'Jan 2019',
    tier: 'Gold',
    linkedSince: 'Mar 2024',
    buyRatePerPoint: 0.02,
    sellRatePerPoint: 0.008,
  },
  {
    id: 'r2',
    name: 'Starbucks',
    programName: 'Starbucks Rewards',
    icon: 'cafe',
    color: '#00704A',
    type: 'coffee',
    pointsBalance: 1245,
    pointsUnit: 'Stars',
    cashValuePerPoint: 0.05,
    accountNumber: '****3390',
    memberSince: 'Jun 2020',
    tier: 'Gold',
    linkedSince: 'Aug 2024',
    buyRatePerPoint: 0.08,
    sellRatePerPoint: 0.035,
  },
  {
    id: 'r3',
    name: 'Marriott',
    programName: 'Marriott Bonvoy',
    icon: 'bed',
    color: '#1C1C1C',
    type: 'hotel',
    pointsBalance: 87200,
    pointsUnit: 'Points',
    cashValuePerPoint: 0.007,
    accountNumber: '****5512',
    memberSince: 'Mar 2018',
    tier: 'Platinum',
    linkedSince: 'Jan 2024',
    buyRatePerPoint: 0.0125,
    sellRatePerPoint: 0.005,
  },
  {
    id: 'r4',
    name: 'Optimum',
    programName: 'PC Optimum',
    icon: 'cart',
    color: '#E31837',
    type: 'grocery',
    pointsBalance: 156800,
    pointsUnit: 'Points',
    cashValuePerPoint: 0.001,
    accountNumber: '****9945',
    memberSince: 'Nov 2017',
    tier: 'Member',
    linkedSince: 'May 2024',
    buyRatePerPoint: 0.0015,
    sellRatePerPoint: 0.0007,
  },
  {
    id: 'r5',
    name: 'Shell',
    programName: 'Shell Fuel Rewards',
    icon: 'flame',
    color: '#FFD500',
    type: 'gas',
    pointsBalance: 3820,
    pointsUnit: 'Points',
    cashValuePerPoint: 0.01,
    accountNumber: '****2217',
    memberSince: 'Apr 2021',
    tier: 'Gold',
    linkedSince: 'Sep 2024',
    buyRatePerPoint: 0.015,
    sellRatePerPoint: 0.007,
  },
];

// =====================================================
// Mock Rewards Offers
// =====================================================
export const REWARDS_OFFERS: RewardsOffer[] = [
  // Air Miles offers
  { id: 'ro1', accountId: 'r1', title: 'Free Domestic Flight', description: 'Round-trip economy ticket anywhere domestic', pointsCost: 15000, cashValue: 350, expiresIn: '30d', category: 'Travel' },
  { id: 'ro2', accountId: 'r1', title: '$50 Gift Card', description: 'Amazon, Walmart, or Best Buy gift card', pointsCost: 5000, cashValue: 50, expiresIn: '90d', category: 'Shopping' },
  { id: 'ro3', accountId: 'r1', title: 'Hotel Night Stay', description: 'One night at select partner hotels', pointsCost: 8000, cashValue: 120, expiresIn: '60d', category: 'Travel' },
  // Starbucks offers
  { id: 'ro4', accountId: 'r2', title: 'Free Handcrafted Drink', description: 'Any size, any customization', pointsCost: 150, cashValue: 7.5, expiresIn: '7d', category: 'Food' },
  { id: 'ro5', accountId: 'r2', title: 'Free Bakery Item', description: 'Choose any bakery item', pointsCost: 75, cashValue: 4.0, expiresIn: '7d', category: 'Food' },
  { id: 'ro6', accountId: 'r2', title: 'Free Lunch Sandwich', description: 'Any hot or cold sandwich', pointsCost: 200, cashValue: 8.5, expiresIn: '14d', category: 'Food' },
  // Marriott offers
  { id: 'ro7', accountId: 'r3', title: 'Free Night Award', description: 'Category 1-4 hotel, one night', pointsCost: 25000, cashValue: 200, expiresIn: '365d', category: 'Travel' },
  { id: 'ro8', accountId: 'r3', title: 'Suite Upgrade', description: 'Upgrade to suite at check-in', pointsCost: 15000, cashValue: 150, expiresIn: '180d', category: 'Travel' },
  { id: 'ro9', accountId: 'r3', title: 'Spa Credit $75', description: '$75 credit at any Marriott spa', pointsCost: 10000, cashValue: 75, expiresIn: '90d', category: 'Wellness' },
  // Optimum offers
  { id: 'ro10', accountId: 'r4', title: '$10 Off Groceries', description: 'On your next purchase of $50+', pointsCost: 10000, cashValue: 10, expiresIn: '14d', category: 'Grocery' },
  { id: 'ro11', accountId: 'r4', title: '$25 Off Groceries', description: 'On your next purchase of $100+', pointsCost: 25000, cashValue: 25, expiresIn: '14d', category: 'Grocery' },
  { id: 'ro12', accountId: 'r4', title: '20x Points Event', description: 'Earn 20x points on your next visit', pointsCost: 0, cashValue: 0, expiresIn: '3d', category: 'Bonus' },
  // Shell offers
  { id: 'ro13', accountId: 'r5', title: '$0.10/gal Discount', description: 'Save $0.10 per gallon on next fill-up', pointsCost: 500, cashValue: 2.0, expiresIn: '30d', category: 'Gas' },
  { id: 'ro14', accountId: 'r5', title: 'Free Car Wash', description: 'Basic car wash at any Shell station', pointsCost: 1000, cashValue: 12.0, expiresIn: '60d', category: 'Auto' },
];

// =====================================================
// Available Rewards Programs to Link
// =====================================================
export const AVAILABLE_PROGRAMS = [
  { id: 'p1', name: 'Air Canada Aeroplan', icon: 'airplane', color: '#F01428', type: 'airline' as RewardsAccountType },
  { id: 'p2', name: 'Delta SkyMiles', icon: 'airplane', color: '#003366', type: 'airline' as RewardsAccountType },
  { id: 'p3', name: 'Hilton Honors', icon: 'bed', color: '#002F61', type: 'hotel' as RewardsAccountType },
  { id: 'p4', name: 'Costco Rewards', icon: 'cart', color: '#E31837', type: 'retail' as RewardsAccountType },
  { id: 'p5', name: 'Tim Hortons Rewards', icon: 'cafe', color: '#C8102E', type: 'coffee' as RewardsAccountType },
  { id: 'p6', name: 'Petro-Points', icon: 'flame', color: '#00963F', type: 'gas' as RewardsAccountType },
  { id: 'p7', name: 'Amazon Points', icon: 'logo-amazon', color: '#FF9900', type: 'retail' as RewardsAccountType },
  { id: 'p8', name: 'Best Buy Rewards', icon: 'pricetag', color: '#0046BE', type: 'retail' as RewardsAccountType },
];

// =====================================================
// Helpers
// =====================================================
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return points.toLocaleString('en-US');
  }
  return String(points);
}

export function pointsToCash(points: number, ratePerPoint: number): number {
  return points * ratePerPoint;
}

export function getTotalPointsValue(accounts: RewardsAccount[]): number {
  return accounts.reduce((sum, a) => sum + (a.pointsBalance * a.cashValuePerPoint), 0);
}

export function getTotalPoints(accounts: RewardsAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.pointsBalance, 0);
}
