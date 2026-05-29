import React, { useState, useMemo } from 'react';
import { Transaction, Budget, CATEGORIES } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Percent, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BudgetManagerProps {
  transactions: Transaction[];
  budgets: Budget[];
  onSetBudgetLimit: (category: string, limit: number) => void;
}

export default function BudgetManager({ transactions, budgets, onSetBudgetLimit }: BudgetManagerProps) {
  const { currency, formatRaw, fromActiveCurrency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.expense[0]);
  const [limitAmount, setLimitAmount] = useState('');

  // Calculate actual current spent per category
  const actualCategorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.expense.forEach(c => map[c] = 0);
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      }
    });
    return map;
  }, [transactions]);

  // Aggregate limits vs spent info
  const budgetListWithStats = useMemo(() => {
    return CATEGORIES.expense.map((category) => {
      const budget = budgets.find(b => b.category === category);
      const limit = budget ? budget.limit : 0;
      const spent = actualCategorySpentMap[category] || 0;
      const ratio = limit > 0 ? (spent / limit) * 105 : 0; // standard display logic
      
      return {
        category,
        limit,
        spent,
        ratio: limit > 0 ? (spent / limit) * 100 : 0,
        isExceeded: limit > 0 && spent > limit
      };
    }).filter(item => item.limit > 0 || item.spent > 0);
  }, [budgets, actualCategorySpentMap]);

  // Handle setting a limit
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const lmtNum = parseFloat(limitAmount);
    if (isNaN(lmtNum) || lmtNum <= 0) {
      alert("Provide a valid positive numeric limit.");
      return;
    }
    const usdLimit = fromActiveCurrency(lmtNum);
    onSetBudgetLimit(selectedCategory, usdLimit);
    setLimitAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans items-stretch animate-fade-in">
      {/* Configure a Budget limits Box */}
      <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 leading-none">Configure Limits</h3>
            <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Set monthly spending limits for expense categories.</p>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg cursor-pointer font-sans font-medium"
              >
                {CATEGORIES.expense.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">
                Spend Limit ({currency.symbol} {currency.code})
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 500.00"
                required
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer border border-zinc-950"
            >
              <Plus className="w-3.5 h-3.5" /> 
              <span>Authorize Limit</span>
            </button>
          </form>
        </div>

        <div className="bg-zinc-950 text-zinc-300 p-4 border border-zinc-800 rounded-xl mt-6 text-xs leading-relaxed space-y-1 font-sans">
          <div className="font-bold text-emerald-400 font-mono text-[10px] uppercase tracking-wider">Ledge Rule</div>
          <p className="font-light">Monthly limits safeguard net margin targets. Maintain tight tolerances to amplify asset expansion velocity.</p>
        </div>
      </div>

      {/* Progress Bars and metrics column */}
      <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-2 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 leading-none">Allowance Status</h3>
          <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Monitor active cashflow consumption items vs limits.</p>
        </div>

        {budgetListWithStats.length === 0 ? (
          <div className="py-16 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400 text-xs font-sans flex flex-col items-center justify-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-full mb-3 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="font-semibold text-zinc-600">No active category limits found.</p>
            <p className="text-[10px] text-zinc-450 mt-1 max-w-xs mx-auto">Use the configuration pane to allocate your first budget registry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetListWithStats.map((item) => (
              <div key={item.category} className="p-4 border border-zinc-100 rounded-xl bg-zinc-50/20 hover:border-zinc-200 transition">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-zinc-800">{item.category}</span>
                  <div className="text-[11px] text-zinc-500 font-sans font-medium">
                    <span className="font-semibold text-zinc-900 font-mono">{formatRaw(item.spent)}</span>
                    {item.limit > 0 ? (
                      <> of <span className="font-semibold text-zinc-600 font-mono">{formatRaw(item.limit)}</span> ({item.ratio.toFixed(0)}%)</>
                    ) : (
                      <> spent (Unlimited)</>
                    )}
                  </div>
                </div>

                {item.limit > 0 && (
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.ratio >= 100
                          ? 'bg-rose-500'
                          : item.ratio >= 80
                          ? 'bg-amber-400'
                          : 'bg-zinc-950'
                      }`}
                      style={{ width: `${Math.min(100, item.ratio)}%` }}
                    />
                  </div>
                )}

                {item.isExceeded && (
                  <div className="flex items-center gap-2 mt-3 bg-rose-50 border border-rose-100/60 px-3 py-2 rounded-lg text-[10px] text-rose-800 font-sans font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Threshold Exceeded. Variance over allowance limit of <span className="font-mono font-bold text-rose-950">{formatRaw(Math.abs(item.spent - item.limit))}</span>.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
