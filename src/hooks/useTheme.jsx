import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const themes = {
  dark: {
    '--bg-primary': '#0a0a0a',
    '--bg-secondary': '#141414',
    '--bg-tertiary': '#1e1e1e',
    '--bg-input': '#1e1e1e',
    '--bg-hover': '#262626',
    '--border-primary': '#262626',
    '--border-secondary': '#333',
    '--border-input': '#333',
    '--text-primary': '#fafafa',
    '--text-secondary': '#a3a3a3',
    '--text-muted': '#888',
    '--text-dim': '#666',
    '--text-faint': '#555',
    '--text-ghost': '#444',
    '--accent': '#f97316',
    '--accent-dark': '#ea580c',
    '--accent-light': '#fb923c',
    '--accent-bg': 'rgba(249,115,22,0.15)',
    '--accent-bg-subtle': 'rgba(249,115,22,0.1)',
    '--accent-border': 'rgba(249,115,22,0.3)',
    '--accent-shadow': 'rgba(249,115,22,0.3)',
    '--success': '#4ade80',
    '--success-dark': '#16a34a',
    '--success-bg': 'rgba(22,163,74,0.15)',
    '--success-border': 'rgba(22,163,74,0.3)',
    '--warning': '#facc15',
    '--warning-bg': 'rgba(234,179,8,0.15)',
    '--warning-border': 'rgba(234,179,8,0.25)',
    '--error': '#f87171',
    '--error-bg': 'rgba(220,38,38,0.1)',
    '--error-border': 'rgba(220,38,38,0.3)',
    '--scrollbar-thumb': '#333',
    '--scrollbar-hover': '#555',
    '--selection-bg': '#f97316',
  },
  light: {
    '--bg-primary': '#f8f9fa',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#f1f3f5',
    '--bg-input': '#ffffff',
    '--bg-hover': '#e9ecef',
    '--border-primary': '#dee2e6',
    '--border-secondary': '#ced4da',
    '--border-input': '#ced4da',
    '--text-primary': '#1a1a2e',
    '--text-secondary': '#495057',
    '--text-muted': '#6c757d',
    '--text-dim': '#868e96',
    '--text-faint': '#adb5bd',
    '--text-ghost': '#ced4da',
    '--accent': '#e8590c',
    '--accent-dark': '#d9480f',
    '--accent-light': '#f76707',
    '--accent-bg': 'rgba(232,89,12,0.1)',
    '--accent-bg-subtle': 'rgba(232,89,12,0.06)',
    '--accent-border': 'rgba(232,89,12,0.25)',
    '--accent-shadow': 'rgba(232,89,12,0.2)',
    '--success': '#2f9e44',
    '--success-dark': '#2b8a3e',
    '--success-bg': 'rgba(47,158,68,0.1)',
    '--success-border': 'rgba(47,158,68,0.2)',
    '--warning': '#e67700',
    '--warning-bg': 'rgba(230,119,0,0.1)',
    '--warning-border': 'rgba(230,119,0,0.2)',
    '--error': '#e03131',
    '--error-bg': 'rgba(224,49,49,0.08)',
    '--error-border': 'rgba(224,49,49,0.2)',
    '--scrollbar-thumb': '#ced4da',
    '--scrollbar-hover': '#adb5bd',
    '--selection-bg': '#e8590c',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('arctic-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[theme];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update body background + text
    document.body.style.background = vars['--bg-primary'];
    document.body.style.color = vars['--text-primary'];

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = vars['--bg-primary'];

    try {
      localStorage.setItem('arctic-theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
