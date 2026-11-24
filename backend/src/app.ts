import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env';
import { connectDb } from './config/db';
import { errorHandler, wrap } from './middleware';
import { auth } from './routes/auth';
import { pub } from './routes/public';
import { admin } from './routes/admin';
import { faculty } from './routes/faculty';
import { parent } from './routes/parent';
import { cron } from './routes/cron';
import { devices } from './routes/devices';
import { deletionAdmin, deletionApp, deletionPublic } from './routes/deletion';
import { uploadsDir, b2Enabled, signedGet } from './integrations/b2';

/** Vercel entry: exports the app, never calls listen (see server.ts for local dev). */
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: [env.appUrl, 'http://localhost:5173', ...env.appOrigins], credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// connect (cached across invocations) before any route
app.use(wrap(async (_req, _res, next) => { await connectDb(); next(); }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', auth);
app.use('/api/public', pub);
app.use('/api/admin', admin);
app.use('/api/faculty', faculty);
app.use('/api/parent', parent);
app.use('/api/cron', cron);
// public website media from the private bucket: only keys under public/ are served
app.get('/api/media/*', wrap(async (req, res) => {
  const key = decodeURIComponent(req.path.replace('/api/media/', ''));
  if (!key.startsWith('public/') || key.includes('..')) return res.status(404).end();
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.redirect(302, await signedGet(key));
}));
app.use('/api/devices', devices);
app.use('/api/public/delete-request', deletionPublic);
app.use('/api/account/delete-request', deletionApp);
app.use('/api/admin/deletion-requests', deletionAdmin);
// Android App Links verification (fingerprint comes from Play App Signing)
app.get('/.well-known/assetlinks.json', (_req, res) => res.json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'in.krishnagurukul.app', sha256_cert_fingerprints: (process.env.ANDROID_CERT_SHA256 ?? 'REPLACE_WITH_PLAY_APP_SIGNING_SHA256').split(',') } }]));

// local-dev-only upload mock (used when B2 keys are empty)
if (!b2Enabled() && !env.isProd) {
  app.use('/uploads', express.static(uploadsDir));
  app.put('/api/uploads/local/*', express.raw({ type: '*/*', limit: '12mb' }), (req, res) => {
    const key = decodeURIComponent(req.path.replace('/api/uploads/local/', ''));
    const file = path.join(uploadsDir, key);
    if (!file.startsWith(uploadsDir)) return res.status(400).end();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, req.body);
    res.json({ ok: true });
  });
}

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

export default app;
