import React, { useState, useMemo } from 'react';
import { Transaction, CATEGORY_COLORS } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, RefreshCw } from 'lucide-react';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  onAddSampleData: () => void;
}

export default function AnalyticsDashboard({ transactions, onAddSampleData }: AnalyticsDashboardProps) {
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

  // Compute stats
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
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    const pieData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    return {
      income,
      expenses,
      net,
      savingsRate,
      pieData
    };
  }, [filteredTransactions]);

  // Daily or Monthly Trend Data for Area Chart
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
        Income: Number(values.income.toFixed(2)),
        Expense: Number(values.expense.toFixed(2)),
        Balance: Number(values.accumulated.toFixed(2))
      };
    }).slice(-15); // Show latest 15 active days for clarity
  }, [filteredTransactions]);

  // Monthly Breakdown Bar Chart Data
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

    return Object.values(monthlyMap);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Date filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-800">Financial Insights</h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">Visually track your balance velocity and spending distribution</p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div className="inline-flex rounded-lg border border-gray-100 bg-gray-50/50 p-1">
            {(['all', 'this-month', 'last-30', 'this-year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {range === 'all' ? 'All-Time' : range === 'this-month' ? 'This Month' : range === 'last-30' ? 'Last 30 Days' : 'This Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">Net Cashflow</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-display font-bold text-gray-800">
              {stats.net >= 0 ? '+' : ''}${stats.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className={`text-xs mt-1 font-medium ${stats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.net >= 0 ? 'Surplus wealth generated' : 'Deficit spending alert'}
            </p>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">Total Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-display font-bold text-gray-800">
              ${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Active & residual income streams
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">Total Outflow</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-display font-bold text-gray-800">
              ${stats.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Category-based cash outflows
            </p>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase font-sans">Savings Efficiency</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-display font-bold text-gray-800">
              {stats.savingsRate.toFixed(1)}%
            </h3>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${stats.savingsRate > 20 ? 'bg-emerald-500' : stats.savingsRate > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, stats.savingsRate))}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Target should be 20% or higher
            </p>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl text-center">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
            <DollarSign className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-800">No transactions recorded yet</h3>
          <p className="text-sm text-gray-500 max-w-md mt-1 mb-6">
            Add transactions manually, paste receipt details using natural language, or load high-quality sample details to experience the dashboards.
          </p>
          <button
            onClick={onAddSampleData}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Prefill Sandbox with Sample Data
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Line Chart */}
          <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-display font-bold text-gray-800">Balance Velocity Trend</h3>
              <span className="text-xs font-mono text-gray-400">Latest active dates</span>
            </div>
            
            <div className="w-full h-72">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="Balance" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Insufficient sequential data to chart trend line
                </div>
              )}
            </div>
          </div>

          {/* Allocation Breakdown Pie Chart */}
          <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs">
            <h3 className="text-base font-display font-bold text-gray-800 mb-4">Expense Allocation</h3>
            
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
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#10B981'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`$${val.toFixed(2)}`, 'Spent']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-sm">No expenses detected in specified range</div>
              )}
            </div>
            
            {/* Pie Legends */}
            <div className="mt-4 max-h-24 overflow-y-auto space-y-1.5 pr-1">
              {stats.pieData.slice(0, 5).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] }} />
                    <span className="truncate text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800 shrink-0">${entry.value.toFixed(2)}</span>
                </div>
              ))}
              {stats.pieData.length > 5 && (
                <div className="text-[10px] text-center text-gray-400 font-sans mt-1">
                  + {stats.pieData.length - 5} other categories
                </div>
              )}
            </div>
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-3">
            <h3 className="text-base font-display font-bold text-gray-800 mb-4">Annual Calendar Direct Comparison</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                  <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
