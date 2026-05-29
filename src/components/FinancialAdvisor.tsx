import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Budget, FinancialGoal } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { Sparkles, Loader2, Send, ShieldCheck, Compass } from 'lucide-react';

interface FinancialAdvisorProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
}

export default function FinancialAdvisor({ transactions, budgets, goals }: FinancialAdvisorProps) {
  const { currency } = useCurrency();
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested prompt list for quick actions
  const SUGGESTED_QUESTIONS = [
    "Formulate a realistic wealth building strategy based on my transactions.",
    "Which category represents my largest leaking expense and how do I trim it?",
    "Evaluate if my budgets and active goals are aligned realistically.",
    "What general financial advice would you give for a portfolio like mine?"
  ];

  // Auto scroll down during convo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initial welcome advice from AI Advisor on mount
  useEffect(() => {
    if (messages.length === 0) {
      fetchAdvice("Evaluate my general current spending metrics and provide an initial welcome executive briefing.");
    }
  }, []);

  const fetchAdvice = async (promptString: string) => {
    setIsLoading(true);
    
    // Add user message to log if it's not the auto-initial on mount
    if (messages.length > 0) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: promptString }]);
    } else {
      // Just for loading initial
      setMessages([{ id: 'welcome-loading', role: 'assistant', text: "Analyzing your cashflow portfolio for an executive intelligence summary..." }]);
    }

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions,
          budgets,
          goals,
          userPrompt: promptString,
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          currencyRate: currency.rate
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Financial Advisor system error.");
      }

      const data = await response.json();
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'welcome-loading');
        return [
          ...filtered,
          { id: (Date.now() + 1).toString(), role: 'assistant', text: data.advice || "No advice formulated." }
        ];
      });
    } catch (error: any) {
      console.error(error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'welcome-loading');
        return [
          ...filtered,
          { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            text: `⚠️ **AI Advisor Not Available**\n\nCould not connect to the AI Financial Advisor. Please verify that your Gemini API key is set up correctly in your Settings.\n\nError: ${error.message}` 
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const requestText = inputPrompt.trim();
    setInputPrompt('');
    fetchAdvice(requestText);
  };

  // Extremely robust, beautiful and simple client-side rendering for markdown text
  const parseMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="text-xs font-bold text-zinc-900 mt-4 mb-2 first:mt-1 font-sans">{trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} className="text-xs font-bold text-zinc-950 mt-5 mb-2 first:mt-1 font-mono uppercase tracking-wider">{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} className="text-sm font-bold text-zinc-950 mt-6 mb-3 first:mt-1 font-mono uppercase tracking-widest">{trimmed.substring(2)}</h2>;
      }

      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.substring(2);
        return (
          <ul key={idx} className="list-disc list-inside ml-4 text-[11px] space-y-1 my-1.5 text-zinc-650 font-sans">
            <li>{renderStyledText(bulletText)}</li>
          </ul>
        );
      }

      // Blank paragraphs
      if (trimmed === '') {
        return <div key={idx} className="h-2.5" />;
      }

      return <p key={idx} className="text-[11px] text-zinc-600 leading-relaxed my-1.5 font-sans">{renderStyledText(line)}</p>;
    });
  };

  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-zinc-700">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px] items-stretch animate-fade-in font-sans">
      {/* Suggestions and metrics columns on left */}
      <div className="bg-white p-5 border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 leading-none">Portfolio Intelligence</h3>
            <p className="text-xs text-zinc-400 font-sans mt-1.5 font-light">Generate strategic cashflow reports instantly.</p>
          </div>

          <div className="space-y-3 font-sans">
            <div className="flex items-start gap-2.5 p-3.5 bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl text-xs leading-relaxed">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono text-emerald-400 text-[10px] uppercase tracking-wider">Active Workspace Context</span>
                <p className="text-[11px] text-zinc-300 font-light mt-0.5 font-sans">AI automatically reads {transactions.length} records, {budgets.length} spending allowances, and {goals.length} capital milestones to formulate custom advisories.</p>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-6">Intelligence Prompts</div>
            <div className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && fetchAdvice(q)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 text-[11px] text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 border border-zinc-200/55 rounded-xl transition duration-150 font-sans disabled:opacity-50 font-medium cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-[10px] text-zinc-400 font-sans font-light">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>Calculations and assets evaluations are processed securely and confidentially.</span>
        </div>
      </div>

      {/* Dialog box on right */}
      <div className="bg-white border border-zinc-200/50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] lg:col-span-2 flex flex-col h-full overflow-hidden">
        {/* Advisor Tab Header */}
        <div className="px-5 py-4 border-b border-zinc-200/40 bg-zinc-50/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-800 uppercase tracking-widest">Executive AI Advisor</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-250 text-zinc-700 text-[9px] font-mono font-bold uppercase tracking-wider">Ready</span>
        </div>

        {/* Message feeds */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px]"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${
                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`py-3 px-4 rounded-xl text-xs font-sans whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-zinc-950 text-white rounded-tr-none border border-zinc-950'
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-750 rounded-br-none prose prose-sm'
                }`}
              >
                {m.role === 'user' ? m.text : parseMarkdown(m.text)}
              </div>
              <span className="text-[9px] font-mono text-zinc-400 mt-1 px-1 font-bold">
                {m.role === 'user' ? 'CLIENT ME' : 'AI EXECUTIVE'}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 mr-auto text-zinc-400 text-xs py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500 shrink-0" />
              <span className="font-sans font-light">Analyzing cashflow trends...</span>
            </div>
          )}
        </div>

        {/* Form controls input */}
        <form onSubmit={handleSendPrompt} className="p-4 border-t border-zinc-200/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Query about cashflow, trim models, goal milestones or limits..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full text-xs py-2.5 px-3.5 bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-950 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-950/10 disabled:opacity-50 transition font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 bg-zinc-950 border border-zinc-950 text-white rounded-lg hover:bg-zinc-900 transition disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
