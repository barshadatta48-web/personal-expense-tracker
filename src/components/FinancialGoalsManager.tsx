import React, { useState } from 'react';
import { FinancialGoal } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Target, PiggyBank, Trash2, CheckCircle } from 'lucide-react';

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
      alert("Provide a valid goal name and positive target amount.");
      return;
    }
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
      alert("Provide a valid numeric allocation amount.");
      return;
    }
    const usdDeposit = fromActiveCurrency(amtNum);
    onUpdateGoalProgress(goalId, usdDeposit);
    setDepositAmount(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans items-stretch animate-fade-in">
      {/* Col 1: Config Goal Objectives Form */}
      <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 leading-none">Create Targets</h3>
            <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Earmark specific funds for long-term saving goals.</p>
          </div>

          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">Objective Tracker Name</label>
              <input
                type="text"
                placeholder="e.g. New Equipment, Reserve Fund"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">
                Target Objective Funds ({currency.symbol} {currency.code})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">Term Date (Optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg font-mono font-bold cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer border border-zinc-950"
            >
              <Plus className="w-3.5 h-3.5" /> 
              <span>Authorize Savings Goal</span>
            </button>
          </form>
        </div>

        <div className="bg-zinc-950 text-zinc-350 p-4 border border-zinc-805 rounded-xl mt-6 text-xs leading-relaxed space-y-1 font-sans">
          <div className="font-bold text-emerald-400 font-mono text-[10px] uppercase tracking-wider">Ledge Rule</div>
          <p className="font-light">Incrementally fund objectives from your surplus reserves. Set clear thresholds to expedite capital security milestones.</p>
        </div>
      </div>

      {/* Col 2: Goals Visualizers */}
      <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-2 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 leading-none">Milestones</h3>
          <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Monitor progress and make deposits into objectives.</p>
        </div>

        {goals.length === 0 ? (
          <div className="py-16 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400 text-xs font-sans flex flex-col items-center justify-center">
            <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-full mb-3 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <p className="font-semibold text-zinc-600">No active savings objectives found.</p>
            <p className="text-[10px] text-zinc-450 mt-1 max-w-xs mx-auto">Configure a name and target limit to allocate your first tracking milestone.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((g) => {
              const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const isFulfilled = g.currentAmount >= g.targetAmount;

              return (
                <div key={g.id} className="p-4 border border-zinc-200/60 rounded-xl hover:border-zinc-300 transition bg-zinc-50/20 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-800 text-xs flex items-center gap-1.5 truncate">
                          <PiggyBank className="w-4 h-4 text-zinc-700 shrink-0" />
                          <span>{g.name}</span>
                        </span>
                        {g.deadline && (
                          <p className="text-[9px] text-zinc-400 font-mono font-bold mt-1 uppercase tracking-wider">
                            Target: {new Date(g.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-zinc-300 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Delete savings goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Milestone Progress Bar & Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-zinc-500 font-medium">Accumulated:</span>
                        <span className="font-bold text-zinc-800 font-mono">
                          {formatRaw(g.currentAmount, 0)} / {formatRaw(g.targetAmount, 0)}
                        </span>
                      </div>

                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFulfilled ? 'bg-emerald-555' : 'bg-zinc-950'
                          }`}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">{ratio.toFixed(0)}% Completed</span>
                        {isFulfilled && (
                          <div className="inline-flex items-center gap-1 text-[9px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100/60 py-0.5 px-1.5 rounded animate-fade-in font-mono">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> TARGET MET
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allocation inputs */}
                  <div className="mt-4 pt-3 border-t border-zinc-100/60 flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      placeholder={`Deposit (${currency.symbol})`}
                      value={depositAmount[g.id] || ''}
                      onChange={(e) => setDepositAmount(prev => ({ ...prev, [g.id]: e.target.value }))}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 focus:outline-hidden focus:border-zinc-950 rounded-lg font-mono font-bold"
                    />
                    <button
                      onClick={() => handleDepositSubmit(g.id)}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-950 text-white rounded-lg text-xs font-semibold hover:scale-[1.03] active:scale-97 transition-all shrink-0 cursor-pointer"
                    >
                      Fund
                    </button>
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
