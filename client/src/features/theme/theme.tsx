// ©️ Mewn — Wabi Theme Switcher (5 variants)
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeId = 'sabi' | 'minimal' | 'kintsugi' | 'nordic' | 'ink';

export interface WabiTheme {
  id: ThemeId;
  label: string;
  hint: string;
  emoji: string;
  swatch: string; // for switcher pill
}

export const WABI_THEMES: WabiTheme[] = [
  {
    id: 'sabi',
    label: 'Sabi',
    hint: 'Cozy paper · grain',
    emoji: '🍂',
    swatch: 'linear-gradient(135deg, #FDF8F0 0%, #E8DCCB 50%, #C48849 100%)',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Clean monochrome',
    emoji: '◻️',
    swatch: 'linear-gradient(135deg, #FFFFFF 0%, #E5E5E5 100%)',
  },
  {
    id: 'kintsugi',
    label: 'Kintsugi',
    hint: 'Ink + gold crack',
    emoji: '✨',
    swatch: 'linear-gradient(135deg, #141412 0%, #D4AF37 100%)',
  },
  {
    id: 'nordic',
    label: 'Nordic',
    hint: 'Pale oak · sage',
    emoji: '🌿',
    swatch: 'linear-gradient(135deg, #F7F5F0 0%, #9CAF88 100%)',
  },
  {
    id: 'ink',
    label: 'Ink Wash',
    hint: 'Sumi · rice paper',
    emoji: '🖋️',
    swatch: 'linear-gradient(135deg, #FFFEFB 0%, #2B2B2B 100%)',
  },
];

const STORAGE_KEY = 'candid_wabi_theme';
const DEFAULT_THEME: ThemeId = 'sabi';

function isThemeId(v: unknown): v is ThemeId {
  return WABI_THEMES.some((t) => t.id === v);
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: WabiTheme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isThemeId(stored)) return stored;
    } catch {}
    // Respect prefers-color-scheme for kintsugi hint, but default to sabi
    return DEFAULT_THEME;
  });

  const setTheme = useCallback((id: ThemeId) => {
    if (!isThemeId(id)) return;
    setThemeState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', theme);
    // Also set a class for Tailwind overrides if needed
    el.classList.remove(...WABI_THEMES.map((t) => `theme-${t.id}`));
    el.classList.add(`theme-${theme}`);
  }, [theme]);

  // On mount, sync attribute immediately (avoid FOUC)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: WABI_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export const ThemeSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme, themes } = useTheme();
  return (
    <div className={compact ? 'flex items-center gap-1.5' : 'card p-3 sm:p-4 border-paper-border/90 bg-paper-100/95 shadow-cozy animate-in'}>
      {!compact && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 uppercase tracking-wider">
            <span>🎨 Wabi Style</span>
            <span className="font-normal normal-case text-ink-500">(theme)</span>
          </div>
          <span className="text-[11px] font-mono text-ink-500">Live switch</span>
        </div>
      )}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="radiogroup" aria-label="Wabi style">
        {themes.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              role="radio"
              aria-checked={active}
              aria-label={`${t.label} — ${t.hint}`}
              title={`${t.label} — ${t.hint}`}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-organic-sm transition-all ${active ? 'bg-paper-200 ring-2 ring-clay scale-105 shadow-sm' : 'hover:bg-paper-200/50 opacity-80 hover:opacity-100'}`}
            >
              <span className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm shadow-inner ${active ? 'border-clay' : 'border-white'}`} style={{ background: t.swatch }} aria-hidden="true">
                <span className={active ? '' : 'opacity-80'}>{t.emoji}</span>
              </span>
              <span className={`text-[11px] font-medium ${active ? 'text-ink-900' : 'text-ink-700'}`}>{t.label}</span>
              {!compact && <span className="text-[9px] text-ink-500 leading-none">{t.hint}</span>}
            </button>
          );
        })}
      </div>
      {!compact && <p className="text-[11px] text-ink-500 text-center mt-2">Current: <span className="font-medium text-ink-700">{themes.find((t) => t.id === theme)?.label}</span> — {themes.find((t) => t.id === theme)?.hint} · saved to localStorage</p>}
    </div>
  );
};
