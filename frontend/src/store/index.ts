import { create } from 'zustand';
import type { Role } from '@kg/shared';
import { API_BASE, isNative } from '../native/platform';
import { secureRefresh } from '../native/secure';

export interface SessionUser { id: string; name: string; role: Role; email?: string; phone?: string; hideChild?: boolean }

interface AuthState {
  token: string | null; user: SessionUser | null; ready: boolean;
  setSession: (t: string, u: SessionUser) => void;
  logout: (call?: boolean) => void;
  setReady: () => void;
}
export const useAuth = create<AuthState>((set) => ({
  token: null, user: null, ready: false,
  setSession: (token, user) => set({ token, user, ready: true }),
  setReady: () => set({ ready: true }),
  logout: (call = true) => {
    if (call) fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: isNative() ? 'omit' : 'include' }).catch(() => {});
    void secureRefresh.clear();
    set({ token: null, user: null, ready: true });
  },
}));

interface ChildState { childId: string | null; setChild: (id: string) => void }
export const useChild = create<ChildState>((set) => ({
  childId: (() => { try { return localStorage.getItem('kg_child'); } catch { return null; } })(),
  setChild: (id) => { try { localStorage.setItem('kg_child', id); } catch { /* ignore */ } set({ childId: id }); },
}));

export interface Toast { id: number; kind: 'ok' | 'err' | 'info'; text: string }
interface ToastState { items: Toast[]; push: (kind: Toast['kind'], text: string) => void; drop: (id: number) => void }
export const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (kind, text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, kind, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4200);
  },
  drop: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
export const toast = {
  ok: (t: string) => useToasts.getState().push('ok', t),
  err: (t: string) => useToasts.getState().push('err', t),
  info: (t: string) => useToasts.getState().push('info', t),
};

interface MuteState { muted: boolean; toggle: () => void }
export const useMute = create<MuteState>((set, get) => ({
  muted: (() => { try { return localStorage.getItem('kg_mute') === '1'; } catch { return false; } })(),
  toggle: () => { const m = !get().muted; try { localStorage.setItem('kg_mute', m ? '1' : '0'); } catch { /* ignore */ } set({ muted: m }); },
}));
