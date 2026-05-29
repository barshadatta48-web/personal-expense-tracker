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
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Wallet, 
  BarChart3, 
  ListOrdered, 
  Compass, 
  Target, 
  PiggyBank, 
  Sparkles, 
  ShieldCheck
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
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-800 antialiased font-sans flex flex-col justify-between">
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-950 text-zinc-100 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-md font-display font-medium text-zinc-900 tracking-tight flex items-center gap-1.5 leading-none">
              Personal Expense Tracker
            </h1>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mt-0.5">Premium Finance Suite</p>
          </div>
        </div>

        {/* Global Controls & Currency Switcher pill bar */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex items-center bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-200/20 gap-0.5" id="currency-switcher">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                id={`currency-btn-${c.code.toLowerCase()}`}
                onClick={() => setCurrencyByCode(c.code)}
                title={c.label}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-md font-mono transition-all uppercase cursor-pointer ${
                  currency.code === c.code
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>{c.symbol}</span> <span className="hidden sm:inline ml-0.5">{c.code}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/55 rounded-full text-[10px] font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>Secure Cloud Active</span>
          </div>
        </div>
      </header>

      {/* 2. Main Tab View Layout container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
         {/* Navigation Selector Tabs row */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-200/40 scrollbar-none shrink-0" id="main-navigation-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'budgets'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 shrink-0" />
            <span>Budgets</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'goals'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>Savings Goals</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer shrink-0 border ${
              activeTab === 'advisor'
                ? 'bg-emerald-950 border-emerald-900 text-emerald-100 shadow-xs'
                : 'text-emerald-800 bg-emerald-50/50 border-emerald-200/40 hover:bg-emerald-100/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
            <span>AI Advisor</span>
          </button>
        </div>

        {/* Tab Selection Feeds render with premium animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="focus-mode-view"
          >
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4">
                  <div className="sticky top-24 space-y-4">
                    <div className="bg-[#0B0F17] text-[#EDEFEF] p-5 rounded-2xl border border-zinc-800/80 shadow-md">
                      <h3 className="text-xs font-bold tracking-widest uppercase font-mono mb-2 text-[#94A3B8]">Instructions</h3>
                      <p className="text-xs leading-relaxed text-zinc-400 font-light">
                        Use the form below to register new cash items manually, or try the <span className="text-emerald-400 font-medium">AI Scanner</span> to parse receipt snapshots, texts, or unstructured messages in one tap.
                      </p>
                    </div>
                    <TransactionForm onAddTransaction={handleAddTransaction} />
                  </div>
                </div>
                <div className="lg:col-span-8">
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Global Footer */}
      <footer className="w-full bg-white border-t border-zinc-200/50 py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-sans">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-zinc-500 uppercase tracking-widest text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded">EXECUTIVE VAULT</span>
            <span>•</span>
            <span>Client-isolated ledger. All transactions persist on your local device.</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>AI powered by Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
