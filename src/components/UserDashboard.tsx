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

  const [notification, setNotification] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
      {/* 0. Custom Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in text-xs max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-white">Record Logged</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{notification}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-500 hover:text-zinc-200 ml-2 font-bold font-mono">×</button>
        </div>
      )}

      {/* 1. Header Welcome & Persona Brief */}
      <div className="relative overflow-hidden bg-zinc-950 text-white p-6 sm:p-8 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800/85 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Executive Workspace
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-medium leading-tight">
            Welcome back, <span className="font-bold text-white underline decoration-emerald-500 decoration-2">{userGreetingName}</span>.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-sans font-light">
            Insights updated in real time. Access currency settings and track cashflow velocity below.
          </p>
        </div>

        {/* Advisor direct link banner action button */}
        <button 
          onClick={() => onNavigate('advisor')}
          className="relative z-10 self-start sm:self-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl font-sans font-semibold text-xs active:scale-97 transition-all shadow-sm shrink-0 cursor-pointer border border-zinc-200"
        >
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Consult AI Advisor</span>
        </button>

        {/* Elegant backdrop glow effect */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top Metric Cards Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Pool */}
        <div className="bg-white p-5 border border-zinc-250/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase">
              <span>Total Net Balance</span>
              <div className="p-2 bg-zinc-50 border border-zinc-200/40 text-zinc-800 rounded-lg">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-900 leading-none">
              {formatRaw(metrics.netBalance)}
            </h3>
          </div>
          <p className={`text-[11px] mt-4 font-semibold ${metrics.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {metrics.netBalance >= 0 
              ? `Surplus position: +${formatRaw(metrics.netBalance)}` 
              : `Deficit current: -${formatRaw(Math.abs(metrics.netBalance))}`
            }
          </p>
        </div>

        {/* Outflows */}
        <div className="bg-white p-5 border border-zinc-250/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase">
              <span>Total Expenses</span>
              <div className="p-2 bg-zinc-50 border border-zinc-200/40 text-zinc-855 rounded-lg">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-900 leading-none">
              {formatRaw(metrics.totalExpense)}
            </h3>
          </div>
          <p className="text-[11px] text-zinc-450 mt-4 font-sans font-medium">
            Accumulated monthly consumption items
          </p>
        </div>

        {/* Savings Efficiency Rate */}
        <div className="bg-white p-5 border border-zinc-250/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase">
              <span>Savings Rate</span>
              <div className="p-2 bg-zinc-50 border border-zinc-200/40 text-zinc-855 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-900 leading-none">
              {metrics.savingsRatio.toFixed(1)}%
            </h3>
          </div>
          <div className="mt-4 space-y-2">
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${metrics.savingsRatio > 25 ? 'bg-emerald-500' : metrics.savingsRatio > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, metrics.savingsRatio))}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-sans font-medium">
              Target benchmark: at least 20.0% of inflows
            </p>
          </div>
        </div>
      </div>

      {/* 3. Executive Workstation Bento Grid Column split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column: Quick Actions and Recent transactions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Subcard A: Instant Log templates shortcuts */}
          <div className="bg-white p-6 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-450 tracking-widest uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Quick Ledger Templates</span>
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5 font-light">One-click templates to record standard expenses instantly.</p>
            </div>

            {templates.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-450 text-xs font-sans">
                <p className="font-semibold text-zinc-600">No templates added yet.</p>
                <p className="text-[10px] text-zinc-400 max-w-sm mx-auto mt-0.5">Define recurring items inside the Transactions form to add them here for fast ledger writing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.slice(0, 4).map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      onAddTransaction({
                        amount: act.amount,
                        description: act.description,
                        category: act.category,
                        type: act.type,
                        date: new Date().toISOString().split('T')[0],
                        notes: act.notes,
                        tags: act.tags
                      });
                      setNotification(`Recorded "${act.description}" template successfully!`);
                    }}
                    className="p-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200/40 outline-hidden font-medium text-left rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-zinc-900 truncate">{act.label}</div>
                      <div className="text-[10px] text-zinc-450 truncate">{act.category}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-800">{formatRaw(act.amount)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bento Subcard B: Real-time Recent Activity feed */}
          <div className="bg-white p-6 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-mono font-bold text-zinc-455 tracking-widest uppercase flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-zinc-800" />
                  <span>Ledger Activity Feed</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5 font-light">Chronological review of newest item registries</p>
              </div>
              <button 
                onClick={() => onNavigate('transactions')}
                className="text-[11px] font-bold text-zinc-900 hover:text-zinc-650 transition flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Ledger</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-450 text-xs font-sans">
                <p className="font-semibold text-zinc-600">No transactions yet.</p>
                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto mt-1">Navigate to the Transactions workspace to add item logs.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 font-sans">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 font-sans group hover:bg-zinc-50/25 px-1 rounded-lg transition-colors">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="text-xs font-semibold text-zinc-900 truncate">{tx.description}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${
                          tx.type === 'income' ? 'bg-emerald-55/10 text-emerald-800 border border-emerald-100/50' : 'bg-zinc-50 border border-zinc-100 text-zinc-750'
                        }`}>
                          {tx.category}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono text-right shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-800'
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
          <div className="bg-white p-6 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-zinc-455 tracking-widest uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-zinc-800" />
                    <span>Target Milestones</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5 font-light">Savings goals progressions</p>
                </div>
                <button 
                  onClick={() => onNavigate('goals')}
                  className="text-zinc-400 hover:text-zinc-900 transition flex items-center gap-0.5 cursor-pointer"
                >
                  <PlusSquare className="w-4 h-4" />
                </button>
              </div>

              {activeSavingMilestones.length === 0 ? (
                <div className="py-8 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-455 text-xs font-sans">
                  No tracking milestones configured.
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {activeSavingMilestones.map((g) => {
                    const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                    return (
                      <div key={g.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-800 truncate pr-2">{g.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                            {formatRaw(g.currentAmount, 0)} / {formatRaw(g.targetAmount, 0)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div 
                            className="bg-zinc-950 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-zinc-450 font-bold">{ratio.toFixed(0)}% Completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 mt-4 text-[10px] text-zinc-450 leading-relaxed font-sans font-light">
              Add small allocations into savings items in the Goals panel to hit milestones ahead of plan.
            </div>
          </div>

          {/* Spend Budgets (near critical) widget */}
          <div className="bg-white p-6 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-mono font-bold text-zinc-455 tracking-widest uppercase flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-zinc-800" />
                  <span>Category Budgets</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5 font-light">Limits and alerts counters</p>
              </div>
              <button 
                onClick={() => onNavigate('budgets')}
                className="text-xs font-mono font-semibold text-zinc-900 hover:text-zinc-650 transition cursor-pointer"
              >
                Configure
              </button>
            </div>

            {criticalBudgets.length === 0 ? (
              <div className="py-8 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-450 text-xs font-sans">
                No monthly allowances set up.
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {criticalBudgets.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                      <span className="font-semibold text-zinc-800 truncate pr-2">{item.category}</span>
                      <span className={`font-mono text-[10px] shrink-0 ${item.isExceeded ? 'text-rose-600 font-bold' : 'text-zinc-500'}`}>
                        {formatRaw(item.spent, 0)} / {formatRaw(item.limit, 0)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${item.ratio >= 100 ? 'bg-rose-500' : 'bg-zinc-950'}`}
                        style={{ width: `${Math.min(100, item.ratio)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-450">Used {item.ratio.toFixed(0)}%</span>
                      {item.isExceeded && (
                        <div className="inline-flex items-center gap-1 text-[9px] text-rose-600 font-semibold bg-rose-50 border border-rose-100/60 py-0.5 px-1.5 rounded">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500" /> Limit Exceeded
                        </div>
                      )}
                    </div>
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
