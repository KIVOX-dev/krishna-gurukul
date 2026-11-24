import 'dotenv/config';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const ok = (n: string, v: string) => console.log(`${v.startsWith('OK') ? '✔' : '✘'} ${n}: ${v}`);
const clean = (m: string) => m.replace(/(gsk_|xkeysib-)[\w-]+/g, '$1***').replace(/:\/\/[^@\s]+@/, '://***@');

import dns from 'node:dns'; dns.setServers(['8.8.8.8','1.1.1.1']);
(async () => {
  try { const c = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 }); await c.connection.db!.admin().ping(); ok('MongoDB Atlas', `OK (${(await c.connection.db!.listCollections().toArray()).length} collections)`); await mongoose.disconnect(); } catch (e: any) { ok('MongoDB Atlas', clean(e.message).slice(0, 160)); }
  try {
    const s3 = new S3Client({ region: env.b2.region, endpoint: env.b2.endpoint, credentials: { accessKeyId: env.b2.keyId, secretAccessKey: env.b2.appKey } });
    const Key = `private/_healthcheck-${Date.now()}.txt`;
    await s3.send(new PutObjectCommand({ Bucket: env.b2.bucket, Key, Body: 'ok' })); await s3.send(new DeleteObjectCommand({ Bucket: env.b2.bucket, Key }));
    ok('Backblaze B2 (put + delete)', 'OK');
  } catch (e: any) { ok('Backblaze B2', clean(e.name + ': ' + e.message).slice(0, 160)); }
  try { const r = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': env.brevo.apiKey } }); const d: any = await r.json(); ok('Brevo API key', r.ok ? `OK (plan: ${d.plan?.[0]?.type ?? '?'}, credits: ${d.plan?.[0]?.credits ?? '?'})` : `HTTP ${r.status} ${d.message ?? ''}`); } catch (e: any) { ok('Brevo', clean(e.message)); }
  try { const r = await fetch('https://api.brevo.com/v3/senders', { headers: { 'api-key': env.brevo.apiKey } }); const d: any = await r.json(); const list = (d.senders ?? []).map((s: any) => `${s.email}${s.active ? '' : ' (inactive)'}`); ok('Brevo senders', r.ok ? `OK ${list.join(', ') || 'none registered'}` : `HTTP ${r.status}`); } catch { /* ignore */ }
  let good = 0; const models = new Set<string>();
  for (const k of env.groq.keys) { try { const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${k}` } }); if (r.ok) { good++; ((await r.json()) as any).data?.forEach((m: any) => models.add(m.id)); } } catch { /* ignore */ } }
  ok('Groq keys', `${good === env.groq.keys.length ? 'OK' : 'PARTIAL'} ${good}/${env.groq.keys.length} valid; models ${models.has(env.groq.primary) ? '120b available' : '120b MISSING'}, ${models.has(env.groq.fallback) ? '20b available' : '20b MISSING'}`);
})();
