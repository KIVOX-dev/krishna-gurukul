import { isNative } from './platform';

const KEY = 'kg_refresh_token';
let plugin: Promise<any> | null = null;
const store = () => (plugin ??= import('@aparajita/capacitor-secure-storage').then((m) => m.SecureStorage));

/** Refresh token lives in Android Keystore-backed secure storage (never localStorage). Web uses the httpOnly cookie. */
export const secureRefresh = {
  async get(): Promise<string | null> { if (!isNative()) return null; try { return ((await (await store()).get(KEY)) as string) || null; } catch { return null; } },
  async set(v: string) { if (!isNative()) return; try { await (await store()).set(KEY, v); } catch { /* ignore */ } },
  async clear() { if (!isNative()) return; try { await (await store()).remove(KEY); } catch { /* ignore */ } },
};
