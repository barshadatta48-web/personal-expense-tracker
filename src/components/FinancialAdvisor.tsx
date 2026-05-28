import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Budget, FinancialGoal } from '../types';
import { Sparkles, MessageSquare, Loader2, Send, ShieldCheck, PieChart, TrendingUp, Compass } from 'lucide-react';

interface FinancialAdvisorProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
}

export default function FinancialAdvisor({ transactions, budgets, goals }: FinancialAdvisorProps) {
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
          userPrompt: promptString
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Financial Advisor system error.");
      }

      const data = await response.json();
      
      setMessages(prev => {
        // filter out welcome placeholder
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
            text: `⚠️ **Service Access Interrupted**\n\nCould not access the AI Financial Planning server. Please make sure your **GEMINI_API_KEY** is configured correctly in the Secrets panel.\n\nError: ${error.message}` 
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
        return <h4 key={idx} className="text-sm font-bold text-gray-800 mt-4 mb-2 first:mt-1">{trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-display font-semibold text-emerald-800 mt-5 mb-2 first:mt-1">{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-display font-bold text-emerald-900 mt-6 mb-3 first:mt-1">{trimmed.substring(2)}</h2>;
      }

      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.substring(2);
        return (
          <ul key={idx} className="list-disc list-inside ml-4 text-xs space-y-1 my-1.5 text-gray-600">
            <li>{renderStyledText(bulletText)}</li>
          </ul>
        );
      }

      // Blank paragraphs
      if (trimmed === '') {
        return <div key={idx} className="h-2.5" />;
      }

      return <p key={idx} className="text-xs text-gray-600 leading-relaxed my-1.5">{renderStyledText(line)}</p>;
    });
  };

  const renderStyledText = (text: string) => {
    // Process markdown italics and bold replacements
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-gray-800">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px] items-stretch">
      {/* Suggestions and metrics columns on left */}
      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-xs lg:col-span-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-display font-semibold text-gray-800">AI Planner Intelligence</h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">Custom analysis powered by Gemini cognitive processing</p>
          </div>

          <div className="space-y-3 font-sans">
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
              <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Portfolio ground truth</span>
                <p className="text-[11px] text-emerald-700/90 mt-0.5">The advisor scans active transactions: {transactions.length} records, {budgets.length} budget benchmarks, and {goals.length} target milestones.</p>
              </div>
            </div>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5">Suggestions Toolbox</div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && fetchAdvice(q)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 text-xs text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-xl transition duration-150 font-sans disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px] text-gray-400 font-sans">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Local client isolated processing. Transactions are dispatched server-side anonymously to safeguard user files.</span>
        </div>
      </div>

      {/* Dialog box on right */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs lg:col-span-2 flex flex-col h-full overflow-hidden">
        {/* Advisor Tab Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-gray-800 tracking-wide font-sans uppercase">Gemini Planner Consultation Port</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold uppercase tracking-wider">Active</span>
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
                className={`py-3 px-4 rounded-2xl text-xs font-sans shadow-2xs whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-bl-none prose prose-sm'
                }`}
              >
                {m.role === 'user' ? m.text : parseMarkdown(m.text)}
              </div>
              <span className="text-[10px] text-gray-400 font-mono mt-1 px-1">
                {m.role === 'user' ? 'Client' : 'Gemini Advisor'}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 mr-auto text-gray-400 text-xs py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing financial vector matrices...</span>
            </div>
          )}
        </div>

        {/* Form controls input */}
        <form onSubmit={handleSendPrompt} className="p-4 border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask specific budgeting, cashflow query..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full text-xs py-2.5 px-3.5 bg-gray-50 focus:bg-white border border-gray-100 focus:border-emerald-600 rounded-xl focus:outline-hidden disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
