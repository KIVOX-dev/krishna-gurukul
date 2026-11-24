import { createStore, del, entries, set } from 'idb-keyval';
import { api } from '../services/api';

/** Practice results are queued in IndexedDB while offline and synced when the connection returns. */
const db = createStore('kg-offline', 'practice-queue');
export interface QueuedPractice { id: string; childId: string; body: { mode: string; level: number; score: number; accuracy: number; avgTimeMs: number; settings?: unknown }; at: number }

export async function queuePractice(childId: string, body: QueuedPractice['body']) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await set(id, { id, childId, body, at: Date.now() } satisfies QueuedPractice, db);
  return id;
}
export const pendingCount = async () => (await entries(db)).length;

/** Try sending one by one; keeps anything that fails. Returns how many synced. */
let syncing = false;
export async function syncQueue(): Promise<number> {
  if (syncing || !navigator.onLine) return 0;
  syncing = true; let n = 0;
  try {
    const rows = (await entries<string, QueuedPractice>(db)).sort((a, b) => a[1].at - b[1].at);
    for (const [key, item] of rows) {
      try { await api.post(`/parent/children/${item.childId}/practice`, item.body); await del(key, db); n++; }
      catch (e: any) { if (e?.response && e.response.status < 500 && e.response.status !== 401) await del(key, db); else break; } // drop unfixable 4xx, retry network/5xx later
    }
  } finally { syncing = false; }
  return n;
}

/** Call once at startup: syncs on reconnect and when the app returns to the foreground. */
export function startSyncWatcher() {
  window.addEventListener('online', () => void syncQueue());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void syncQueue(); });
  void syncQueue();
}

/** Save a practice result: online it posts straight away, offline (or on a network error) it is queued and synced later. */
export async function submitPractice(childId: string, body: QueuedPractice['body']): Promise<{ queued: boolean; data?: any }> {
  if (navigator.onLine) {
    try { return { queued: false, data: (await api.post(`/parent/children/${childId}/practice`, body)).data }; }
    catch (e: any) { if (e?.response && e.response.status < 500) throw e; }
  }
  await queuePractice(childId, body);
  return { queued: true };
}
