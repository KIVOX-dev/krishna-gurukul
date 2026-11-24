import { useEffect, useState } from 'react';
import { createStore, get as idbGet, set as idbSet } from 'idb-keyval';
import { api } from '../services/api';

const db = createStore('kg-offline', 'api-cache');
interface Entry<T> { data: T; at: number }

/** GET with a persisted copy: online returns fresh data and stores it, offline falls back to the last copy. */
export async function cachedGet<T = any>(url: string, params?: any): Promise<{ data: T; at: number; stale: boolean }> {
  const key = url + (params ? `?${new URLSearchParams(params)}` : '');
  try {
    const { data } = await api.get<T>(url, { params });
    const at = Date.now(); await idbSet(key, { data, at } satisfies Entry<T>, db);
    return { data, at, stale: false };
  } catch (e) {
    const hit = await idbGet<Entry<T>>(key, db);
    if (hit) return { data: hit.data, at: hit.at, stale: true };
    throw e;
  }
}

/** Hook: shows cached data with a "last updated" time instead of a blank screen. */
export function useCachedGet<T = any>(url: string | null, params?: any) {
  const [state, setState] = useState<{ data?: T; at?: number; stale?: boolean; loading: boolean; error?: unknown }>({ loading: true });
  const [tick, setTick] = useState(0);
  const pkey = JSON.stringify(params ?? {});
  useEffect(() => {
    if (!url) return; let live = true;
    setState((s) => ({ ...s, loading: true }));
    cachedGet<T>(url, params).then((r) => live && setState({ ...r, loading: false })).catch((error) => live && setState((s) => ({ ...s, loading: false, error })));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, pkey, tick]);
  return { ...state, refetch: () => { setTick((t) => t + 1); } };
}

export const lastUpdatedLabel = (at?: number) => (at ? new Date(at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');
