import axios, { AxiosError } from 'axios';
import { useAuth } from '../store';
import { API_BASE, isNative } from '../native/platform';
import { secureRefresh } from '../native/secure';

// Web: same-origin + httpOnly cookie. App: real server origin + refresh token from Android secure storage as a Bearer token.
const appHeaders = isNative() ? { 'X-Client': 'app' } : {};
export const api = axios.create({ baseURL: API_BASE, withCredentials: !isNative(), headers: appHeaders });

/** Login responses carry `refreshToken` for the app: keep it in secure storage. */
api.interceptors.response.use((r) => { if (isNative() && r.data?.refreshToken) void secureRefresh.set(r.data.refreshToken); return r; }, (e) => Promise.reject(e));

api.interceptors.request.use((cfg) => {
  const t = useAuth.getState().token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;
async function refresh(): Promise<string | null> {
  try {
    const rt = await secureRefresh.get();
    if (isNative() && !rt) throw new Error('no refresh token');
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, isNative() ? { headers: { ...appHeaders, Authorization: `Bearer ${rt}` } } : { withCredentials: true });
    if (data.refreshToken) await secureRefresh.set(data.refreshToken);
    useAuth.getState().setSession(data.accessToken, data.user);
    return data.accessToken;
  } catch { await secureRefresh.clear(); useAuth.getState().logout(false); return null; }
}

/** App start: restore the session from secure storage (web does the same through the cookie). */
export const restoreSession = () => refresh();

api.interceptors.response.use((r) => r, async (err: AxiosError) => {
  const cfg: any = err.config;
  if (err.response?.status === 401 && cfg && !cfg._retry && !String(cfg.url).includes('/auth/')) {
    cfg._retry = true;
    refreshing ??= refresh().finally(() => (refreshing = null));
    const t = await refreshing;
    if (t) { cfg.headers.Authorization = `Bearer ${t}`; return api(cfg); }
  }
  return Promise.reject(err);
});

export const errMsg = (e: unknown) =>
  ((e as AxiosError<any>)?.response?.data?.error as string) ?? (e as Error)?.message ?? 'Something went wrong';

export const get = <T = any>(url: string, params?: any) => api.get<T>(url, { params }).then((r) => r.data);
export const post = <T = any>(url: string, body?: any) => api.post<T>(url, body).then((r) => r.data);
export const put = <T = any>(url: string, body?: any) => api.put<T>(url, body).then((r) => r.data);
export const del = <T = any>(url: string) => api.delete<T>(url).then((r) => r.data);

/** Download a binary endpoint (xlsx/pdf) with the auth header. */
export async function download(url: string, filename: string) {
  const r = await api.get(url, { responseType: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(r.data); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Presigned direct upload to Backblaze (or local mock). Compresses images to WebP first. */
export async function uploadFile(file: File, visibility: 'public' | 'private' = 'public'): Promise<string> {
  let blob: Blob = file; let name = file.name; let type = file.type || 'application/octet-stream';
  // images become WebP in the browser; anything else (video, HEIC, GIF, PDF...) uploads as is
  if (/^image\/(jpeg|png|bmp)$/.test(file.type)) {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = bmp.width * scale; c.height = bmp.height * scale;
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      const out = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82));
      if (out) { blob = out; name = name.replace(/\.\w+$/, '') + '.webp'; type = 'image/webp'; }
    } catch { /* keep the original file */ }
  }
  const p = await post('/admin/uploads/presign', { filename: name, contentType: type, visibility });
  let res: Response;
  try { res = await fetch(p.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': type } }); }
  catch { throw new Error('Upload blocked. Check the storage bucket CORS settings.'); }
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return p.publicUrl ?? p.key;
}
