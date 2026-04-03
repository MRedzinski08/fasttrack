import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  'modern-dark': {
    label: 'Modern Dark', type: 'dark', accent: '#FFAA00',
    timer: {
      fasting: { color: '#4ADE80', extrude: '#1A5C32', glow: '74,222,128' },
      eating:  { color: '#FFAA00', extrude: '#664400', glow: '255,170,0' },
      warning: { color: '#F59E0B', extrude: '#5C3D06', glow: '245,158,11' },
    },
  },
  'modern-dark-plus': {
    label: 'Modern Dark +', type: 'dark', accent: '#4D9BFF',
    timer: {
      fasting: { color: '#2DD4BF', extrude: '#115E54', glow: '45,212,191' },
      eating:  { color: '#4D9BFF', extrude: '#1A3D66', glow: '77,155,255' },
      warning: { color: '#A78BFA', extrude: '#3D2E66', glow: '167,139,250' },
    },
  },
  'punk-dark': {
    label: 'Punk Dark', type: 'dark', accent: '#FF2D78',
    timer: {
      fasting: { color: '#C084FC', extrude: '#4A1E66', glow: '192,132,252' },
      eating:  { color: '#FF2D78', extrude: '#661230', glow: '255,45,120' },
      warning: { color: '#FB923C', extrude: '#663A18', glow: '251,146,60' },
    },
  },
  'punk-dark-plus': {
    label: 'Punk Dark +', type: 'dark', accent: '#00FF88',
    timer: {
      fasting: { color: '#00FF88', extrude: '#004D29', glow: '0,255,136' },
      eating:  { color: '#22D3EE', extrude: '#0D4D5C', glow: '34,211,238' },
      warning: { color: '#FACC15', extrude: '#5C4D06', glow: '250,204,21' },
    },
  },
  'warm-light': {
    label: 'Warm Light', type: 'light', accent: '#C44B2C',
    timer: {
      fasting: { color: '#0D9488', extrude: '#085C54', glow: '13,148,136' },
      eating:  { color: '#C44B2C', extrude: '#7A2E1B', glow: '196,75,44' },
      warning: { color: '#D97706', extrude: '#8A4C04', glow: '217,119,6' },
    },
  },
  'pastel-pink': {
    label: 'Pastel', type: 'light', accent: '#D4587A',
    timer: {
      fasting: { color: '#0891B2', extrude: '#055B70', glow: '8,145,178' },
      eating:  { color: '#D4587A', extrude: '#8A3650', glow: '212,88,122' },
      warning: { color: '#C2410C', extrude: '#7A2908', glow: '194,65,12' },
    },
  },
  'pastel-blue': {
    label: 'Pastel 2', type: 'light', accent: '#3B6BA5',
    timer: {
      fasting: { color: '#059669', extrude: '#035E42', glow: '5,150,105' },
      eating:  { color: '#3B6BA5', extrude: '#254368', glow: '59,107,165' },
      warning: { color: '#7C3AED', extrude: '#4E2496', glow: '124,58,237' },
    },
  },
  'pastel-yellow': {
    label: 'Pastel 3', type: 'light', accent: '#B8860B',
    timer: {
      fasting: { color: '#16A34A', extrude: '#0D662E', glow: '22,163,74' },
      eating:  { color: '#B8860B', extrude: '#745407', glow: '184,134,11' },
      warning: { color: '#EA580C', extrude: '#943808', glow: '234,88,12' },
    },
  },
  'pinkout': {
    label: 'Pinkout', type: 'light', accent: '#E6005C',
    timer: {
      fasting: { color: '#7C3AED', extrude: '#4E2496', glow: '124,58,237' },
      eating:  { color: '#E6005C', extrude: '#90003A', glow: '230,0,92' },
      warning: { color: '#EA580C', extrude: '#943808', glow: '234,88,12' },
    },
  },
  'tropical': {
    label: 'Tropical', type: 'light', accent: '#E06050',
    timer: {
      fasting: { color: '#0891B2', extrude: '#055B70', glow: '8,145,178' },
      eating:  { color: '#E06050', extrude: '#8C3C32', glow: '224,96,80' },
      warning: { color: '#D97706', extrude: '#8A4C04', glow: '217,119,6' },
    },
  },
  'forest': {
    label: 'Forest', type: 'light', accent: '#5C4033',
    timer: {
      fasting: { color: '#15803D', extrude: '#0D5026', glow: '21,128,61' },
      eating:  { color: '#5C4033', extrude: '#3A2820', glow: '92,64,51' },
      warning: { color: '#B45309', extrude: '#703406', glow: '180,83,9' },
    },
  },
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
