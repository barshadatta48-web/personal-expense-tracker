import React, { useState, useEffect } from 'react';
import { Transaction, Budget, FinancialGoal } from './types';
import { useCurrency, CURRENCIES } from './contexts/CurrencyContext';
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
  Github 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'transactions' | 'budgets' | 'goals' | 'advisor'>('dashboard');
  const { currency, setCurrencyByCode } = useCurrency();

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
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Track your daily income & expenses</p>
          </div>
        </div>

        {/* Global Controls & Currency Switcher pill bar */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-0.5" id="currency-switcher">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                id={`currency-btn-${c.code.toLowerCase()}`}
                onClick={() => setCurrencyByCode(c.code)}
                title={c.label}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg font-mono transition-all uppercase cursor-pointer ${
                  currency.code === c.code
                    ? 'bg-white text-emerald-700 shadow-2xs border border-gray-200/40'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <span>{c.symbol}</span> <span className="hidden sm:inline">{c.code}</span>
              </button>
            ))}
          </div>

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
            <span>Dashboard</span>
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
            <span>Charts</span>
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
            <span>Transactions</span>
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
            <span>Budgets</span>
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
            <span>AI Advisor</span>
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
            />
          )}

          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs">
                    <h3 className="text-sm font-bold tracking-wide uppercase font-sans mb-1.5 opacity-90">Quick Summary</h3>
                    <p className="text-xs leading-relaxed opacity-85">Type in your transaction manually or use the AI text scanner to write or paste details in a single sentence.</p>
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
            <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Secure Tracker</span>
            <span>•</span>
            <span>Your data is saved directly on your device.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
