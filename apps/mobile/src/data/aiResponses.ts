// =====================================================
// AI Banking Assistant - Mock Data & Response Types
// =====================================================
// Rich response card types matching the design screens.
// In production, these would come from the AI backend.
// =====================================================

export type RichCardType =
  | 'account_balance'
  | 'spending_breakdown'
  | 'deposit_funds'
  | 'currency_conversion'
  | 'transfer_money'
  | 'payment_request'
  | 'account_details'
  | 'credit_breakdown'
  | 'loan_repayment'
  | 'card_management'
  | 'recent_transactions'
  | 'savings_pot_creation'
  | 'recurring_deposit'
  | 'spending_categories'
  | 'bank_statement'
  | 'income_spending_insights'
  | 'savings_projection'
  | 'activity_summary'
  | 'financial_resources'
  | 'credit_score'
  | 'nearest_atm';

export interface RichCard {
  type: RichCardType;
  data: Record<string, unknown>;
}

export interface AIChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  richCard?: RichCard;
  audioUrl?: string;
  fileAttachment?: { name: string; size: string; format: string };
}

// Helper
let _msgId = 100;
function mid(): string { return `m${_msgId++}`; }
function ts(): string { return new Date().toISOString(); }

// =====================================================
// MOCK RICH CARD DATA
// =====================================================

