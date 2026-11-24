import { useEffect, useState } from 'react';
import { useAuth } from '../store';

/** Mobile vs desktop layout switch at 1024px. */
export function useDevice() {
  const q = '(min-width: 1024px)';
  const [desktop, setDesktop] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia(q).matches));
  useEffect(() => {
    const m = window.matchMedia(q); const f = () => setDesktop(m.matches);
    m.addEventListener('change', f); return () => m.removeEventListener('change', f);
  }, []);
  return { isDesktop: desktop, isMobile: !desktop };
}

export const useUser = () => useAuth((s) => s.user);

/** Countdown in ms that ticks every 250ms. */
export function useCountdown(totalMs: number | null, onEnd?: () => void) {
  const [left, setLeft] = useState(totalMs ?? 0);
  useEffect(() => {
    if (totalMs === null) return;
    const end = Date.now() + totalMs; let fired = false;
    setLeft(totalMs);
    const id = setInterval(() => {
      const l = Math.max(0, end - Date.now()); setLeft(l);
      if (l === 0 && !fired) { fired = true; clearInterval(id); onEnd?.(); }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMs]);
  return left;
}

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}
