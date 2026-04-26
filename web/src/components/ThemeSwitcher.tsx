import { useEffect, useRef, useState } from 'react';
import { THEMES, type ThemeId } from '../hooks/useTheme.ts';

type Props = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
};

export function ThemeSwitcher({ theme, setTheme }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const current = THEMES.find(t => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher" ref={ref}>
      <button
        className="theme-switcher-btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Choose theme"
      >
        <span className="theme-switcher-dot" />
        <span className="theme-switcher-name">{current.name}</span>
        <span className="theme-switcher-caret">▾</span>
      </button>
      {open && (
        <ul className="theme-switcher-menu" role="menu">
          {THEMES.map(t => (
            <li key={t.id}>
              <button
                className={`theme-switcher-item${t.id === theme ? ' is-active' : ''}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                role="menuitem"
              >
                <span className={`theme-swatch swatch-${t.id}`} />
                <span className="theme-switcher-item-name">{t.name}</span>
                <span className="theme-switcher-item-mode">{t.mode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
