import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Mascot, type Mood } from '../celebration/Mascot';
import { useToasts } from '../../store';
import { useDevice } from '../../hooks';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'blue' | 'sun' | 'ghost'; small?: boolean; loading?: boolean };
export function Button({ variant = 'primary', small, loading, className, children, disabled, ...p }: BtnProps) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ y: -2 }} className={cx(`btn-${variant}`, small && 'btn-sm', className)} disabled={disabled || loading} {...(p as any)}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </motion.button>
  );
}

export const Card = ({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => <div className={cx('card-pad', className)} {...p}>{children}</div>;

export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'gray' }) => {
  const t = { blue: 'bg-sky/15 text-navy', green: 'bg-mint/20 text-emerald-800', red: 'bg-red-100 text-red-700', yellow: 'bg-sun/25 text-amber-800', orange: 'bg-saffron/15 text-saffron', gray: 'bg-slate-200 text-slate-700' }[tone];
  return <span className={cx('chip', t)}>{children}</span>;
};
export const statusTone = (s: string) => (['paid', 'present', 'active', 'Joined'].includes(s) ? 'green' : ['overdue', 'absent', 'Not interested'].includes(s) ? 'red' : ['partial', 'late', 'Contacted', 'Demo booked'].includes(s) ? 'yellow' : s === 'New' ? 'orange' : 'blue') as any;

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('skeleton rounded-2xl', className ?? 'h-6 w-full')} />;
export const SkeletonList = ({ n = 5 }: { n?: number }) => <div className="space-y-3">{Array.from({ length: n }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>;

export function EmptyState({ title, hint, mood = 'idle', action }: { title: string; hint?: string; mood?: Mood; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-chunk border-2 border-dashed border-sky/30 bg-white/60 px-6 py-10 text-center">
      <Mascot mood={mood} size={90} />
      <p className="font-display text-xl font-bold text-navy">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink/70">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return <EmptyState mood="hug" title="Oops, that did not load" hint={(error as any)?.response?.data?.error ?? 'Please check your connection and try again.'} action={retry && <Button variant="blue" small onClick={retry}>Try again</Button>} />;
}

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block"><span className="label">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-ink/60">{hint}</span>}</label>
);
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx('input', p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx('input', p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx('input py-3', p.className)} />;

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const { isMobile } = useDevice();
  useEffect(() => { if (!open) return; const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-label={title} className={cx('max-h-[92vh] w-full overflow-y-auto bg-white p-5 shadow-2xl', isMobile ? 'rounded-t-[28px]' : 'rounded-chunk', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} initial={isMobile ? { y: '100%' } : { scale: 0.92, y: 20, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
            <div className="mb-4 flex items-center justify-between"><h3 className="text-2xl font-extrabold text-navy">{title}</h3><button aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sky/10"><X /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toaster() {
  const { items, drop } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex flex-col items-center gap-2 px-3" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} layout initial={{ y: -30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={() => drop(t.id)}
            className={cx('pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-pop', t.kind === 'ok' ? 'bg-mint' : t.kind === 'err' ? 'bg-red-500' : 'bg-navy')}>
            {t.kind === 'ok' ? <CheckCircle2 size={18} /> : t.kind === 'err' ? <AlertTriangle size={18} /> : <Info size={18} />}{t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export interface Col<T> { key: string; label: string; render?: (row: T) => ReactNode; sort?: (a: T, b: T) => number; hideMobile?: boolean; primary?: boolean }

/** Desktop: sortable table. Mobile: swipeable/stacked cards. */
export function DataTable<T extends Record<string, any>>({ rows, cols, onRow, actions, empty }: { rows: T[]; cols: Col<T>[]; onRow?: (r: T) => void; actions?: (r: T) => ReactNode; empty?: ReactNode }) {
  const { isDesktop } = useDevice();
  const [sortKey, setSortKey] = useStateSort();
  const sorted = (() => { const c = cols.find((c) => c.key === sortKey.key); return c?.sort ? [...rows].sort((a, b) => c.sort!(a, b) * sortKey.dir) : rows; })();
  if (!rows.length) return <>{empty ?? <EmptyState title="Nothing here yet" hint="Items you add will show up here." />}</>;
  if (!isDesktop)
    return (
      <div className="space-y-3">
        {sorted.map((r) => (
          <motion.div key={r._id ?? r.id} whileTap={{ scale: 0.98 }} onClick={() => onRow?.(r)} className="card p-4">
            {cols.filter((c) => !c.hideMobile).map((c) => (
              <div key={c.key} className={cx('flex items-start justify-between gap-3 py-0.5', c.primary && 'mb-1')}>
                {c.primary ? <span className="font-display text-lg font-bold text-navy">{c.render ? c.render(r) : (r as any)[c.key]}</span> : <><span className="text-xs font-bold uppercase text-ink/50">{c.label}</span><span className="text-right text-sm">{c.render ? c.render(r) : (r as any)[c.key]}</span></>}
              </div>
            ))}
            {actions && <div className="mt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>{actions(r)}</div>}
          </motion.div>
        ))}
      </div>
    );
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full">
        <thead className="bg-sky/5"><tr>{cols.map((c) => <th key={c.key} className={cx('th', c.sort && 'cursor-pointer select-none')} onClick={() => c.sort && setSortKey({ key: c.key, dir: sortKey.key === c.key ? ((sortKey.dir * -1) as 1 | -1) : 1 })}>{c.label}{sortKey.key === c.key ? (sortKey.dir === 1 ? ' ↑' : ' ↓') : ''}</th>)}{actions && <th className="th" />}</tr></thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r._id ?? r.id} className={cx('border-t border-sky/10 transition hover:bg-sky/5', onRow && 'cursor-pointer')} onClick={() => onRow?.(r)}>
              {cols.map((c) => <td key={c.key} className="td">{c.render ? c.render(r) : (r as any)[c.key]}</td>)}
              {actions && <td className="td" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2">{actions(r)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { useState } from 'react';
function useStateSort() { return useState<{ key: string; dir: 1 | -1 }>({ key: '', dir: 1 }); }

export const PageTitle = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>{sub && <p className="text-ink/60">{sub}</p>}</div>{right}
  </div>
);

export const Stat = ({ label, value, tone = 'blue', sub }: { label: string; value: ReactNode; tone?: 'blue' | 'orange' | 'green' | 'yellow'; sub?: string }) => (
  <div className="card relative overflow-hidden p-4">
    <div className={cx('absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20', { blue: 'bg-sky', orange: 'bg-saffron', green: 'bg-mint', yellow: 'bg-sun' }[tone])} />
    <p className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{label}</p>
    <p className="font-display text-2xl font-extrabold text-navy">{value}</p>{sub && <p className="text-xs text-ink/60">{sub}</p>}
  </div>
);
