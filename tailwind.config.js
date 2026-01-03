/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        surface: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        content: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          muted: '#DBEAFE',
        },
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
          muted: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
          dark: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'medium': '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 4px 6px -1px rgb(0 0 0 / 0.08)',
        'card': '0 0 0 1px rgb(0 0 0 / 0.03), 0 1px 2px rgb(0 0 0 / 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
