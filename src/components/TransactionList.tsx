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
          // crude validation
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
    
    // Load converted active value for the editor input
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
      // Convert edited input amount from active currency back to USD Base
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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Title & Backup Controls */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-display font-semibold text-gray-800">Transactions</h3>
          <p className="text-xs text-gray-500 font-sans">View, filter, and back up all your transactions.</p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportData}
            title="Download JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export (Download)
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restore JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Import (Upload)
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

      {/* Advanced Filtering Rails */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl focus:outline-hidden focus:border-emerald-600 transition"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full text-xs px-3 py-2 bg-white border border-gray-100 rounded-xl focus:outline-hidden focus:border-emerald-600 transition appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-gray-100 rounded-xl focus:outline-hidden focus:border-emerald-600 transition appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {activeCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sorting Order */}
        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full text-xs px-3 py-2 bg-white border border-gray-100 rounded-xl focus:outline-hidden focus:border-emerald-600 transition appearance-none cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      {processedTransactions.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm font-sans flex flex-col items-center justify-center">
          <Filter className="w-8 h-8 text-gray-200 mb-2" />
          <p>No transactions match your filters.</p>
          {(search || filterType !== 'all' || filterCategory !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
                setFilterCategory('all');
              }}
              className="text-emerald-600 font-medium text-xs mt-1 underline hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 tracking-wider uppercase font-sans bg-gray-50/25">
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/75 text-sm font-sans">
              {processedTransactions.map((t) => {
                const isEditing = editingId === t.id;

                return (
                  <tr key={t.id} className="hover:bg-gray-50/40 transition-colors">
                    {/* Status Badge */}
                    <td className="py-3.5 px-5 shrink-0 whitespace-nowrap">
                      {t.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
                          <ArrowDownLeft className="w-3 h-3 text-rose-500" /> Expense
                        </span>
                      )}
                    </td>

                    {/* Description and tags */}
                    <td className="py-3.5 px-4 max-w-xs md:max-w-md min-w-[150px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-gray-800">{t.description}</div>
                          {t.notes && <div className="text-xs text-gray-500 mt-0.5">{t.notes}</div>}
                          {/* Tags Rendering */}
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {t.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => setSearch(tag)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-100 text-[10px] font-medium rounded-md transition"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{tag}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Taxonomy Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600">
                      {isEditing ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                        >
                          {CATEGORIES[t.type].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{t.category}</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-500">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                        />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold text-gray-800">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-right focus:outline-hidden font-mono"
                        />
                      ) : (
                        <span className="font-mono">{formatRaw(t.amount)}</span>
                      )}
                    </td>

                    {/* Table Actions inline */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveInlineEdit(t.id, t.type)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 border border-gray-100 hover:bg-gray-100 font-medium text-xs text-gray-600 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(t)}
                              title="Edit record"
                              className="p-1 px-2 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-md transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Proceed to delete this receipt record permanently?")) {
                                  onDeleteTransaction(t.id);
                                }
                              }}
                              title="Delete record"
                              className="p-1 px-2 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-md transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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
