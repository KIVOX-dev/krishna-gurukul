import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useBreakpoint } from './useBreakpoint';
import { setBars } from '../native/feel';
import { OfflineBanner } from './NativeChrome';

export interface NavItem { to: string; label: string; icon: ReactNode; badge?: number }

const cls = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');

/**
 * One shell, three navigations by width:
 *  < 840 px  bottom tab bar (thumb zone, 56dp targets)   840-1199 px navigation rail   >= 1200 px full sidebar.
 * Content is padded for the notch / gesture bar with env(safe-area-inset-*).
 */
export function AdaptiveShell({ items, brand = 'Krishna Gurukul', top, children }: { items: NavItem[]; brand?: string; top?: ReactNode; children: ReactNode }) {
  const bp = useBreakpoint();
  const loc = useLocation();
  useEffect(() => { void setBars(document.documentElement.classList.contains('dark') ? '#0B1624' : '#00457F', true); }, [loc.pathname]);
  const tabs = items.slice(0, 5);

  return (
    <div className="min-h-dvh bg-mist text-ink">
      <OfflineBanner />
      {bp.sidebar && (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 bg-navy p-4 pt-[calc(1rem+env(safe-area-inset-top))] text-white">
          <div className="mb-4 px-3 font-display text-2xl font-extrabold">{brand}</div>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => cls('flex min-h-12 items-center gap-3 rounded-2xl px-4 font-bold', isActive ? 'bg-white text-navy' : 'text-white/85 hover:bg-white/10')}>
              {i.icon}<span className="flex-1">{i.label}</span>{!!i.badge && <span className="rounded-full bg-saffron px-2 text-xs">{i.badge}</span>}
            </NavLink>
          ))}
        </aside>
      )}
      {bp.rail && (
        <nav aria-label="Main" className="fixed inset-y-0 left-0 z-40 flex w-20 flex-col items-center gap-2 bg-navy py-4 pt-[calc(1rem+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)] text-white">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} aria-label={i.label} className={({ isActive }) => cls('relative flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold', isActive ? 'bg-white text-navy' : 'text-white/85')}>
              {i.icon}<span className="max-w-full truncate px-1">{i.label}</span>{!!i.badge && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-saffron" />}
            </NavLink>
          ))}
        </nav>
      )}

      <header className={cls('sticky top-0 z-30 bg-navy pt-[env(safe-area-inset-top)] text-white', bp.rail && 'pl-20', bp.sidebar && 'pl-64')}>
        <div className="flex min-h-14 items-center justify-between gap-2 px-4"><span className="font-display text-xl font-extrabold">{brand}</span>{top}</div>
      </header>

      <main className={cls('mx-auto w-full max-w-[1400px] px-4 py-4', bp.bottomTabs && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]', bp.rail && 'pl-24 pr-4', bp.sidebar && 'pl-72 pr-6')} style={{ paddingLeft: bp.bottomTabs ? 'max(1rem, env(safe-area-inset-left))' : undefined, paddingRight: bp.bottomTabs ? 'max(1rem, env(safe-area-inset-right))' : undefined }}>
        {children}
      </main>

      {bp.bottomTabs && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgba(0,69,127,.35)]">
          <ul className="mx-auto flex max-w-xl">
            {tabs.map((i) => (
              <li key={i.to} className="flex-1">
                <NavLink to={i.to} className={({ isActive }) => cls('relative flex h-16 min-w-12 flex-col items-center justify-center gap-0.5 text-[11px] font-bold', isActive ? 'text-saffron' : 'text-navy/65')}>
                  {i.icon}<span className="max-w-full truncate px-1">{i.label}</span>{!!i.badge && <span className="absolute right-[28%] top-2 h-2.5 w-2.5 rounded-full bg-saffron" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/** Responsive card grid: 1 col phones, 2 cols from 600 px, 3 from 840 px. */
export const CardGrid = ({ children }: { children: ReactNode }) => <div className="grid gap-3 min-[600px]:grid-cols-2 min-[840px]:grid-cols-3">{children}</div>;

/** List + detail side by side on tablets and desktop; list only (detail replaces it) on phones. */
export function SplitView({ list, detail, showDetail }: { list: ReactNode; detail: ReactNode; showDetail: boolean }) {
  const bp = useBreakpoint();
  if (bp.threeCol) return <div className="grid grid-cols-[minmax(280px,380px)_1fr] gap-4"><div>{list}</div><div>{detail}</div></div>;
  return <>{showDetail ? detail : list}</>;
}
