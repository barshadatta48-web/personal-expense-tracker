import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini Client as recommended
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 1. API: AI Analytics & Recommendations (Financial Advisor)
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { 
      transactions, 
      budgets, 
      goals, 
      userPrompt, 
      currencyCode = 'USD', 
      currencySymbol = '$', 
      currencyRate = 1.0 
    } = req.body;
    
    const client = getGeminiClient();

    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categoryTotals: {} as Record<string, number>,
    };

    if (Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          stats.totalIncome += amt;
        } else {
          stats.totalExpense += amt;
          stats.categoryTotals[t.category] = (stats.categoryTotals[t.category] || 0) + amt;
        }
      });
      stats.balance = stats.totalIncome - stats.totalExpense;
    }

    // Convert underlying USD amounts to user's configured currency for accurate recommendations
    const convertedIncome = stats.totalIncome * currencyRate;
    const convertedExpense = stats.totalExpense * currencyRate;
    const convertedBalance = stats.balance * currencyRate;

    // Convert category summaries
    const convertedCategories: Record<string, string> = {};
    Object.entries(stats.categoryTotals).forEach(([cat, val]) => {
      convertedCategories[cat] = `${currencySymbol}${(val * currencyRate).toFixed(2)}`;
    });

    const systemPrompt = `You are a premium, friendly, and highly intelligent AI Financial Advisor companion.
Analyze the user's spending habits, income, budget constraints, and financial goals. Provide targeted wealth-building tips, budget alerts (if their expenses in a category exceed their budget limits), savings ideas, and general advice.
Keep your analysis tailored, professional, and clear. Break it down using beautiful Markdown formatting.

The user's preferred display currency is ${currencyCode} (${currencySymbol}). ALWAYS display all monetary sums, metrics, budgets, goals, and recommended values in ${currencyCode} using ${currencySymbol} formats! 
(For example, show "${currencySymbol}500" or "${currencySymbol}500.00" inside the text). Do NOT show raw USD symbols or values unless you explicitly state that it is USD.

Here are the user portfolio metrics (converted to their preferred currency ${currencyCode}):
- Total Income: ${currencySymbol}${convertedIncome.toFixed(2)} ${currencyCode}
- Total Expenses: ${currencySymbol}${convertedExpense.toFixed(2)} ${currencyCode}
- Net Savings/Balance: ${currencySymbol}${convertedBalance.toFixed(2)} ${currencyCode}
- Top Expense Categories (converted): ${JSON.stringify(convertedCategories)}
- Configured Category Budgets (original limit stored in USD): ${JSON.stringify((budgets || []).map((b: any) => ({ ...b, limitInPreferredCurrency: `${currencySymbol}${(b.limit * currencyRate).toFixed(2)}` })))}
- Active Financial Goals (original amounts stored in USD): ${JSON.stringify((goals || []).map((g: any) => ({ ...g, currentInPreferred: `${currencySymbol}${(g.currentAmount * currencyRate).toFixed(2)}`, targetInPreferred: `${currencySymbol}${(g.targetAmount * currencyRate).toFixed(2)}` })))}

Provide detailed feedback and insights. Respond with encouraging, clear, and action-oriented points in their preferred currency (${currencyCode}). If the user asked a specific question, answer it directly with high accuracy. Avoid overly technical or speculative stock advice. Include concrete tips on how they can improve.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt ? `${systemPrompt}\n\nUser Question: ${userPrompt}` : systemPrompt,
    });

    res.json({ advice: response.text });
  } catch (error: any) {
    console.error("Advisor generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate financial advice." });
  }
});

// 2. API: Receipt Scanner & Text Natural Language Transaction Parser
app.post("/api/gemini/parse-receipt", async (req, res) => {
  try {
    const { text, currentDate } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Input text is required for parsing." });
    }

    const client = getGeminiClient();

    const allowedCategories = [
      'Food & Beverage',
      'Shopping',
      'Housing & Rent',
      'Transportation',
      'Utilities & Bills',
      'Entertainment & Leisure',
      'Healthcare & Insurance',
      'Education',
      'Travel',
      'Gifts & Donations',
      'Miscellaneous Expense',
      'Salary & Wages',
      'Freelance & Consulting',
      'Investments & Dividends',
      'Business Revenue',
      'Gifts & Grants',
      'Refunds',
      'Miscellaneous Income'
    ];

    const prompt = `Parse the following receipt content or natural language input into a transaction object. 
Current date is ${currentDate || new Date().toISOString().split('T')[0]}.
Input to parse: "${text}"

Determine:
1. Amount (strictly positive number)
2. Category (Must be exactly one of: ${allowedCategories.map(c => `"${c}"`).join(', ')})
3. Type ('income' or 'expense'. E.g. salaries, freelance, refunds are income. Coffee, taxi, rent, groceries are expense)
4. Description (merchant name, details, or summarized item)
5. Date (YYYY-MM-DD. Guess or use current date if not clear)
6. Notes (any additional useful detail found)
7. Tags (array of short string tags, e.g., ["dining", "coffee"], or ["work"])`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.NUMBER,
              description: "The parsed transaction amount. Must be positive."
            },
            category: {
              type: Type.STRING,
              description: `Must be exactly one of: ${allowedCategories.join(', ')}`
            },
            type: {
              type: Type.STRING,
              description: "Whether it is income or expense. Must be either 'income' or 'expense'."
            },
            description: {
              type: Type.STRING,
              description: "The name of the vendor, merchant, or key item details."
            },
            date: {
              type: Type.STRING,
              description: "The date of the transaction in YYYY-MM-DD format."
            },
            notes: {
              type: Type.STRING,
              description: "Optional added notes, e.g., detail about payment method or items purchased."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of simple single-word category/topic tags (e.g., ['breakfast', 'grocery'])."
            }
          },
          required: ["amount", "category", "type", "description", "date"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Receipt parsing error:", error);
    res.status(500).json({ error: error.message || "Failed to parse receipt text." });
  }
});

// Serve frontend assets & Vite configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
