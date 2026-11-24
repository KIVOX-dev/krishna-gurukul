import { useEffect, useState } from 'react';

const KEY = 'kg_theme';
type Mode = 'light' | 'dark' | 'system';
const read = (): Mode => { try { return (localStorage.getItem(KEY) as Mode) || 'system'; } catch { return 'system'; } };

export function applyTheme(m: Mode = read()) {
  const dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/** Dark mode for the parent app: follows the phone unless the parent picks. */
export function useTheme() {
  const [mode, setMode] = useState<Mode>(read);
  useEffect(() => {
    applyTheme(mode);
    const mq = window.matchMedia('(prefers-color-scheme: dark)'); const f = () => mode === 'system' && applyTheme('system');
    mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, [mode]);
  return { mode, dark: document.documentElement.classList.contains('dark'), setMode: (m: Mode) => { try { localStorage.setItem(KEY, m); } catch { /* ignore */ } setMode(m); } };
}
