/**
 * Insight Series 多言語対応モジュール
 */

import { ja, TranslationKeys } from './ja';
import { en } from './en';

export type Locale = 'ja' | 'en';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

const translations: Record<Locale, TranslationKeys> = {
  ja,
  en: en as unknown as TranslationKeys,
};

let currentLocale: Locale = 'ja';

/**
 * 現在のロケールを設定
 */
export function setLocale(locale: Locale): void {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

/**
 * 現在のロケールを取得
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 利用可能なロケール一覧を取得
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * 翻訳文字列を取得
 * @param key ドット区切りのキー (例: "common.save")
 * @param params 置換パラメータ
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // キーが見つからない場合はキー自体を返す
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // パラメータ置換
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, param) =>
      params[param] !== undefined ? String(params[param]) : `{${param}}`
    );
  }

  return value;
}

/**
 * 特定のロケールで翻訳文字列を取得
 */
export function tLocale(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, param) =>
      params[param] !== undefined ? String(params[param]) : `{${param}}`
    );
  }

  return value;
}

/**
 * 日付フォーマット
 */
export function formatDate(
  date: Date,
  style: 'short' | 'medium' | 'long' = 'medium',
  locale?: Locale
): string {
  const loc = locale || currentLocale;
  const optionsMap: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  };
  const options = optionsMap[style];

  return new Intl.DateTimeFormat(loc === 'ja' ? 'ja-JP' : 'en-US', options).format(date);
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(amount: number, locale?: Locale): string {
  const loc = locale || currentLocale;
  const currency = loc === 'ja' ? 'JPY' : 'USD';

  return new Intl.NumberFormat(loc === 'ja' ? 'ja-JP' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 数値フォーマット
 */
export function formatNumber(value: number, locale?: Locale): string {
  const loc = locale || currentLocale;
  return new Intl.NumberFormat(loc === 'ja' ? 'ja-JP' : 'en-US').format(value);
}

// React用フック（オプション）
export { ja, en };