export const RICH_CARDS: Record<string, RichCard> = {
  account_balance: {
    type: 'account_balance',
    data: {
      title: 'My Account Balance',
      accountName: 'Personal',
      accountNumber: '****1187',
      balance: 12.08,
      currency: 'USD',
      flag: '\u{1F1FA}\u{1F1F8}',
      date: 'Jun 25, 2025',
      aer: '3.25% AER',
      trend: 'down',
    },
  },
  spending_breakdown: {
    type: 'spending_breakdown',
    data: {
      title: 'Spending',
      period: 'Jan 2025',
      categories: [
        { name: 'Housing', percent: 40, color: '#0EA5E9' },
        { name: 'Bills', percent: 30, color: '#6366F1' },
        { name: 'Grocery', percent: 15, color: '#10B981' },
        { name: 'Other', percent: 15, color: '#F59E0B' },
      ],
      total: 4158.00,
      change: -4.25,
    },
  },
  deposit_funds: {
    type: 'deposit_funds',
    data: {
      title: 'Request Deposit',
      amount: 5.00,
      quickAmounts: [10, 25, 50, 100],
      targetAccount: 'Savings ****8812',
    },
  },
  currency_conversion: {
    type: 'currency_conversion',
    data: {
      title: 'Conversion',
      fromCurrency: 'USD',
      toCurrency: 'GBP',
      fromAmount: 15.00,
      toAmount: 13.01,
      rate: '1 USD = 0.81154 GBP',
      fee: 0.00215,
      speed: 'Instant',
      fromAvailable: 120,
      toAvailable: 0,
    },
  },
  transfer_money: {
    type: 'transfer_money',
    data: {
      title: 'Add New Transfer',
      amount: 50,
      from: 'Savings Account',
      fromAccount: 'SwiftBank Checking ****7784',
      to: 'Julie Andrews',
      toAccount: 'Chase ****7784',
      date: 'Today',
      available: 1257.00,
    },
  },
  payment_request: {
    type: 'payment_request',
    data: {
      title: 'Request Payment',
      recipientName: 'John Paul XXIV',
      recipientBank: 'Chase Checking ****4487',
      to: 'John Paul XXIV',
      amount: 125.00,
      reference: 'Invoice',
      shareOptions: ['Email', 'Copy Link', 'QR Code'],
    },
  },
  account_details: {
    type: 'account_details',
    data: {
      title: 'Account Details',
      accountName: 'Primary Account',
      accountType: 'SwiftBank Checking ****7784',
      accountNumber: '44121977784',
      routingNumber: 'GYXX157',
      amountAvailable: 1250.00,
      availableToUse: 1000.00,
      interestRate: '4.31%',
      type: 'Online Checking',
    },
  },
  credit_breakdown: {
    type: 'credit_breakdown',
    data: {
      title: 'Credit Breakdown',
      creditScore: 775,
      totalAccounts: 4,
      credits: [
        { name: 'Dream Kitchen', balance: 5000.00 },
        { name: 'Student Loan', balance: 10000.00 },
        { name: 'Car Loan', balance: 1254.87 },
        { name: 'Home Renovation', balance: 3115.87 },
      ],
    },
  },
  loan_repayment: {
    type: 'loan_repayment',
    data: {
      title: 'Loan Repayment Schedule',
      loanName: 'Dream Kitchen',
      totalAmount: 5150,
      repaymentNumber: 3,
      totalRepayments: 12,
      leftToPay: 330.00,
    },
  },
  card_management: {
    type: 'card_management',
    data: {
      title: 'My Cards',
      cardName: 'Physical Card',
      lastFour: '7781',
      isLocked: true,
      actions: ['Unlock', 'See Detail', 'More'],
    },
  },
  recent_transactions: {
    type: 'recent_transactions',
    data: {
      title: 'Recent Transactions',
      transactions: [
        { type: 'Deposit', to: 'To Primary ****7781', amount: 55, date: 'Sep 23' },
        { type: 'Deposit', to: 'To Primary ****7781', amount: 40, date: 'Sep 23' },
        { type: 'Withdraw', to: 'To Chase ****8845', amount: -120, date: 'Sep 23' },
        { type: 'Transfer', to: 'To Julia Brown', amount: -75, date: 'Sep 23' },
      ],
    },
  },
  savings_pot_creation: {
    type: 'savings_pot_creation',
    data: {
      title: 'Input Date',
      potName: 'Vacation',
      goalAmount: 5000,
      selectedDate: 'Jan 10, 2026',
    },
  },
  recurring_deposit: {
    type: 'recurring_deposit',
    data: {
      title: 'Input Text',
      amount: 250,
      frequency: 'Monthly',
      nextPaymentDate: 'July 1st',
    },
  },
  spending_categories: {
    type: 'spending_categories',
    data: {
      title: 'Categories',
      categories: [
        { name: 'Health', icon: 'heart' },
        { name: 'Family', icon: 'people' },
        { name: 'Utility', icon: 'flash' },
        { name: 'Hobby', icon: 'musical-notes' },
        { name: 'Other', icon: 'ellipsis-horizontal' },
        { name: 'Transport', icon: 'car' },
        { name: 'Grocery', icon: 'cart' },
      ],
    },
  },
  bank_statement: {
    type: 'bank_statement',
    data: {
      title: 'File Download',
      fileName: 'Swiftbank Primary',
      description: 'Account Statement Nov 2025',
      size: '251kb',
      format: 'PDF Format',
    },
  },
  income_spending_insights: {
    type: 'income_spending_insights',
    data: {
      title: 'Spending Insights',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      income: [3800, 4200, 4000, 3900, 4100, 4300, 4500],
      spending: [3200, 3500, 3100, 3800, 3300, 3600, 3400],
      gap: -500,
    },
  },
  savings_projection: {
    type: 'savings_projection',
    data: {
      title: 'Saving Projection',
      currentAge: 48,
      projectedAge: 70,
      apr: 4.5,
      projectedAmount: 1057088.00,
      yearsToGrow: 20,
      avgReturn: 7,
      currentBalance: 515112,
    },
  },
  activity_summary: {
    type: 'activity_summary',
    data: {
      title: 'Activity Summary',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      withdrawals: [200, 150, 300, 100, 250, 180, 220],
      deposits: [350, 200, 100, 400, 150, 300, 445],
    },
  },
  financial_resources: {
    type: 'financial_resources',
    data: {
      title: 'Resources',
      items: [
        { name: 'The Intelligent Investor', type: 'Book', detail: '158pg', icon: 'book' },
        { name: 'Investing For Bros', type: 'Website', detail: 'www.broinvest.com', icon: 'globe' },
        { name: 'InvestDaily', type: 'Podcast', detail: '125 episodes', icon: 'headset' },
      ],
    },
  },
  credit_score: {
    type: 'credit_score',
    data: {
      title: 'Credit Score',
      score: 780,
      rating: 'Excellent',
      maxScore: 850,
      nextUpdate: '31 days',
    },
  },
  nearest_atm: {
    type: 'nearest_atm',
    data: {
      title: 'Nearest ATM',
      bankName: 'Wells Fargo ATM',
      address: '123 Main Street',
      distance: '0.5 miles away',
    },
  },
};

