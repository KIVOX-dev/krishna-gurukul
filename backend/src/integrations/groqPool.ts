import crypto from 'node:crypto';
import { env } from '../config/env';
import { AiCache, AiUsage } from '../models';

/** The ONLY file that talks to Groq. Round-robin key pool, cooldowns, 120b -> 20b fallback, Mongo cache. */
interface KeyState { key: string; cooldownUntil: number; requestsToday: number; lastError?: string }
const BASE = 'https://api.groq.com/openai/v1/chat/completions';
const pool: KeyState[] = env.groq.keys.map((key) => ({ key, cooldownUntil: 0, requestsToday: 0 }));
let cursor = 0;
const today = () => new Date().toISOString().slice(0, 10);

export const aiEnabled = () => pool.length > 0;

export interface AiRequest {
  system: string; user: string; maxTokens?: number; json?: boolean;
  /** Non-AI text returned if everything fails or no keys exist. */
  fallback: string;
}
export interface AiResult { text: string; model: string | 'fallback' | 'cache'; fromAi: boolean }

async function callOnce(k: KeyState, idx: number, model: string, r: AiRequest): Promise<{ ok: true; text: string } | { ok: false; retryAfter: number }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${k.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: r.maxTokens ?? 400, temperature: 0.4,
      messages: [{ role: 'system', content: r.system }, { role: 'user', content: r.user }],
      ...(r.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  k.requestsToday++;
  AiUsage.updateOne({ day: today(), keyIndex: idx, model }, { $inc: { requests: 1, ...(res.ok ? {} : { errors: 1 }) } }, { upsert: true }).catch(() => {});
  if (res.status === 429) {
    const ra = Number(res.headers.get('retry-after') ?? 30);
    k.cooldownUntil = Date.now() + (Number.isFinite(ra) ? ra : 30) * 1000;
    k.lastError = '429';
    return { ok: false, retryAfter: ra };
  }
  if (!res.ok) { k.lastError = String(res.status); k.cooldownUntil = Date.now() + 10_000; return { ok: false, retryAfter: 10 }; }
  const data: any = await res.json();
  return { ok: true, text: data?.choices?.[0]?.message?.content?.trim() ?? '' };
}

async function tryModel(model: string, r: AiRequest): Promise<string | null> {
  for (let n = 0; n < pool.length; n++) {
    const idx = (cursor + n) % pool.length;
    const k = pool[idx];
    if (k.cooldownUntil > Date.now()) continue;
    try {
      const out = await callOnce(k, idx, model, r);
      if (out.ok && out.text) { cursor = (idx + 1) % pool.length; return out.text; }
    } catch (e: any) { k.lastError = e?.message; k.cooldownUntil = Date.now() + 5_000; }
  }
  return null;
}

export async function askAi(r: AiRequest, opts: { skipCache?: boolean } = {}): Promise<AiResult> {
  if (!pool.length) return { text: r.fallback, model: 'fallback', fromAi: false };
  const hash = crypto.createHash('sha256').update(r.system + '\n' + r.user).digest('hex');
  if (!opts.skipCache) {
    const hit = await AiCache.findOne({ hash }).lean().catch(() => null);
    if (hit) return { text: (hit as any).response, model: 'cache', fromAi: true };
  }
  for (const model of [env.groq.primary, env.groq.fallback]) {
    const text = await tryModel(model, r);
    if (text) {
      AiCache.updateOne({ hash }, { $set: { response: text, model } }, { upsert: true }).catch(() => {});
      return { text, model, fromAi: true };
    }
  }
  return { text: r.fallback, model: 'fallback', fromAi: false };
}

export const poolStatus = () => pool.map((k, i) => ({ index: i, requestsToday: k.requestsToday, cooling: k.cooldownUntil > Date.now(), lastError: k.lastError }));
