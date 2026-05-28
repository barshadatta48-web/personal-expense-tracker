import React, { useState, useMemo } from 'react';
import { Transaction, Budget, CATEGORIES } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Percent, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

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
    // Seed and process
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
      const ratio = limit > 0 ? (spent / limit) * 100 : 0;
      
      return {
        category,
        limit,
        spent,
        ratio,
        isExceeded: limit > 0 && spent > limit
      };
    }).filter(item => item.limit > 0 || item.spent > 0); // only show active budgets or categories with activity
  }, [budgets, actualCategorySpentMap]);

  // Handle setting a limit
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const lmtNum = parseFloat(limitAmount);
    if (isNaN(lmtNum) || lmtNum <= 0) {
      alert("Provide a valid numeric budget limit.");
      return;
    }
    // Convert active currency amount back to USD Base
    const usdLimit = fromActiveCurrency(lmtNum);
    onSetBudgetLimit(selectedCategory, usdLimit);
    setLimitAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Configure a Budget limits Box */}
      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-1">
        <h3 className="text-base font-display font-semibold text-gray-800">Set Monthly Budgets</h3>
        <p className="text-xs text-gray-500 font-sans mt-0.5 mb-4">Set maximum limits on how much you want to spend.</p>

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-xl cursor-pointer appearance-none"
            >
              {CATEGORIES.expense.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
              Budget Limit ({currency.symbol} {currency.code})
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 500"
              required
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-xl font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-display font-medium flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Save Budget
          </button>
        </form>

        <div className="bg-gray-50/50 p-4 border border-gray-100 rounded-xl mt-4 text-xs text-gray-500 space-y-2 font-sans">
          <div className="font-semibold text-gray-700">How budgets work:</div>
          <p>Setting a monthly budget helps you track your spending. Our AI Advisor can also give you personalized tips to help you stay within your limits.</p>
        </div>
      </div>

      {/* Progress Bars and metrics column */}
      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-2 space-y-5">
        <div>
          <h3 className="text-base font-display font-semibold text-gray-800">My Budgets</h3>
          <p className="text-xs text-gray-500 font-sans mt-0.5">Track your spending limits compared to what you have spent.</p>
        </div>

        {budgetListWithStats.length === 0 ? (
          <div className="py-12 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans flex flex-col items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-100 mb-1" />
            <p className="font-semibold text-gray-600">No budgets set up yet.</p>
            <p className="text-[11px] max-w-xs mt-0.5">Use the form on the left to set your first budget.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetListWithStats.map((item) => (
              <div key={item.category} className="p-3.5 border border-gray-50 rounded-xl bg-gray-50/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{item.category}</span>
                  <div className="text-[11px] text-gray-500 font-sans">
                    <span className="font-semibold text-gray-800 font-mono">{formatRaw(item.spent)}</span>
                    {item.limit > 0 ? (
                      <> of <span className="font-semibold text-gray-600 font-mono">{formatRaw(item.limit)}</span> ({item.ratio.toFixed(0)}%)</>
                    ) : (
                      <> spent (No limit set)</>
                    )}
                  </div>
                </div>

                {item.limit > 0 && (
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.ratio >= 100
                          ? 'bg-rose-500'
                          : item.ratio >= 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.ratio)}%` }}
                    />
                  </div>
                )}

                {item.isExceeded && (
                  <div className="flex items-center gap-1.5 mt-2 bg-rose-50 text-rose-800 border border-rose-100 px-3 py-1.5 rounded-lg text-[10px] font-sans font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>You went over your {item.category} budget by <span className="font-semibold font-mono">{formatRaw(Math.abs(item.spent - item.limit))}</span>! Try to cut back.</span>
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