// =====================================================
// MOCK CONVERSATION PATTERNS
// =====================================================

export interface ConversationPattern {
  keywords: string[];
  response: string;
  richCardKey?: string;
}

export const CONVERSATION_PATTERNS: ConversationPattern[] = [
  {
    keywords: ['who are you', 'hello', 'hi', 'hey'],
    response: 'Hello there! I\u2019m your personal AI Money manager and intelligent banking assistant. How can I help you today? \uD83D\uDE00',
  },
  {
    keywords: ['balance', 'how much money', 'account balance'],
    response: 'Certainly! Here is a detailed breakdown of your personal swiftbank balance.',
    richCardKey: 'account_balance',
  },
  {
    keywords: ['spending', 'breakdown', 'what did i spend', 'expenses'],
    response: 'Of course! Here is a detailed breakdown of your account balance, with housing as most expensive category.',
    richCardKey: 'spending_breakdown',
  },
  {
    keywords: ['deposit', 'put money', 'add funds'],
    response: 'Got it! Please specify the amount of fund that you will need to deposit.',
    richCardKey: 'deposit_funds',
  },
  {
    keywords: ['exchange', 'convert', 'currency', 'gbp', 'eur'],
    response: 'Certainly! Please confirm your conversion action below',
    richCardKey: 'currency_conversion',
  },
  {
    keywords: ['transfer', 'send money', 'pay friend'],
    response: 'Got it! Here\u2019s the summary of the new transaction:',
    richCardKey: 'transfer_money',
  },
  {
    keywords: ['payment request', 'invoice', 'request money'],
    response: 'Of course! Here is the payment request of $125 to John Paul.',
    richCardKey: 'payment_request',
  },
  {
    keywords: ['account details', 'account number', 'routing'],
    response: 'Most certainly! Here are the details for your primary account.',
    richCardKey: 'account_details',
  },
  {
    keywords: ['credit', 'loan', 'debt', 'owe'],
    response: 'Certainly, John! Here are all of your credit & loan breakdown. Would you like tips on how to manage your credit?',
    richCardKey: 'credit_breakdown',
  },
  {
    keywords: ['repayment', 'loan schedule', 'payment schedule'],
    response: 'Most certainly! Here is your repayment schedule for your "Dream Kitchen" loan.',
    richCardKey: 'loan_repayment',
  },
  {
    keywords: ['freeze', 'lock', 'card', 'block card'],
    response: 'Of course, John! Consider it done! \u2744\uFE0F Let me know if you need any assistance!',
    richCardKey: 'card_management',
  },
  {
    keywords: ['transactions', 'recent', 'history', 'activity'],
    response: 'Got it! Here\u2019s your 5 most recent transactions sorted by category.',
    richCardKey: 'recent_transactions',
  },
  {
    keywords: ['savings pot', 'create pot', 'new pot', 'vacation'],
    response: 'Of course! When do you plan to go on vacation? Please specify the date or month! \u2708\uFE0F\uD83C\uDF34',
    richCardKey: 'savings_pot_creation',
  },
  {
    keywords: ['recurring', 'auto deposit', 'monthly deposit', 'automatic'],
    response: 'Certainly! How much contribution will you make each for your savings?',
    richCardKey: 'recurring_deposit',
  },
  {
    keywords: ['categories', 'spending categories', 'sectors'],
    response: 'Certainly! Here are your highest spending categories for this month.',
    richCardKey: 'spending_categories',
  },
  {
    keywords: ['statement', 'export', 'download', 'csv', 'pdf'],
    response: 'Of course! Please see the attached .csv files that includes your bank account statement in November 2025. \uD83D\uDCBC',
    richCardKey: 'bank_statement',
  },
  {
    keywords: ['income', 'spending stats', 'monthly stats'],
    response: 'Hey there! \uD83D\uDE00 I\u2019d be happy to help with that. Here\u2019s a quick look at your income and spending for the month so far:',
    richCardKey: 'income_spending_insights',
  },
  {
    keywords: ['savings projection', 'retirement', 'performance', 'return'],
    response: 'Your saving account is performing well! You\u2019re currently seeing an 4.5% APR so far this year! \uD83D\uDCB0\uD83D\uDCC8',
    richCardKey: 'savings_projection',
  },
  {
    keywords: ['activity insight', 'weekly activity', 'summary'],
    response: 'Of course! Here\u2019s a snapshot of your activity insights for the month \uD83D\uDCCA:',
    richCardKey: 'activity_summary',
  },
  {
    keywords: ['resources', 'books', 'learn', 'finance education', 'investing books'],
    response: 'Certainly! Here are several investing books that are best suited for beginner investors!',
    richCardKey: 'financial_resources',
  },
  {
    keywords: ['credit score', 'fico', 'score'],
    response: 'Absolutely, I\u2019ve got your credit score details right here! \u2B50',
    richCardKey: 'credit_score',
  },
  {
    keywords: ['atm', 'nearest', 'cash', 'withdraw nearby'],
    response: 'Certainly! There\u2019s a close Wells Fargo ATM at 123 main street!',
    richCardKey: 'nearest_atm',
  },
];

