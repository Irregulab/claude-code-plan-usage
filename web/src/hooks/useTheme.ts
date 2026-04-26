import { useEffect, useState } from 'react';

export const THEMES = [
  { id: 'midnight',  name: 'Midnight',  mode: 'dark'  as const },
  { id: 'solar',     name: 'Solar',     mode: 'light' as const },
  { id: 'terminal',  name: 'Terminal',  mode: 'dark'  as const },
  { id: 'paper',     name: 'Paper',     mode: 'light' as const },
  { id: 'synthwave', name: 'Synthwave', mode: 'dark'  as const },
];

export type ThemeId = typeof THEMES[number]['id'];

const STORAGE_KEY = 'cc-usage-theme';
const DEFAULT_THEME: ThemeId = 'midnight';

function isThemeId(v: string | null): v is ThemeId {
  return !!v && THEMES.some(t => t.id === v);
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
