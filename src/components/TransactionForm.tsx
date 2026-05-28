import React, { useState } from 'react';
import { Transaction, CATEGORIES, QuickTemplate } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Sparkles, AlertCircle, CheckCircle, ArrowDownLeft, ArrowUpRight, Loader2, Zap, BookmarkPlus, X } from 'lucide-react';

const DEFAULT_TEMPLATES: QuickTemplate[] = [];

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const { currency, formatRaw, toActiveCurrency, fromActiveCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // Quick templates list state initialized from localstorage or defaults
  const [templates, setTemplates] = useState<QuickTemplate[]>(() => {
    const saved = localStorage.getItem('expense_tracker_quick_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  // AI Parsing States
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  // Quick Template actions
  const saveTemplatesToStorage = (updated: QuickTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem('expense_tracker_quick_templates', JSON.stringify(updated));
  };

  const applyTemplate = (tpl: QuickTemplate) => {
    const activeAmt = toActiveCurrency(tpl.amount);
    
    // Display with appropriate decimal formatting for the field
    const decDigits = currency.code === 'JPY' ? 0 : 2;
    setAmount(activeAmt.toFixed(decDigits));
    setDescription(tpl.description);
    setType(tpl.type);
    setCategory(tpl.category);
    setNotes(tpl.notes || '');
    setTagInput(tpl.tags ? tpl.tags.join(', ') : '');
    setAiSuccessMessage(`Pre-filled matching template fields for "${tpl.label}" in ${currency.code}!`);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!newTemplateLabel.trim()) {
      alert("Please provide a name/label for the template.");
      return;
    }
    if (isNaN(amtNum) || amtNum <= 0) {
      alert("Please enter a valid numeric amount in the form first to save as a template.");
      return;
    }
    if (!description.trim()) {
      alert("Please enter a description in the form first.");
      return;
    }

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Save as base USD in the database
    const amtNumInUSD = fromActiveCurrency(amtNum);

    const newTpl: QuickTemplate = {
      id: 'template-' + Date.now(),
      label: newTemplateLabel.trim(),
      amount: amtNumInUSD,
      description: description.trim(),
      type,
      category,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    const updated = [...templates, newTpl];
    saveTemplatesToStorage(updated);
    setNewTemplateLabel('');
    setIsCreatingTemplate(false);
    setAiSuccessMessage(`Template "${newTpl.label}" kept successfully inside Quick Templates list!`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    saveTemplatesToStorage(updated);
  };

  // Handle Type switch
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  // Submit manual form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      alert("Please enter a valid positive numeric amount.");
      return;
    }
    if (!description.trim()) {
      alert("Please provide a description or merchant name.");
      return;
    }

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Convert input active currency amount to USD Base
    const amtNumInUSD = fromActiveCurrency(amtNum);

    onAddTransaction({
      amount: amtNumInUSD,
      description: description.trim(),
      type,
      category,
      date,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setNotes('');
    setTagInput('');
    setAiSuccessMessage('');
  };

  // Call search/parsing API
  const handleAiParse = async () => {
    if (!aiText.trim()) {
      setAiError("Please paste or type receipt text / single-sentence detail first.");
      return;
    }

    setAiError('');
    setAiSuccessMessage('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: aiText,
          currentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Internal Server Failure during parsing.");
      }

      const data = await response.json();
      
      // Map API outputs directly back to form controls so user can edit instantly
      if (data.amount) {
        // AI parse outputs USD base by default since it knows the base app prompt.
        // Let's convert it to the user's active currency!
        const activeAmt = toActiveCurrency(Number(data.amount));
        const decDigits = currency.code === 'JPY' ? 0 : 2;
        setAmount(activeAmt.toFixed(decDigits));
      }
      if (data.description) setDescription(data.description);
      if (data.type) {
        const correctType = data.type === 'income' ? 'income' : 'expense';
        setType(correctType);
        if (data.category && CATEGORIES[correctType].includes(data.category)) {
          setCategory(data.category);
        } else {
          setCategory(CATEGORIES[correctType][0]);
        }
      }
      if (data.date) setDate(data.date);
      if (data.notes) setNotes(data.notes);
      if (Array.isArray(data.tags)) setTagInput(data.tags.join(', '));

      setAiSuccessMessage(`Transaction successfully parsed by AI! Converted base parameters to local ${currency.code}. Review below and click 'Record Transaction'.`);
      setActiveTab('manual'); // Bring them back to review
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || "Failed to parse content. Please double check your Gemini key or input.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 text-sm font-display font-medium border-b-2 transition-all ${
            activeTab === 'manual'
              ? 'border-emerald-600 text-emerald-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          Manual Input
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-sm font-display font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-emerald-600 text-emerald-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          AI Scanner
        </button>
      </div>

      <div className="p-6">
        {/* TAB 1: MANUAL FORM */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {aiSuccessMessage && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}

            {/* Quick Templates horizontal flow row */}
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>⚡ Templates</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-0.5"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>{isCreatingTemplate ? 'Cancel Save' : 'Save current form as a template'}</span>
                </button>
              </div>

              {/* Save template inline form panel */}
              {isCreatingTemplate && (
                <div className="p-3 bg-white border border-gray-100/80 rounded-xl space-y-2.5 shadow-2xs font-sans">
                  <p className="text-[10px] text-gray-400">
                    To save a template, fill out the form details below first, then give it a name.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 🍿 Friday Cinema, 🏠 Rent, 🛒 Grocery Store"
                      value={newTemplateLabel}
                      required={isCreatingTemplate}
                      onChange={(e) => setNewTemplateLabel(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50/50 border border-gray-100 focus:outline-hidden focus:border-emerald-600 focus:bg-white rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTemplate}
                      className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold shrink-0 transition"
                    >
                      Save Shortcut
                    </button>
                  </div>
                </div>
              )}

              {templates.length === 0 ? (
                <div className="text-[11px] text-gray-400 italic font-sans py-1">No custom quick shortcuts kept yet.</div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar max-w-full">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      title="Click to fill form fields"
                      className="group relative cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/15 active:scale-95 text-xs text-gray-700 font-semibold rounded-xl transition duration-150 shrink-0 shadow-2xs font-sans"
                    >
                      <span>{tpl.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{formatRaw(tpl.amount, 0)}</span>
                      
                      {/* One-click record instantly action inside template bubble */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTransaction({
                            amount: tpl.amount, // already USD base
                            description: tpl.description,
                            type: tpl.type,
                            category: tpl.category,
                            date: new Date().toISOString().split('T')[0],
                            notes: tpl.notes,
                            tags: tpl.tags
                          });
                          setAiSuccessMessage(`Quick recorded "${tpl.label}" with today's date successfully!`);
                        }}
                        title="Instant Add with Today's Date"
                        className="hidden group-hover:inline-block ml-1.5 p-0.5 hover:bg-emerald-100 text-emerald-600 rounded-md transition"
                      >
                        <Zap className="w-2.5 h-2.5" />
                      </button>

                      {/* Delete Template helper */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        title="Delete shortcut template"
                        className="hidden group-hover:inline-block ml-0.5 p-0.5 hover:bg-rose-50 text-gray-300 hover:text-rose-500 rounded-md transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5 font-sans">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'expense'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-rose-500" /> Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Income
                </button>
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">
                  Amount ({currency.symbol} {currency.code})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Description & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks, Client Wire, Rent payment"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition appearance-none cursor-pointer"
                >
                  {CATEGORIES[type].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes & Tags Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">Tags (separate with commas)</label>
                <input
                  type="text"
                  placeholder="e.g. dining, bills, travel"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1 font-sans">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Split with Sarah"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-display font-medium flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          </form>
        )}

        {/* TAB 2: AI COGNITIVE SCANNER */}
        {activeTab === 'ai' && (
          <div className="space-y-4 font-sans">
            <div className="bg-emerald-50/55 border border-emerald-100 p-4 rounded-xl text-xs space-y-1 text-emerald-800">
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>AI Text Scanner</span>
              </div>
              <p>Write or paste any invoice text, receipt, or a simple sentence like: <span className="italic font-mono bg-white px-1 border border-emerald-100 rounded">"Spent $12 on lunch yesterday"</span> or <span className="italic font-mono bg-white px-1 border border-emerald-100 rounded text-[11px]">"paid $1500 for rent today"</span>.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Receipt text or simple sentence</label>
              <textarea
                rows={5}
                placeholder="Write details here (e.g. Spent 15 on movie tickets today)..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                className="w-full text-sm py-2.5 px-3.5 bg-gray-50/50 border border-gray-100 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-hidden transition"
              />
            </div>

            {aiError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleAiParse}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  AI is reading your text...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-200" />
                  Find details with AI
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
