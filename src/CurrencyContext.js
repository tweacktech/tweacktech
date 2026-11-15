import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext(null);

const FALLBACK_RATES = {
  USD: 1,
  NGN: 1600,
  GHS: 15.5,
  GBP: 0.79,
  EUR: 0.92,
};

const FALLBACK_META = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
};

const STORAGE_KEY = 'tweacktech-currency';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

export const CurrencyProvider = ({ children }) => {
  const { api } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const [selected, setSelected] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'NGN',
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/currencies')
      .then((res) => {
        if (cancelled) return;
        const list = unwrap(res);
        if (Array.isArray(list) && list.length) setCurrencies(list);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api]);

  const changeCurrency = useCallback((code) => {
    setSelected(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const rates = useMemo(() => {
    const map = { ...FALLBACK_RATES };
    currencies.forEach((currency) => {
      map[currency.code] = Number(currency.rateFromUsd) || map[currency.code] || 1;
    });
    return map;
  }, [currencies]);

  const meta = useMemo(() => {
    const map = { ...FALLBACK_META };
    currencies.forEach((currency) => {
      map[currency.code] = currency;
    });
    return map;
  }, [currencies]);

  const convert = useCallback(
    (amount, from = 'USD', to = selected) => {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric)) return 0;
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      return (numeric / fromRate) * toRate;
    },
    [rates, selected],
  );

  const formatIn = useCallback(
    (amount, currency = 'USD') => {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric)) return '—';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(numeric);
      } catch {
        return `${meta[currency]?.symbol || currency} ${numeric.toFixed(2)}`;
      }
    },
    [meta],
  );

  const format = useCallback(
    (amount, from = 'USD') => {
      const converted = convert(amount, from, selected);
      return formatIn(converted, selected);
    },
    [convert, formatIn, selected],
  );

  const value = {
    currencies: currencies.length
      ? currencies
      : Object.values(FALLBACK_META).map((currency) => ({
          ...currency,
          rateFromUsd: FALLBACK_RATES[currency.code],
          isActive: true,
        })),
    selected,
    selectedMeta: meta[selected] || FALLBACK_META.USD,
    setCurrency: changeCurrency,
    rates,
    loading,
    convert,
    format,
    formatIn,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
