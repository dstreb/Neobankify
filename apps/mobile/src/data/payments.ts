// =====================================================
// Payments & Transactions Mock Data
// =====================================================

export interface Recipient {
  id: string;
  name: string;
  initials: string;
  category: 'Friends & Family' | 'Business' | 'Other';
  bankName: string;
  lastFour: string;
  trusted: boolean;
  transactionCount: number;
}

export interface BankInstitution {
  id: string;
  name: string;
  icon: string;
  lastFour: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  frequency: string;
  amount: number;
  icon: string;
}

export interface PaymentRequest {
  id: string;
  recipientName: string;
  recipientInitials: string;
  amount: number;
  status: 'active' | 'inactive';
  description: string;
}

export interface Currency {
  code: string;
  name: string;
  flag: string;
  rate: number; // rate relative to USD
}

export type PaymentCategory =
  | 'Personal Care'
  | 'Bills'
  | 'Cash'
  | 'Charity'
  | 'Entertainment'
  | 'Family'
  | 'Travel'
  | 'Transport'
  | 'Education'
  | 'Dining Out'
  | 'Groceries'
  | 'Other';

// =====================================================
// Mock Data
// =====================================================

export const MOCK_RECIPIENTS: Recipient[] = [
  { id: '1', name: 'Freddy Mercury', initials: 'FM', category: 'Friends & Family', bankName: 'Chase', lastFour: '8815', trusted: true, transactionCount: 184 },
  { id: '2', name: 'Amos Gonzales', initials: 'AG', category: 'Friends & Family', bankName: 'Wells Fargo', lastFour: '1125', trusted: false, transactionCount: 42 },
  { id: '3', name: 'Christie Frederica', initials: 'CF', category: 'Business', bankName: 'TD Bank', lastFour: '4487', trusted: false, transactionCount: 15 },
  { id: '4', name: 'Alexander Bell', initials: 'AB', category: 'Other', bankName: 'TD Bank', lastFour: '4487', trusted: false, transactionCount: 8 },
  { id: '5', name: 'Bilbo Baggins', initials: 'BB', category: 'Friends & Family', bankName: 'TD Bank', lastFour: '8815', trusted: true, transactionCount: 27 },
];

export const MOCK_BANK_INSTITUTIONS: BankInstitution[] = [
  { id: '1', name: 'CHASE BANK EUROPA', icon: 'business', lastFour: '8815' },
  { id: '2', name: 'WELLS FARGO USA', icon: 'business', lastFour: '8815' },
  { id: '3', name: 'AMERITRADE GLOBAL', icon: 'business', lastFour: '8815' },
  { id: '4', name: 'BANK OF AMERICA 78', icon: 'business', lastFour: '8815' },
];

export const MOCK_RECURRING_PAYMENTS: RecurringPayment[] = [
  { id: '1', name: 'Bills & Electricity', frequency: 'Every 3rd, Monthly', amount: 5000, icon: 'flash' },
  { id: '2', name: 'Housing', frequency: 'Every 3rd, Monthly', amount: 5000, icon: 'home' },
];

export const MOCK_PAYMENT_REQUESTS: PaymentRequest[] = [
  { id: '1', recipientName: 'Freddy Mercury', recipientInitials: 'FM', amount: 250.00, status: 'active', description: 'Pending' },
];

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', flag: '\u{1F1FA}\u{1F1F8}', rate: 1.0 },
  { code: 'EUR', name: 'European Euro', flag: '\u{1F1EA}\u{1F1FA}', rate: 0.85 },
  { code: 'JPY', name: 'Japanese Yen', flag: '\u{1F1EF}\u{1F1F5}', rate: 149.5 },
  { code: 'GBP', name: 'Great British Pounds', flag: '\u{1F1EC}\u{1F1E7}', rate: 0.79 },
  { code: 'SGD', name: 'Singapore Dollar', flag: '\u{1F1F8}\u{1F1EC}', rate: 1.34 },
  { code: 'RUB', name: 'Russian Ruble', flag: '\u{1F1F7}\u{1F1FA}', rate: 92.5 },
];

export const PAYMENT_CATEGORIES: { label: PaymentCategory; icon: string }[] = [
  { label: 'Personal Care', icon: 'medkit' },
  { label: 'Bills', icon: 'receipt' },
  { label: 'Cash', icon: 'cash' },
  { label: 'Charity', icon: 'heart' },
  { label: 'Entertainment', icon: 'game-controller' },
  { label: 'Family', icon: 'people' },
  { label: 'Travel', icon: 'airplane' },
  { label: 'Transport', icon: 'bus' },
  { label: 'Education', icon: 'school' },
  { label: 'Dining Out', icon: 'restaurant' },
  { label: 'Groceries', icon: 'cart' },
  { label: 'Other', icon: 'ellipsis-horizontal' },
];

export const DEPOSIT_METHODS = [
  { id: 'bank', label: 'Bank Transfer', description: 'Transfer through bank institution', icon: 'business' },
  { id: 'epayment', label: 'E-Payment', description: 'Apple Pay, Stripe, Google Pay', icon: 'phone-portrait' },
  { id: 'debit', label: 'Debit Card', description: 'Visa, Mastercard, 12+ others', icon: 'card' },
];

export const REPEAT_OPTIONS = ['Daily', 'Every Week', 'Every Month', 'Every Year'];
