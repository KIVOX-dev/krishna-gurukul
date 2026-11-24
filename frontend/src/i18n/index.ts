import { en, type Strings } from './en';

/** Dates and numbers follow the phone's language, defaulting to en-IN. */
export const locale = (): string => (typeof navigator !== 'undefined' && navigator.language && navigator.language.includes('-') ? navigator.language : 'en-IN');
export const fmtDate = (d: string | number | Date, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(d).toLocaleDateString(locale(), o);
export const fmtNum = (n: number) => n.toLocaleString(locale());
export const fmtMoney = (n: number) => new Intl.NumberFormat(locale(), { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

let dict: Strings = en; // a Tamil dictionary can replace this via setStrings(ta)
export const setStrings = (s: Strings) => { dict = s; };

/** t('settings.title'), t('lastUpdated', { time }) */
export function t(path: string, vars?: Record<string, string | number>): string {
  const v = path.split('.').reduce<any>((o, k) => o?.[k], dict);
  const s = typeof v === 'string' ? v : path;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : s;
}
