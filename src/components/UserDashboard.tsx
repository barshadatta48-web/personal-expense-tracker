import React, { useMemo } from 'react';
import { Transaction, Budget, FinancialGoal, QuickTemplate } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PiggyBank, 
  Sparkles, 
  ListOrdered, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  PlusSquare,
  AlertTriangle
} from 'lucide-react';

interface UserDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  onNavigate: (tab: 'dashboard' | 'analytics' | 'transactions' | 'budgets' | 'goals' | 'advisor') => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function UserDashboard({ 
  transactions, 
  budgets, 
  goals, 
  onNavigate,
  onAddTransaction 
}: UserDashboardProps) {

  const { formatRaw } = useCurrency();

  // Personalized user greeting based on the email domain prefix or name
  const userGreetingName = "Barsha";


  // Calculate high-level financial stats
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRatio = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRatio,
      categoryTotals
    };
  }, [transactions]);

  // Find recent transactions (last 4 records)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  // Find priority savings goals
  const activeSavingMilestones = useMemo(() => {
    return goals.slice(0, 3);
  }, [goals]);

  // Find budgets near limits
  const criticalBudgets = useMemo(() => {
    const expensesMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expensesMap[t.category] = (expensesMap[t.category] || 0) + Number(t.amount);
      }
    });

    return budgets.map(b => {
      const spent = expensesMap[b.category] || 0;
      const ratio = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return {
        category: b.category,
        limit: b.limit,
        spent,
        ratio,
        isExceeded: spent > b.limit
      };
    }).sort((a, b) => b.ratio - a.ratio).slice(0, 3);
  }, [budgets, transactions]);

  // Load real quick template shortcuts from local storage
  const templates = useMemo<QuickTemplate[]>(() => {
    const saved = localStorage.getItem('expense_tracker_quick_templates');
    return saved ? JSON.parse(saved) : [];
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* 1. Header Welcome & Persona Brief */}
      <div className="relative overflow-hidden bg-emerald-950 text-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-900 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/50 border border-emerald-700/65 rounded-full text-[11px] font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Personal Finance Overview
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-medium leading-tight">
            Welcome back, <span className="font-bold underline decoration-emerald-400 decoration-2">{userGreetingName}</span>.
          </h2>
          <p className="text-sm text-emerald-200/80 max-w-xl font-sans font-light">
            See your spending, budgets, and savings goals at a glance below.
          </p>
        </div>

        {/* Advisor direct link banner action button */}
        <button 
          onClick={() => onNavigate('advisor')}
          className="relative z-10 self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl font-display font-semibold text-xs active:scale-95 transition-all shadow-md shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> Ask AI Advisor
        </button>

        {/* Graphic decoration */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-emerald-800/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top Metric Cards Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Pool */}
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs hover:border-emerald-200 transition-all duration-250 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">
              <span>Total Balance</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-display font-bold text-gray-800 mt-4">
              {formatRaw(metrics.netBalance)}
            </h3>
          </div>
          <p className={`text-xs mt-3 font-medium ${metrics.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.netBalance >= 0 
              ? `You have a surplus of ${formatRaw(metrics.netBalance)}` 
              : `You spent ${formatRaw(Math.abs(metrics.netBalance))} more than you earned`
            }
          </p>
        </div>

        {/* Outflows */}
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs hover:border-emerald-200 transition-all duration-250 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">
              <span>Total Expenses</span>
              <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-display font-bold text-gray-800 mt-4">
              {formatRaw(metrics.totalExpense)}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-sans">
            How much you spent this month on everything.
          </p>
        </div>

        {/* Savings Efficiency Rate */}
        <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs hover:border-emerald-200 transition-all duration-250 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">
              <span>Savings Rate</span>
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-display font-bold text-gray-800 mt-4">
              {metrics.savingsRatio.toFixed(1)}%
            </h3>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${metrics.savingsRatio > 25 ? 'bg-emerald-500' : metrics.savingsRatio > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, metrics.savingsRatio))}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 font-sans">
              Aim to save at least 20% of your earnings.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Executive Workstation Bento Grid Column split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column: Quick Actions and Recent transactions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Subcard A: Instant Log templates shortcuts */}
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 font-sans tracking-wide uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Quick Templates</span>
              </h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">Click a shortcut to quickly add a transaction for today.</p>
            </div>

            {templates.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans">
                <p className="font-semibold text-gray-500">No templates created yet.</p>
                <p className="text-[10px] text-gray-400 max-w-sm mx-auto mt-0.5">Create templates on the Transactions tab to quickly add them here with one click.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.slice(0, 4).map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      onAddTransaction({
                        amount: act.amount, // base USD
                        description: act.description,
                        category: act.category,
                        type: act.type,
                        date: new Date().toISOString().split('T')[0],
                        notes: act.notes,
                        tags: act.tags
                      });
                      alert(`Added "${act.label}" successfully!`);
                    }}
                    className="p-3.5 bg-gray-50/50 hover:bg-emerald-50/15 border border-gray-100 hover:border-emerald-200 outline-hidden font-medium text-left rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-700 group-hover:text-emerald-700 truncate">{act.label}</div>
                      <div className="text-[10px] text-gray-400 truncate">{act.category}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-gray-800">{formatRaw(act.amount)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bento Subcard B: Real-time Recent Activity feed */}
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 font-display tracking-wide uppercase flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-emerald-600" />
                  <span>Recent Transactions</span>
                </h3>
                <p className="text-xs text-gray-400 font-sans mt-0.5">Your most recent transactions</p>
              </div>
              <button 
                onClick={() => onNavigate('transactions')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-0.5"
              >
                <span>See All</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans">
                <p className="font-semibold text-gray-600">No transactions yet.</p>
                <p className="text-[10px] text-gray-400 max-w-xs mx-auto mt-1">Go to the Transactions tab to add some, or use a template shortcut.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/60 font-sans">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-800 truncate">{tx.description}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-gray-800'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRaw(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Capital Milestones and budget tracker gauges */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Capital targets (Goals) widget */}
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs flex flex-col justify-between h-full max-h-[300px] lg:max-h-none overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 font-display tracking-wide uppercase flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Savings Goals</span>
                  </h3>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">Track your savings goals</p>
                </div>
                <button 
                  onClick={() => onNavigate('goals')}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-0.5"
                >
                  <PlusSquare className="w-4 h-4" />
                </button>
              </div>

              {activeSavingMilestones.length === 0 ? (
                <div className="py-8 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans">
                  No active savings goals yet.
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {activeSavingMilestones.map((g) => {
                    const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                    return (
                      <div key={g.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 truncate">{g.name}</span>
                          <span className="font-semibold text-gray-500 shrink-0">
                            {formatRaw(g.currentAmount, 0)} of {formatRaw(g.targetAmount, 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-50 mt-4 text-[11px] text-gray-400 leading-relaxed font-sans">
              Add money to your savings goals to hit your targets faster.
            </div>
          </div>

          {/* Spend Budgets (near critical) widget */}
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 font-display tracking-wide uppercase flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-emerald-600" />
                  <span>Monthly Budgets</span>
                </h3>
                <p className="text-xs text-gray-400 font-sans mt-0.5">Track category spending limits</p>
              </div>
              <button 
                onClick={() => onNavigate('budgets')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Set Budgets
              </button>
            </div>

            {criticalBudgets.length === 0 ? (
              <div className="py-8 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans">
                No budget limits set up yet.
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {criticalBudgets.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700 truncate">{item.category}</span>
                      <span className={`font-semibold shrink-0 ${item.isExceeded ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>
                        {formatRaw(item.spent, 0)} / {formatRaw(item.limit, 0)} ({item.ratio.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${item.ratio >= 100 ? 'bg-rose-50' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, item.ratio)}%` }}
                      />
                    </div>
                    {item.isExceeded && (
                      <div className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 py-0.5 px-2 rounded-md">
                        <AlertTriangle className="w-3 h-3 text-rose-500" /> Over budget!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
