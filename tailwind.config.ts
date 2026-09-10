import type { Config } from 'tailwindcss';

/**
 * Дизайн-система Fattakhov HR Agency.
 *
 * Бренд монохромный: графит знака #2F3337, бумага #F8F8F8, чистый чёрный
 * как основа полотна. Единственный цвет — серо-голубой #546E88; он же
 * задаёт температуру всех нейтралей, поэтому шкала graphite не серая,
 * а чуть холодная. Чистый серый рядом с фирменным графитом выглядит
 * грязным.
 *
 * Зелёный существует ровно в одном месте — подсветка свайпа вправо.
 * Это не часть палитры бренда, а сигнал «действие засчитано».
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F8F8F8',
          dim: 'rgba(248,248,248,0.62)',
          faint: 'rgba(248,248,248,0.38)',
        },
        ink: {
          DEFAULT: '#000000',
          raise: '#08090A',
          deep: '#050506',
        },
        graphite: {
          950: '#0B0C0D',
          900: '#121415',
          850: '#181A1C',
          800: '#1E2124',
          750: '#26292D',
          700: '#2F3337',
          600: '#3D4247',
          500: '#4E545A',
          400: '#6B7278',
          300: '#8D949A',
          200: '#B4BABF',
          100: '#D9DDE0',
        },
        accent: {
          950: '#121A22',
          900: '#1B2530',
          800: '#26333F',
          700: '#334556',
          600: '#43596F',
          500: '#546E88',
          400: '#6E88A2',
          300: '#8DA3B9',
          200: '#B0C0D0',
          100: '#D3DCE5',
        },
        yes: {
          DEFAULT: '#4FA37F',
          glow: '#71D9AC',
          deep: '#1C3A2F',
        },
        no: {
          DEFAULT: '#5A5F64',
          deep: '#17191B',
        },
        warn: '#C9A227',
        danger: '#B4534F',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Дисплейная шкала на clamp: заголовки должны дышать на десктопе
        // и не ломать перенос на 360px.
        'display-xl': ['clamp(2.75rem, 7.2vw, 6rem)', { lineHeight: '0.94', letterSpacing: '-0.045em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 5.4vw, 4rem)', { lineHeight: '0.98', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-md': ['clamp(1.75rem, 3.6vw, 2.75rem)', { lineHeight: '1.04', letterSpacing: '-0.032em', fontWeight: '600' }],
        'display-sm': ['clamp(1.375rem, 2.4vw, 1.875rem)', { lineHeight: '1.12', letterSpacing: '-0.024em', fontWeight: '600' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em', fontWeight: '500' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        hairline: 'inset 0 1px 0 0 rgba(248,248,248,0.07)',
        card: '0 1px 0 0 rgba(248,248,248,0.06) inset, 0 2px 6px -1px rgba(0,0,0,0.7), 0 28px 64px -24px rgba(0,0,0,0.95)',
        lift: '0 1px 0 0 rgba(248,248,248,0.09) inset, 0 4px 12px -2px rgba(0,0,0,0.8), 0 44px 96px -32px rgba(0,0,0,1)',
        'glow-accent': '0 0 0 1px rgba(110,136,162,0.35), 0 8px 32px -8px rgba(84,110,136,0.55)',
        'glow-yes': '0 0 0 1px rgba(113,217,172,0.45), 0 12px 48px -10px rgba(79,163,127,0.5)',
        inset: 'inset 0 1px 2px 0 rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        glass: '24px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quint': 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'aurora-drift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -3%, 0) scale(1.08)' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
        'caret-blink': 'caret-blink 1.2s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
