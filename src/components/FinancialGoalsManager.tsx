import React, { useState } from 'react';
import { FinancialGoal } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Target, PiggyBank, Trash2, ShieldAlert } from 'lucide-react';

interface FinancialGoalsManagerProps {
  goals: FinancialGoal[];
  onAddGoal: (name: string, targetAmount: number, deadline?: string) => void;
  onUpdateGoalProgress: (id: string, amountToAdd: number) => void;
  onDeleteGoal: (id: string) => void;
}

export default function FinancialGoalsManager({
  goals,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal
}: FinancialGoalsManagerProps) {
  const { currency, formatRaw, fromActiveCurrency } = useCurrency();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Deposit allocation states
  const [depositAmount, setDepositAmount] = useState<Record<string, string>>({});

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const lmtNum = parseFloat(targetAmount);
    if (!goalName.trim() || isNaN(lmtNum) || lmtNum <= 0) {
      alert("Provide a valid goal descriptor and active non-zero target.");
      return;
    }
    // Convert target local currency limit back to USD Base
    const usdTarget = fromActiveCurrency(lmtNum);
    onAddGoal(goalName.trim(), usdTarget, deadline || undefined);
    setGoalName('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleDepositSubmit = (goalId: string) => {
    const amtStr = depositAmount[goalId] || '';
    const amtNum = parseFloat(amtStr);
    if (isNaN(amtNum) || amtNum === 0) {
      alert("Please enter a valid non-zero amount.");
      return;
    }
    // Convert active currency deposit back to USD Base
    const usdDeposit = fromActiveCurrency(amtNum);
    onUpdateGoalProgress(goalId, usdDeposit);
    setDepositAmount(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Col 1: Config Goal Objectives Form */}
      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-1">
        <h3 className="text-base font-display font-semibold text-gray-800">Set Savings Goals</h3>
        <p className="text-xs text-gray-500 font-sans mt-0.5 mb-4">Save money for a vacation, new equipment, or other big plans.</p>

        <form onSubmit={handleSubmitGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. New Mac Studio, Trip to Japan"
              required
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
              Target Amount ({currency.symbol} {currency.code})
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 2400"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-display font-medium flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Save Goal
          </button>
        </form>
      </div>

      {/* Col 2: Goals Visualizers */}
      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-2 space-y-5">
        <div>
          <h3 className="text-base font-display font-semibold text-gray-800">My Goals</h3>
          <p className="text-xs text-gray-500 font-sans mt-0.5">Track your saving progress and add money to your goals.</p>
        </div>

        {goals.length === 0 ? (
          <div className="py-12 border border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-xs font-sans flex flex-col items-center justify-center">
            <Target className="w-8 h-8 text-emerald-100 mb-1" />
            <p className="font-semibold text-gray-600">No savings goals set up yet.</p>
            <p className="text-[11px] max-w-xs mt-0.5">Use the form on the left to add your first savings goal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const isFulfilled = g.currentAmount >= g.targetAmount;

              return (
                <div key={g.id} className="p-4 border border-gray-100 rounded-2xl hover:border-emerald-200 transition bg-gray-50/25 flex flex-col justify-between">
                  <div>
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-2 text-xs mb-1">
                      <span className="font-bold text-gray-700 font-display flex items-center gap-1.5">
                        <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0" />
                        {g.name}
                      </span>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-gray-400 hover:text-rose-600 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Deadline details */}
                    {g.deadline && (
                      <p className="text-[10px] text-gray-400 font-sans mb-3">
                        Target date: {new Date(g.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}

                    {/* Metrics values */}
                    <div className="flex justify-between text-xs mb-1 font-bold text-gray-600 font-sans">
                      <span>Saved so far:</span>
                      <span className="font-semibold text-gray-800 font-mono">
                        {formatRaw(g.currentAmount, 0)} / {formatRaw(g.targetAmount, 0)} ({ratio.toFixed(0)}%)
                      </span>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4 shrink-0">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFulfilled ? 'bg-emerald-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                  </div>

                  {/* Allocation inputs */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder={`Add amount (${currency.symbol})`}
                        value={depositAmount[g.id] || ''}
                        onChange={(e) => setDepositAmount(prev => ({ ...prev, [g.id]: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-100 rounded-lg focus:outline-hidden font-mono"
                      />
                      <button
                        onClick={() => handleDepositSubmit(g.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-sans font-medium hover:scale-105 transition shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
