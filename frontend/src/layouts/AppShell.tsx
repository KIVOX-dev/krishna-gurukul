import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { LogOut, Menu, Volume2, VolumeX, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDevice } from '../hooks';
import { useAuth, useChild, useMute } from '../store';
import { get } from '../services/api';
import { cx } from '../components/ui';

export interface NavItem { to: string; label: string; icon: ReactNode; group?: string; tab?: boolean; badge?: number }

/** DESKTOP: left sidebar + topbar */
function DesktopLayout({ items, calm }: { items: NavItem[]; calm: boolean }) {
  const user = useAuth((s) => s.user)!; const nav = useNavigate(); const { muted, toggle } = useMute();
  const groups = [...new Set(items.map((i) => i.group ?? ''))];
  return (
    <div className={cx('flex min-h-screen', !calm && 'doodles')}>
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-0.5 overflow-y-auto bg-navy p-3 text-[15px] text-white">
        <button onClick={() => nav('/')} aria-label="Krishna Gurukul home" className="mb-3 block w-full rounded-2xl bg-white px-3 py-2 shadow-soft"><img src="/logo-mark.png" alt="Krishna Gurukul" width={497} height={279} className="mx-auto h-14 w-auto" /></button>
        {groups.map((g) => (
          <div key={g} className="mb-2">
            {g && <p className="px-3 pb-0.5 pt-2 text-[11px] font-extrabold uppercase tracking-widest text-white/40">{g}</p>}
            {items.filter((i) => (i.group ?? '') === g).map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to.split('/').length <= 2} className={({ isActive }) => cx('flex min-h-[40px] items-center gap-3 rounded-xl px-3 font-semibold transition', isActive ? 'bg-sun text-ink' : 'text-white/80 hover:bg-white/10')}>
                {i.icon}<span className="flex-1">{i.label}</span>{!!i.badge && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-saffron px-1 text-xs text-white">{i.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-sky/10 bg-white/80 px-8 py-3 backdrop-blur">
          <ChildPicker />
          <div className="flex items-center gap-3">
            <button onClick={toggle} aria-label="Toggle sound" className="grid h-11 w-11 place-items-center rounded-full hover:bg-sky/10">{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
            <span className="font-bold text-navy">{user.name}<span className="ml-2 chip bg-sun/30 capitalize text-amber-800">{user.role}</span></span>
            <button onClick={() => { useAuth.getState().logout(); nav('/login'); }} className="btn-ghost btn-sm btn"><LogOut size={16} />Sign out</button>
          </div>
        </header>
        <main className="flex-1 p-6 xl:p-8"><PageOutlet /></main>
      </div>
    </div>
  );
}

/** MOBILE: header + bottom tab bar (separate layout, not a shrunk desktop) */
function MobileLayout({ items, calm }: { items: NavItem[]; calm: boolean }) {
  const user = useAuth((s) => s.user)!; const nav = useNavigate(); const [more, setMore] = useState(false);
  const tabs = items.filter((i) => i.tab).slice(0, 4); const rest = items.filter((i) => !tabs.includes(i));
  return (
    <div className={cx('min-h-screen pb-24', !calm && 'doodles')}>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-navy px-4 py-3 text-white" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="rounded-xl bg-white px-2 py-1"><img src="/logo-mark.png" alt="Krishna Gurukul" width={497} height={279} className="h-8 w-auto" /></div>
        <ChildPicker dark />
      </header>
      <main className="relative z-10 p-4"><PageOutlet /></main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid border-t border-sky/15 bg-white/95 backdrop-blur" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, 1fr)` }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to.split('/').length <= 2} className={({ isActive }) => cx('relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold', isActive ? 'text-saffron' : 'text-navy/60')}>
            {({ isActive }) => <>{isActive && <motion.span layoutId="tabdot" className="absolute top-0 h-1 w-10 rounded-full bg-saffron" />}{t.icon}{t.label}{!!t.badge && <span className="absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-saffron px-1 text-[10px] text-white">{t.badge}</span>}</>}
          </NavLink>
        ))}
        <button onClick={() => setMore(true)} className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold text-navy/60"><Menu />More</button>
      </nav>
      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-50 bg-navy/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)}>
            <motion.div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[28px] bg-white p-5" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
              <div className="mb-3 flex items-center justify-between"><p className="font-display text-xl font-extrabold text-navy">{user.name}</p><button aria-label="Close" onClick={() => setMore(false)} className="grid h-11 w-11 place-items-center"><X /></button></div>
              <div className="grid grid-cols-3 gap-3">{rest.map((i) => <NavLink key={i.to} to={i.to} onClick={() => setMore(false)} className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl bg-sky/10 text-center text-xs font-bold text-navy">{i.icon}{i.label}</NavLink>)}</div>
              <button onClick={() => { useAuth.getState().logout(); nav('/login'); }} className="btn-ghost btn mt-4 w-full"><LogOut size={16} />Sign out</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PageOutlet() {
  const loc = useLocation();
  return <AnimatePresence mode="wait"><motion.div key={loc.pathname} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}><Outlet /></motion.div></AnimatePresence>;
}

/** Child switcher (parents only). */
function ChildPicker({ dark }: { dark?: boolean }) {
  const role = useAuth((s) => s.user?.role);
  const { childId, setChild } = useChild();
  const kids = useQuery({ queryKey: ['children'], queryFn: () => get('/parent/children'), enabled: role === 'parent' });
  if (role !== 'parent') return <span />;
  const list: any[] = kids.data ?? [];
  const cur = list.find((k) => k._id === childId) ?? list[0];
  if (cur && cur._id !== childId) setTimeout(() => setChild(cur._id), 0);
  return (
    <select aria-label="Select child" value={cur?._id ?? ''} onChange={(e) => setChild(e.target.value)} className={cx('min-h-[44px] rounded-full border-2 px-4 font-display font-bold outline-none', dark ? 'border-white/30 bg-white/10 text-white' : 'border-navy/15 bg-white text-navy')}>
      {list.map((k) => <option key={k._id} value={k._id} className="text-ink">{k.name}</option>)}
    </select>
  );
}

export function AppShell({ items, calm }: { items: NavItem[]; calm: boolean }) {
  const { isDesktop } = useDevice();
  return isDesktop ? <DesktopLayout items={items} calm={calm} /> : <MobileLayout items={items} calm={calm} />;
}
