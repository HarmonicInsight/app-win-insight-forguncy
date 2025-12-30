/**
 * Insight Series ブランドカラー定義
 */

export const colors = {
  // プライマリカラー（Insight Series共通）
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // メインカラー
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // セカンダリカラー
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  // アクセントカラー
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // 成功
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // 警告
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // エラー
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // グレースケール
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // 特殊色
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // グラデーション
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    dark: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
  },
};

// 製品別テーマカラー
export const productColors = {
  FGCY: {
    primary: colors.primary[600],
    secondary: colors.secondary[500],
    gradient: colors.gradients.primary,
  },
  SALES: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  },
  SLIDE: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
  PY: {
    primary: '#10b981',
    secondary: '#06b6d4',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  },
  INTV: {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  },
};

// セマンティックカラー
export const semantic = {
  // テキスト
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[400],
    inverse: colors.white,
    link: colors.primary[600],
    linkHover: colors.primary[700],
  },

  // 背景
  background: {
    primary: colors.white,
    secondary: colors.gray[50],
    tertiary: colors.gray[100],
    inverse: colors.gray[900],
  },

  // ボーダー
  border: {
    light: colors.gray[200],
    medium: colors.gray[300],
    dark: colors.gray[400],
    focus: colors.primary[500],
  },

  // 状態
  state: {
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.primary[500],
  },

  // レビュー重要度
  severity: {
    high: colors.error[500],
    medium: colors.warning[500],
    low: colors.warning[300],
  },
};

export type ColorKey = keyof typeof colors;
export type ProductCode = keyof typeof productColors;
