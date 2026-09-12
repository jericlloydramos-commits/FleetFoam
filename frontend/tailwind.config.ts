import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-card': 'rgb(var(--surface-card) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'brand-blue': '#0284c7',
        slate: {
          header: '#0f172a',
          body: '#334155',
          muted: '#64748b',
          border: 'rgb(var(--border) / <alpha-value>)',
          subtle: '#f8fafc',
        },
        status: {
          scheduled: 'rgb(var(--status-scheduled) / <alpha-value>)',
          ontheway: 'rgb(var(--status-ontheway) / <alpha-value>)',
          arrived: 'rgb(var(--status-arrived) / <alpha-value>)',
          inprogress: 'rgb(var(--status-inprogress) / <alpha-value>)',
          completed: 'rgb(var(--status-completed) / <alpha-value>)',
          delayed: 'rgb(var(--status-delayed) / <alpha-value>)',
          cancelled: 'rgb(var(--status-cancelled) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
