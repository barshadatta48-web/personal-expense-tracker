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

      setAiSuccessMessage(`AI Scanner read transaction successfully. Parameterized amounts to ${currency.code}. Please review and log below.`);
      setActiveTab('manual'); // Bring them back to review
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || "Failed to scan text. Check parameters or check if server key is loaded.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-zinc-200/40 bg-zinc-50/50">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'border-zinc-950 text-zinc-950 bg-white font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-800'
          }`}
        >
          Manual Log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-zinc-950 text-zinc-950 bg-white font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>AI Scanner</span>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* TAB 1: MANUAL FORM */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {aiSuccessMessage && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 text-xs animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{aiSuccessMessage}</span>
              </div>
            )}

            {/* Quick Templates horizontal flow row */}
            <div className="bg-zinc-50 p-4 border border-zinc-200/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-200/40 rounded-md font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0 mr-0.5" />
                  <span>Presets</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition flex items-center gap-0.5 cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>{isCreatingTemplate ? 'Cancel' : 'Save as preset'}</span>
                </button>
              </div>

              {/* Save template inline form panel */}
              {isCreatingTemplate && (
                <div className="p-3 bg-white border border-zinc-200 rounded-lg space-y-2.5 shadow-2xs">
                  <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                    Set properties in form below first, then pick a label name for the preset.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Starbucks Cash, Rent Bill"
                      value={newTemplateLabel}
                      required={isCreatingTemplate}
                      onChange={(e) => setNewTemplateLabel(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTemplate}
                      className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs font-semibold shrink-0 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {templates.length === 0 ? (
                <div className="text-[10px] text-zinc-400 font-light font-sans py-1">No custom presets saved.</div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none max-w-full">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      title="Pre-fill details"
                      className="group relative cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 active:scale-97 text-[11px] text-zinc-700 font-semibold rounded-lg transition duration-150 shrink-0 font-sans"
                    >
                      <span>{tpl.label}</span>
                      <span className="text-[10px] text-zinc-400 font-mono font-bold">{formatRaw(tpl.amount, 0)}</span>
                      
                      {/* One-click record instantly action inside template bubble */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTransaction({
                            amount: tpl.amount,
                            description: tpl.description,
                            type: tpl.type,
                            category: tpl.category,
                            date: new Date().toISOString().split('T')[0],
                            notes: tpl.notes,
                            tags: tpl.tags
                          });
                          setAiSuccessMessage(`Preset logged successfully for today!`);
                        }}
                        title="Record instantly"
                        className="hidden group-hover:inline-block ml-1 p-0.5 hover:bg-zinc-100 text-zinc-900 rounded"
                      >
                        <Zap className="w-2.5 h-2.5" />
                      </button>

                      {/* Delete Template helper */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        title="Delete template preset"
                        className="hidden group-hover:inline-block ml-0.5 p-0.5 hover:bg-rose-50 text-zinc-300 hover:text-rose-500 rounded"
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
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1.5">Record Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-zinc-950 border-zinc-950 text-white font-bold'
                      : 'bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Outflow
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-zinc-950 border-zinc-950 text-white font-bold'
                      : 'bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Inflow
                </button>
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">
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
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white focus:ring-1 focus:ring-zinc-950/10 rounded-lg transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition"
                />
              </div>
            </div>

            {/* Description & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Label / Merchant</label>
                <input
                  type="text"
                  placeholder="Starbucks, Rent deposit..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Category Select</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition appearance-none cursor-pointer font-sans font-medium"
                  >
                    {CATEGORIES[type].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes & Tags Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Tags (separated by commas)</label>
                <input
                  type="text"
                  placeholder="personal, bills, dining..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Notes / Ledger memo</label>
                <input
                  type="text"
                  placeholder="Optional annotations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition font-sans"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer border border-zinc-950"
            >
              <Plus className="w-4 h-4" /> 
              <span>Add Cash Item</span>
            </button>
          </form>
        )}

        {/* TAB 2: AI COGNITIVE SCANNER */}
        {activeTab === 'ai' && (
          <div className="space-y-4 font-sans">
            <div className="bg-zinc-950 text-zinc-100 border border-zinc-800 p-4 rounded-xl text-xs space-y-1.5 font-sans leading-relaxed">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>AI TRANSCRIPTION ACTIVE</span>
              </div>
              <p className="text-zinc-300 font-light font-sans">
                Paste receipt invoice lines, text snips, or arbitrary chats. Gemini parses structured merchant names, amounts, tags, and categories automatically.
              </p>
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">"grocery store 42.50 usd today"</span>
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">"Uber airport ride 75 JPY yesterday"</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase mb-1">Receipt text or transcription sentence</label>
              <textarea
                rows={5}
                placeholder="Paste receipt or type details... e.g., Spent 14.50 on salad bowls yesterday noon"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-zinc-55/5 border border-zinc-200 focus:outline-hidden focus:border-zinc-950 focus:bg-white rounded-lg transition font-sans resize-none"
              />
            </div>

            {aiError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleAiParse}
              className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-zinc-950"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Scanning text with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>Scan and Extract details</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
