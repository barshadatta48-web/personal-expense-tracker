export interface Transaction {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: 'income' | 'expense';
  notes?: string;
  tags?: string[];
}

export interface Budget {
  category: string;
  limit: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface QuickTemplate {
  id: string;
  label: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category: string;
  notes?: string;
  tags?: string[];
}

export interface InsightCard {
  id: string;
  title: string;
  type: 'warning' | 'tip' | 'success' | 'alert';
  message: string;
  category?: string;
}

export const CATEGORIES = {
  expense: [
    'Food & Beverage',
    'Shopping',
    'Housing & Rent',
    'Transportation',
    'Utilities & Bills',
    'Entertainment & Leisure',
    'Healthcare & Insurance',
    'Education',
    'Travel',
    'Gifts & Donations',
    'Miscellaneous Expense'
  ],
  income: [
    'Salary & Wages',
    'Freelance & Consulting',
    'Investments & Dividends',
    'Business Revenue',
    'Gifts & Grants',
    'Refunds',
    'Miscellaneous Income'
  ]
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Beverage': '#F59E0B', // Amber
  'Shopping': '#EC4899', // Pink
  'Housing & Rent': '#3B82F6', // Blue
  'Transportation': '#8B5CF6', // Purple
  'Utilities & Bills': '#06B6D4', // Cyan
  'Entertainment & Leisure': '#10B981', // Emerald
  'Healthcare & Insurance': '#EF4444', // Red
  'Education': '#F97316', // Orange
  'Travel': '#14B8A6', // Teal
  'Gifts & Donations': '#6366F1', // Indigo
  'Miscellaneous Expense': '#6B7280', // Gray
  'Salary & Wages': '#10B981', // Emerald
  'Freelance & Consulting': '#34D399', // Light Emerald
  'Investments & Dividends': '#60A5FA', // Light Blue
  'Business Revenue': '#A7F3D0', // Mint
  'Gifts & Grants': '#F472B6', // Light Pink
  'Refunds': '#FBBF24', // Yellow
  'Miscellaneous Income': '#9CA3AF' // Light Gray
};
