import React, { useState, useMemo, useRef } from 'react';
import { Transaction, CATEGORIES } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Search, Trash2, Edit, Download, Upload, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Tag } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onImportTransactions: (transactions: Transaction[]) => void;
}

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  onImportTransactions
}: TransactionListProps) {
  const { currency, formatRaw, toActiveCurrency, fromActiveCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  // Inline Editing States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of unique categories from actual transactions for the filter list
  const activeCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  // Main filter & sort logic
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search Query Match
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // 2. Type Filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // 3. Category Filter
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    // 4. Sort Ordering
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, search, filterType, filterCategory, sortOrder]);

  // Export Data to UTF-8 encoded JSON
  const handleExportData = () => {
    if (transactions.length === 0) {
      alert("No data to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_tracker_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data from JSON Upload
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated = parsed.filter((t: any) => 
            t && typeof t.amount === 'number' && typeof t.type === 'string' && t.description && t.category && t.date
          ) as Transaction[];
          
          if (validated.length > 0) {
            onImportTransactions(validated);
            alert(`Successfully imported ${validated.length} transactions!`);
          } else {
            alert("No valid transaction records found in the JSON file.");
          }
        } else {
          alert("Invalid file format. Must be a JSON array of transactions.");
        }
      } catch (err) {
        alert("JSON parsing error. Please check your backup file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Turn on inline editor
  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    const activeVal = toActiveCurrency(t.amount);
    const decDigits = currency.code === 'JPY' ? 0 : 2;
    setEditAmount(activeVal.toFixed(decDigits));
    setEditDesc(t.description);
    setEditCategory(t.category);
    setEditDate(t.date);
  };

  // Save changes
  const saveInlineEdit = (id: string, originalType: 'income' | 'expense') => {
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Enter a valid transaction amount.");
      return;
    }
    if (!editDesc.trim()) {
      alert("Please provide a description.");
      return;
    }

    const matched = transactions.find(t => t.id === id);
    if (matched) {
      const usdAmount = fromActiveCurrency(amt);
      onUpdateTransaction({
        ...matched,
        amount: usdAmount,
        description: editDesc.trim(),
        category: editCategory,
        date: editDate
      });
    }

    setEditingId(null);
  };

  return (
    <div className="bg-white border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Title & Backup Controls */}
      <div className="p-5 border-b border-zinc-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 leading-none">Registry Registry</h3>
          <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Meticulously audit, filter, and export transaction logs.</p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
          <button
            onClick={handleExportData}
            title="Download JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-350 rounded-xl text-[11px] font-bold text-zinc-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> 
            <span>Export Registry</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restore JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-350 rounded-xl text-[11px] font-bold text-zinc-700 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> 
            <span>Import Registry</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportData}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Filter Toolbar controls */}
      <div className="p-4 bg-zinc-50 border-b border-zinc-200/40 space-y-3 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search description, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-zinc-200 focus:outline-hidden focus:border-zinc-950 rounded-lg"
            />
          </div>

          {/* Type dropdown Filter */}
          <div className="md:col-span-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-200 focus:outline-hidden focus:border-zinc-950 rounded-lg cursor-pointer font-medium"
            >
              <option value="all">All Cashflow Types</option>
              <option value="income">Inflows Only</option>
              <option value="expense">Outflows Only</option>
            </select>
          </div>

          {/* Category dropdown Filter */}
          <div className="md:col-span-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-200 focus:outline-hidden focus:border-zinc-950 rounded-lg cursor-pointer font-medium"
            >
              <option value="all">All Categories</option>
              {activeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full text-xs px-2.5 py-2 bg-white border border-zinc-200 focus:outline-hidden focus:border-zinc-950 rounded-lg cursor-pointer font-medium"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {processedTransactions.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 font-sans text-xs">
          <p className="font-semibold text-zinc-600">No matching search logs found.</p>
          <p className="text-[10px] text-zinc-450 mt-1 max-w-xs mx-auto">Try resetting the drop-down filters or adding details in the form on the left.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Mobile responsive stack rendering: hidden on desktop, block on mobile */}
          <div className="block md:hidden divide-y divide-zinc-100 font-sans p-2">
            {processedTransactions.map((tx) => {
              const isActiveEdit = editingId === tx.id;
              return (
                <div key={tx.id} className="p-3 space-y-2.5 hover:bg-zinc-50/40 rounded-xl transition">
                  {isActiveEdit ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full text-xs p-2 border border-zinc-300 rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="text-xs p-2 border border-zinc-300 rounded font-mono"
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="text-xs p-2 border border-zinc-300 rounded"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-[11px] bg-zinc-100 text-zinc-650 rounded hover:bg-zinc-200 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveInlineEdit(tx.id, tx.type)}
                          className="px-2.5 py-1 text-[11px] bg-zinc-950 text-white rounded hover:bg-zinc-900 font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 text-xs">{tx.description}</span>
                        <span className={`text-xs font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-800'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatRaw(tx.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-semibold">{tx.category}</span>
                          <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(tx)}
                            className="p-1 hover:bg-zinc-100 text-zinc-500 rounded transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop tabular view */}
          <table className="min-w-full divide-y divide-zinc-200/50 text-left font-sans text-xs hidden md:table">
            <thead className="bg-zinc-50 border-b border-zinc-200/40 text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/70 font-sans">
              {processedTransactions.map((tx) => {
                const isActiveEdit = editingId === tx.id;
                return (
                  <tr key={tx.id} className="hover:bg-zinc-50/20 transition-colors">
                    {/* Description */}
                    <td className="px-6 py-3.5 min-w-[200px]">
                      {isActiveEdit ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full text-xs p-1.5 border border-zinc-200 bg-white rounded focus:outline-hidden focus:border-zinc-950 font-sans"
                        />
                      ) : (
                        <div>
                          <p className="font-semibold text-zinc-900">{tx.description}</p>
                          {tx.notes && <p className="text-[10px] text-zinc-400 mt-0.5 font-light">{tx.notes}</p>}
                        </div>
                      )}
                    </td>

                    {/* Category Column */}
                    <td className="px-6 py-3.5">
                      {isActiveEdit ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="text-xs p-1.5 border border-zinc-200 bg-white rounded focus:outline-hidden focus:border-zinc-950 cursor-pointer font-sans"
                        >
                          {CATEGORIES[tx.type].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block font-mono font-bold text-[9px] px-2 py-0.5 rounded-md ${
                          tx.type === 'income' ? 'bg-emerald-55/10 text-emerald-800' : 'bg-zinc-100 text-zinc-650'
                        }`}>
                          {tx.category}
                        </span>
                      )}
                    </td>

                    {/* Date Column */}
                    <td className="px-6 py-3.5 text-zinc-550 font-mono">
                      {isActiveEdit ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="text-xs p-1.5 border border-zinc-200 bg-white rounded focus:outline-hidden focus:border-zinc-950 font-mono"
                        />
                      ) : (
                        <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </td>

                    {/* Amount Column */}
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-xs">
                      {isActiveEdit ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 text-right text-xs p-1.5 border border-zinc-200 bg-white rounded focus:outline-hidden focus:border-zinc-950 font-mono font-bold"
                        />
                      ) : (
                        <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-850'}>
                          {tx.type === 'income' ? '+' : '-'}{formatRaw(tx.amount)}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-3.5 text-center">
                      {isActiveEdit ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveInlineEdit(tx.id, tx.type)}
                            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-950 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-zinc-400">
                          <button
                            onClick={() => startEdit(tx)}
                            title="Edit transaction log"
                            className="p-1 hover:bg-zinc-100 hover:text-zinc-800 rounded transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Delete transaction log"
                            className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
