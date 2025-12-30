/**
 * i18n React フック
 */
import { useState, useCallback, useEffect } from 'react';
import {
  t as translate,
  setLocale as setGlobalLocale,
  getLocale,
  Locale,
  formatDate,
  formatCurrency,
  formatNumber,
} from '../common/i18n';

const LOCALE_STORAGE_KEY = 'insight_locale';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  // 初期化時にローカルストレージから読み込み
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') {
      setGlobalLocale(stored);
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setGlobalLocale(newLocale);
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, params);
    },
    [locale] // localeが変わったら関数を再生成
  );

  return {
    locale,
    setLocale,
    t,
    formatDate: (date: Date, style?: 'short' | 'medium' | 'long') =>
      formatDate(date, style, locale),
    formatCurrency: (amount: number) => formatCurrency(amount, locale),
    formatNumber: (value: number) => formatNumber(value, locale),
  };
}
