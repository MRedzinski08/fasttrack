import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  'modern-dark': { label: 'Modern Dark', type: 'dark', accent: '#FFAA00' },
  'modern-dark-plus': { label: 'Modern Dark +', type: 'dark', accent: '#4D9BFF' },
  'punk-dark': { label: 'Punk Dark', type: 'dark', accent: '#FF2D78' },
  'punk-dark-plus': { label: 'Punk Dark +', type: 'dark', accent: '#00FF88' },
  'warm-light': { label: 'Warm Light', type: 'light', accent: '#C44B2C' },
  'pastel-pink': { label: 'Pastel', type: 'light', accent: '#D4587A' },
  'pastel-blue': { label: 'Pastel 2', type: 'light', accent: '#3B6BA5' },
  'pastel-yellow': { label: 'Pastel 3', type: 'light', accent: '#B8860B' },
  'pinkout': { label: 'Pinkout', type: 'light', accent: '#E6005C' },
  'tropical': { label: 'Tropical', type: 'light', accent: '#E06050' },
  'forest': { label: 'Forest', type: 'light', accent: '#5C4033' },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ft-theme') || 'modern-dark');

  useEffect(() => {
    localStorage.setItem('ft-theme', theme);
    const info = THEMES[theme] || THEMES['modern-dark'];
    document.documentElement.setAttribute('data-theme', theme);
    // Also set the type for the light-mode CSS overrides
    document.documentElement.setAttribute('data-theme-type', info.type);
  }, [theme]);

  const info = THEMES[theme] || THEMES['modern-dark'];
  const isDark = info.type === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, themes: THEMES, info }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
