import React, { useState, useEffect } from 'react';
import { Transaction, Budget, FinancialGoal } from './types';
import UserDashboard from './components/UserDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import BudgetManager from './components/BudgetManager';
import FinancialGoalsManager from './components/FinancialGoalsManager';
import FinancialAdvisor from './components/FinancialAdvisor';
import { 
  DollarSign, 
  Wallet, 
  BarChart3, 
  ListOrdered, 
  Compass, 
  Target, 
  PiggyBank, 
  Sparkles, 
  Github, 
  RefreshCw 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'transactions' | 'budgets' | 'goals' | 'advisor'>('dashboard');

  // Load state from local storage or declare default empty state (No fallback demo data)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('expense_tracker_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('expense_tracker_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('expense_tracker_goals');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state back to client localStorage
  useEffect(() => {
    localStorage.setItem('expense_tracker_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('expense_tracker_goals', JSON.stringify(goals));
  }, [goals]);

  // Handle adding transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const id = 'tx-' + Date.now();
    const transaction: Transaction = { id, ...newTx };
    setTransactions((prev) => [transaction, ...prev]);
  };

  // Handle deleting transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle updating transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  // Import transactions fully replacement or merge
  const handleImportTransactions = (imported: Transaction[]) => {
    setTransactions((prev) => {
      const merged = [...imported, ...prev];
      // remove duplicate ids
      const unique = merged.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );
      return unique;
    });
  };

  // Handle saving budgets limit
  const handleSetBudgetLimit = (category: string, limit: number) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === category);
      if (exists) {
        return prev.map((b) => (b.category === category ? { ...b, limit } : b));
      } else {
        return [...prev, { category, limit }];
      }
    });
  };

  // Savings Goal Targets
  const handleAddGoal = (name: string, targetAmount: number, deadline?: string) => {
    const goal: FinancialGoal = {
      id: 'goal-' + Date.now(),
      name,
      targetAmount,
      currentAmount: 0,
      deadline
    };
    setGoals((prev) => [...prev, goal]);
  };

  const handleUpdateGoalProgress = (id: string, amountToAdd: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextAmt = Math.max(0, g.currentAmount + amountToAdd);
          return { ...g, currentAmount: nextAmt };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Set beautiful simulated sandbox data to demonstrate capabilities on click
  const prefillSampleData = () => {
    const today = new Date();
    const formatOffsetDate = (offsetDays: number) => {
      const d = new Date();
      d.setDate(today.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    const dummyTxs: Transaction[] = [
      // Salary / Income
      { id: 'tx-s-1', amount: 4800, date: formatOffsetDate(25), description: 'Bi-weekly Corporate salary deposit', category: 'Salary & Wages', type: 'income', notes: 'Electronic transfer' },
      { id: 'tx-s-2', amount: 350, date: formatOffsetDate(21), description: 'Mobile App Freelance contract', category: 'Freelance & Consulting', type: 'income', tags: ['freelance', 'tech'] },
      { id: 'tx-s-3', amount: 95, date: formatOffsetDate(18), description: 'Stock Dividend reinvest', category: 'Investments & Dividends', type: 'income' },
      { id: 'tx-s-4', amount: 4800, date: formatOffsetDate(11), description: 'Bi-weekly Corporate salary deposit', category: 'Salary & Wages', type: 'income', notes: 'Electronic transfer' },
      { id: 'tx-s-5', amount: 150, date: formatOffsetDate(5), description: 'Design assets freelance payout', category: 'Freelance & Consulting', type: 'income' },

      // Expenses
      { id: 'tx-e-1', amount: 1650, date: formatOffsetDate(27), description: 'Apartment monthly rent', category: 'Housing & Rent', type: 'expense', notes: 'Auto-debit setup' },
      { id: 'tx-e-2', amount: 84.50, date: formatOffsetDate(24), description: 'Whole Foods Market grocery haul', category: 'Food & Beverage', type: 'expense', tags: ['weekly-groceries'] },
      { id: 'tx-e-3', amount: 15.99, date: formatOffsetDate(22), description: 'Spotify Premium music', category: 'Utilities & Bills', type: 'expense' },
      { id: 'tx-e-4', amount: 45.20, date: formatOffsetDate(20), description: 'Gas station fuel fill-up', category: 'Transportation', type: 'expense' },
      { id: 'tx-e-5', amount: 120.30, date: formatOffsetDate(19), description: 'Nike air sneakers', category: 'Shopping', type: 'expense', tags: ['apparel'] },
      { id: 'tx-e-6', amount: 28.40, date: formatOffsetDate(16), description: 'Ramen dining with colleagues', category: 'Food & Beverage', type: 'expense', tags: ['dinner'] },
      { id: 'tx-e-7', amount: 110, date: formatOffsetDate(14), description: 'Household electricity & internet bill', category: 'Utilities & Bills', type: 'expense', notes: 'Comcast and PG&E' },
      { id: 'tx-e-8', amount: 75.00, date: formatOffsetDate(12), description: 'Barbecue Grill party catering', category: 'Entertainment & Leisure', type: 'expense' },
      { id: 'tx-e-9', amount: 35.50, date: formatOffsetDate(9), description: 'Local Ride Uber', category: 'Transportation', type: 'expense' },
      { id: 'tx-e-10', amount: 43.10, date: formatOffsetDate(7), description: 'Amazon basic Kindle accessories', category: 'Shopping', type: 'expense' },
      { id: 'tx-e-11', amount: 65, date: formatOffsetDate(4), description: 'Movie theater tickets & snack box', category: 'Entertainment & Leisure', type: 'expense', tags: ['weekend'] },
      { id: 'tx-e-12', amount: 92.40, date: formatOffsetDate(2), description: 'Bistro restaurant wine reservation', category: 'Food & Beverage', type: 'expense', tags: ['anniversary'] },
      { id: 'tx-e-13', amount: 1500, date: formatOffsetDate(1), description: 'Vanguard core index tracking fund ETF buy', category: 'Investments & Dividends', type: 'expense', notes: 'Automated deposit allocation' }
    ];

    setTransactions(dummyTxs);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-gray-800 antialiased font-sans flex flex-col justify-between">
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-emerald-200 shadow-lg shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              Personal Expense Tracker
            </h1>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Secure Native Sandbox Ledger</p>
          </div>
        </div>

        {/* Global prefill sandbox data btn */}
        <div className="flex items-center gap-3">
          {transactions.length === 0 && (
            <button
              onClick={prefillSampleData}
              title="Add sandbox seed records"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-sans font-semibold text-xs rounded-xl transition duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Prefill Sandboxed Core
            </button>
          )}
          <span className="text-slate-300 font-sans hidden sm:inline text-xs">| Connected</span>
        </div>
      </header>

      {/* 2. Main Tab View Layout container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Navigation Selector Tabs row */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 pb-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>User Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Analytics & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <ListOrdered className="w-4 h-4 shrink-0" />
            <span>Transactions Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 ${
              activeTab === 'budgets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <PiggyBank className="w-4 h-4 shrink-0" />
            <span>Spend Budgets</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 ${
              activeTab === 'goals'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Target className="w-4 h-4 shrink-0" />
            <span>Savings Goals</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all shrink-0 border ${
              activeTab === 'advisor'
                ? 'bg-emerald-600 text-white border-transparent'
                : 'text-emerald-700 bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
            <span>AI Financial Advisor</span>
          </button>
        </div>

        {/* Tab Selection Feeds render */}
        <div className="focus-mode-view">
          {activeTab === 'dashboard' && (
            <UserDashboard
              transactions={transactions}
              budgets={budgets}
              goals={goals}
              onNavigate={setActiveTab}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard 
              transactions={transactions} 
              onAddSampleData={prefillSampleData} 
            />
          )}

          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs">
                    <h3 className="text-sm font-bold tracking-wide uppercase font-sans mb-1.5 opacity-90">Quick Action Summary</h3>
                    <p className="text-xs leading-relaxed opacity-85">Record a transaction manually or toggle the AI Quick-Paste scanner above the form to translate invoices in seconds.</p>
                  </div>
                  <TransactionForm onAddTransaction={handleAddTransaction} />
                </div>
              </div>
              <div className="lg:col-span-2">
                <TransactionList 
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                  onImportTransactions={handleImportTransactions}
                />
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <BudgetManager 
              transactions={transactions}
              budgets={budgets}
              onSetBudgetLimit={handleSetBudgetLimit}
            />
          )}

          {activeTab === 'goals' && (
            <FinancialGoalsManager 
              goals={goals}
              onAddGoal={handleAddGoal}
              onUpdateGoalProgress={handleUpdateGoalProgress}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === 'advisor' && (
            <FinancialAdvisor 
              transactions={transactions}
              budgets={budgets}
              goals={goals}
            />
          )}
        </div>
      </main>

      {/* 3. Global Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-sans">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Secure Ledger</span>
            <span>•</span>
            <span>Isolated local client storage for financial logs privacy protection.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by Gemini 3.5 Flash Cognitive Services</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
