import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import dns from 'node:dns';
import { env } from './env';

// Local DNS sometimes refuses SRV lookups (mongodb+srv). Dev only: fall back to public resolvers.
if (!env.isProd && env.mongoUri.startsWith('mongodb+srv://')) dns.setServers(['8.8.8.8', '1.1.1.1']);

/** Cached across serverless invocations. */
let cached: Promise<typeof mongoose> | null = null;
export let usingEmbedded = false;

async function resolveUri(): Promise<string> {
  if (env.mongoUri) return env.mongoUri;
  if (env.isProd) throw new Error('MONGODB_URI is required in production');
  // Dev fallback: embedded Mongo persisted to .data/mongo so seed + dev share data.
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.resolve(process.cwd(), '.data/mongo');
  fs.mkdirSync(dbPath, { recursive: true });
  const srv = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger', port: 27111 } });
  usingEmbedded = true;
  console.log('[db] using embedded MongoDB at', dbPath);
  return srv.getUri('krishna-gurukul');
}

export function connectDb() {
  if (!cached) {
    mongoose.set('strictQuery', true);
    cached = resolveUri().then((u) => mongoose.connect(u, { serverSelectionTimeoutMS: 15000 }));
    cached.catch(() => { cached = null; });
  }
  return cached;
}
