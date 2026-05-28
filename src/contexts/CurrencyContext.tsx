import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Conversion rate relative to USD (1 USD = rate)
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', rate: 1.0, label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', rate: 0.92, label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', rate: 0.79, label: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', rate: 83.1, label: 'Indian Rupee (₹)' },
  { code: 'JPY', symbol: '¥', rate: 156.4, label: 'Japanese Yen (¥)' }
];

interface CurrencyContextType {
  currency: Currency;
  setCurrencyByCode: (code: string) => void;
  formatRaw: (amountInUSD: number, decimals?: number) => string;
  toActiveCurrency: (amountInUSD: number) => number;
  fromActiveCurrency: (amountInActive: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('expense_tracker_currency_code');
    if (saved) {
      const match = CURRENCIES.find(c => c.code === saved);
      if (match) return match;
    }
    return CURRENCIES[0]; // Default USD
  });

  const setCurrencyByCode = (code: string) => {
    const match = CURRENCIES.find(c => c.code === code);
    if (match) {
      setCurrencyState(match);
      localStorage.setItem('expense_tracker_currency_code', code);
    }
  };

  // Converts a base USD amount to the currently active currency
  const toActiveCurrency = (amountInUSD: number): number => {
    return amountInUSD * currency.rate;
  };

  // Converts an entered active currency amount back to base USD for database storage
  const fromActiveCurrency = (amountInActive: number): number => {
    return amountInActive / currency.rate;
  };

  // Formats a base USD amount to the active currency string with its symbol
  const formatRaw = (amountInUSD: number, decimals: number = 2): string => {
    const activeVal = toActiveCurrency(amountInUSD);
    
    // For Japanese Yen, usually display 0 decimal places
    const finalDecimals = currency.code === 'JPY' && decimals === 2 ? 0 : decimals;

    return `${currency.symbol}${activeVal.toLocaleString(undefined, {
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrencyByCode,
      formatRaw,
      toActiveCurrency,
      fromActiveCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
