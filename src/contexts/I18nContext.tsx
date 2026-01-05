import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  t as translate,
  setLocale as setGlobalLocale,
  getLocale,
  Locale,
  formatDate as formatDateUtil,
  formatCurrency as formatCurrencyUtil,
  formatNumber as formatNumberUtil,
} from '../common/i18n';

const LOCALE_STORAGE_KEY = 'insight_locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, style?: 'short' | 'medium' | 'long') => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (value: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') {
      setGlobalLocale(stored);
      return stored;
    }
    return getLocale();
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setGlobalLocale(newLocale);
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, params);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date, style?: 'short' | 'medium' | 'long') =>
      formatDateUtil(date, style, locale),
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyUtil(amount, locale),
    [locale]
  );

  const formatNumber = useCallback(
    (value: number) => formatNumberUtil(value, locale),
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        formatCurrency,
        formatNumber,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
