import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('smmneo_currency') || 'BDT';
    } catch (e) {
      return 'BDT';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('smmneo_currency', currency); } catch (e) {}
  }, [currency]);

  const BDT_PER_USD = 130;

  const convertToCurrency = (amountUSD, curr) => {
    if (!curr || curr === 'USD') return Number(amountUSD) || 0;
    if (curr === 'BDT') return Number(amountUSD) * BDT_PER_USD;
    return Number(amountUSD) || 0;
  };

  const formatCurrency = (amountUSD, curr) => {
    const val = convertToCurrency(amountUSD, curr);
    if (curr === 'BDT') return `BDT ${val.toFixed(2)}`;
    return `$${val.toFixed(4)}`;
  };

  const value = useMemo(() => ({ currency, setCurrency, BDT_PER_USD, convertToCurrency, formatCurrency }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
