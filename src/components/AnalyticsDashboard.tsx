import React, { useState, useMemo } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Transaction, CATEGORY_COLORS } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
}

export default function AnalyticsDashboard({ transactions }: AnalyticsDashboardProps) {
  const { currency, formatRaw, toActiveCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState<'this-month' | 'last-30' | 'this-year' | 'all'>('all');

  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return true; // fallback

      switch (dateRange) {
        case 'this-month':
          return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
        case 'last-30':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return tDate >= thirtyDaysAgo;
        case 'this-year':
          return tDate.getFullYear() === currentYear;
        case 'all':
        default:
          return true;
      }
    });
  }, [transactions, dateRange]);

  // Compute stats in base USD (formatted to active currency in presentation tier)
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryMap: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expenses += amt;
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
      }
    });

    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 105 : 0; // Adjusted display progress slider

    const pieData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Number(toActiveCurrency(value).toFixed(2))
    })).sort((a, b) => b.value - a.value);

    return {
      income,
      expenses,
      net,
      savingsRate: income > 0 ? (net / income) * 100 : 0,
      pieData
    };
  }, [filteredTransactions, toActiveCurrency]);

  // Daily or Monthly Trend Data for Area Chart (converted to active currency for appropriate graph labels)
  const trendData = useMemo(() => {
    // Group transactions by date
    const dateMap: Record<string, { income: number; expense: number; accumulated: number }> = {};
    
    // Sort transactions chronologically
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    
    sorted.forEach((t) => {
      const dateStr = t.date;
      const amt = Number(t.amount) || 0;
      
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { income: 0, expense: 0, accumulated: 0 };
      }
      
      if (t.type === 'income') {
        dateMap[dateStr].income += amt;
        runningBalance += amt;
      } else {
        dateMap[dateStr].expense += amt;
        runningBalance -= amt;
      }
      
      dateMap[dateStr].accumulated = runningBalance;
    });

    // Translate to chart entries
    return Object.entries(dateMap).map(([date, values]) => {
      const formattedDate = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        date: formattedDate,
        rawDate: date,
        Income: Number(toActiveCurrency(values.income).toFixed(2)),
        Expense: Number(toActiveCurrency(values.expense).toFixed(2)),
        Balance: Number(toActiveCurrency(values.accumulated).toFixed(2))
      };
    }).slice(-15); // Show latest 15 active days for clarity
  }, [filteredTransactions, toActiveCurrency]);

  // Monthly Breakdown Bar Chart Data (converted to active currency for appropriate graph labels)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<number, { monthName: string; Income: number; Expense: number }> = {};
    
    // Seed months
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = { monthName: months[i], Income: 0, Expense: 0 };
    }

    transactions.forEach((t) => {
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return;
      const m = dateObj.getMonth();
      const yr = dateObj.getFullYear();
      
      // Filter for current calendar year
      if (yr === new Date().getFullYear()) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          monthlyMap[m].Income += amt;
        } else {
          monthlyMap[m].Expense += amt;
        }
      }
    });

    return Object.values(monthlyMap).map((item) => ({
      ...item,
      Income: Number(toActiveCurrency(item.Income).toFixed(2)),
      Expense: Number(toActiveCurrency(item.Expense).toFixed(2))
    }));
  }, [transactions, toActiveCurrency]);

  // Premium, beautiful, custom HTML tooltip container for Recharts graphs
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl shadow-xl space-y-1 font-sans text-[11px]">
          <p className="font-bold text-zinc-300 font-mono tracking-wider">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 justify-between">
              <span className="text-zinc-400 font-light font-sans">{p.name === 'Balance' ? 'Total Savings' : p.name}:</span>
              <span className="font-bold font-mono text-white" style={{ color: p.color || p.fill }}>
                {currency.symbol}{Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Date filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-zinc-200/50 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-md font-display font-semibold text-zinc-900 leading-none">Charts & Analytics</h2>
          <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">See your income, spending trends, and category summaries.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <div className="inline-flex rounded-lg border border-zinc-200/40 bg-zinc-50 p-0.5">
            {([
              { key: 'all', label: 'All-Time' },
              { key: 'this-month', label: 'This Month' },
              { key: 'last-30', label: '30 Days' },
              { key: 'this-year', label: 'Year' }
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  dateRange === r.key
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            <span>Net Balance</span>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/45 text-zinc-800">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-none">
              {stats.net >= 0 ? '+' : ''}{formatRaw(stats.net)}
            </h3>
            <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${stats.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {stats.net >= 0 ? 'Surplus Ledger Position' : 'Deficit Ledger Position'}
            </p>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            <span>Total Income</span>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/45 text-zinc-800">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-none">
              {formatRaw(stats.income)}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-semibold uppercase tracking-wider">
              Total period inflows
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-rose-350 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            <span>Total Spend</span>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/45 text-zinc-800">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-none">
              {formatRaw(stats.expenses)}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-semibold uppercase tracking-wider">
              Total period outflows
            </p>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            <span>Savings Rate</span>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/45 text-zinc-805">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 leading-none">
              {stats.savingsRate.toFixed(1)}%
            </h3>
            <div className="w-full bg-zinc-100 h-1 rounded-full mt-2 overflow-hidden shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${stats.savingsRate > 20 ? 'bg-emerald-550' : stats.savingsRate > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, stats.savingsRate))}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 font-semibold uppercase tracking-wider">
              Target benchmark: {'>'}= 20%
            </p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-zinc-200 rounded-2xl text-center">
          <div className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-full mb-3 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800">No transactions recorded yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 font-light">
            Add transactions manually or use the AI text scanner to write or paste snapshots and populate your visual charts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Line Chart */}
          <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-405 uppercase tracking-widest">Balance Trend over Time</h3>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 border border-zinc-200/40 px-2 py-0.5 rounded">Latest days registry</span>
            </div>
            
            <div className="w-full h-72">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={renderCustomTooltip} />
                    <Area type="monotone" dataKey="Balance" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-sans">
                  Not enough sequential balance increments to chart trend.
                </div>
              )}
            </div>
          </div>

          {/* Allocation Breakdown Pie Chart */}
          <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold text-zinc-405 uppercase tracking-widest mb-4">Spend by Category</h3>
              
              <div className="w-full h-56 flex justify-center items-center">
                {stats.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#71717A'} />
                        ))}
                      </Pie>
                      <Tooltip content={renderCustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-zinc-400 text-xs font-light">No expenses recorded in this period.</div>
                )}
              </div>
            </div>
            
            {/* Pie Legends */}
            <div className="mt-4 max-h-24 overflow-y-auto space-y-1.5 pr-1">
              {stats.pieData.slice(0, 5).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-[11px] font-sans">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] }} />
                    <span className="truncate text-zinc-500 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-800 shrink-0 font-mono">{currency.symbol}{entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
              {stats.pieData.length > 5 && (
                <div className="text-[9px] text-center text-zinc-400 font-mono font-bold mt-1">
                  + {stats.pieData.length - 5} Other categories
                </div>
              )}
            </div>
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-3">
            <h3 className="text-xs font-mono font-bold text-zinc-405 uppercase tracking-widest mb-4">Inflows vs Outflows (Calendar Year)</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="monthName" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }} />
                  <Bar dataKey="Income" fill="#10B981" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="Expense" fill="#71717A" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