// =====================================================
// Chat Settings Types
// =====================================================

export type AIModelOption = 'GPT' | 'LLama' | 'Perplexity' | 'Gemini';

export interface ChatSettings {
  aiModel: AIModelOption;
  customInstructions: string;
  shareData: boolean;
  adaptiveMemory: string;
  suggestInsights: {
    spendingRecommendations: boolean;
    budgetInsights: boolean;
    savingsTips: boolean;
    newsResources: boolean;
    budgetReminders: boolean;
  };
  nickname: string;
  voiceSelection: string;
  languagePreference: string;
  avatarIcon: string;
  responseType: 'Neutral' | 'Motivating';
  dataSharing: boolean;
  chatsLeft: number;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  aiModel: 'GPT',
  customInstructions: '',
  shareData: true,
  adaptiveMemory: '',
  suggestInsights: {
    spendingRecommendations: false,
    budgetInsights: true,
    savingsTips: false,
    newsResources: true,
    budgetReminders: false,
  },
  nickname: 'AI',
  voiceSelection: 'Caucasian Male (Peter)',
  languagePreference: 'English (United States)',
  avatarIcon: 'sparkles',
  responseType: 'Neutral',
  dataSharing: false,
  chatsLeft: 251,
};

// =====================================================
// Helper: match user message to a response pattern
// =====================================================
export function matchPattern(userText: string): ConversationPattern | null {
  const lower = userText.toLowerCase();
  for (const pattern of CONVERSATION_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return pattern;
    }
  }
  return null;
}

export function generateAIResponse(userText: string): AIChatMsg {
  const pattern = matchPattern(userText);
  if (pattern) {
    const richCard = pattern.richCardKey ? RICH_CARDS[pattern.richCardKey] : undefined;
    return {
      id: mid(),
      role: 'assistant',
      text: pattern.response,
      timestamp: ts(),
      richCard,
    };
  }
  return {
    id: mid(),
    role: 'assistant',
    text: 'I can help you with:\n\n\u2022 Account balances & details\n\u2022 Spending analysis & categories\n\u2022 Deposits, transfers & payments\n\u2022 Currency conversion\n\u2022 Credit & loan info\n\u2022 Card management\n\u2022 Savings pots & projections\n\u2022 Transaction history\n\u2022 Financial resources\n\u2022 Credit score\n\u2022 Find nearest ATM\n\nWhat would you like to explore?',
    timestamp: ts(),
  };
}
