import { createContext, useContext, useEffect, useState } from 'react';
import { brand } from '../config/brand';
import { load, save } from '../lib/storage';

const ThemeContext = createContext(null);

function applyTheme(themeName) {
  const t = brand.themes[themeName];
  const r = document.documentElement.style;
  document.documentElement.dataset.theme = themeName;
  r.setProperty('--bg', t.bg);
  r.setProperty('--surface', t.surface);
  r.setProperty('--surface2', t.surface2);
  r.setProperty('--border', t.border);
  r.setProperty('--text', t.text);
  r.setProperty('--soft', t.soft);
  r.setProperty('--accent', t.accent);
  r.setProperty('--accent-dark', t.accentDark);
  r.setProperty('--teal', t.teal);
  r.setProperty('--amber', t.amber);
  r.setProperty('--red', t.red);
  r.setProperty('--green', t.green);
  r.setProperty('--on-accent', t.onAccent);
  r.setProperty('--shadow', t.shadow);
  r.setProperty('--radius', brand.radius);
  r.setProperty('--max-width', brand.maxWidth);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = load('theme');
    if (saved && brand.themes[saved]) return saved;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => applyTheme(theme), [theme]);

  const setTheme = (t) => {
    if (brand.themes[t]) {
      setThemeState(t);
      save('theme', t);
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
