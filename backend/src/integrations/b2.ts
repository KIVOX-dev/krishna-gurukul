import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from '../config/env';

/** Backblaze B2 via S3 API. Mock mode (no keys): local ./uploads folder served at /uploads (dev only). */
export const b2Enabled = () => !!(env.b2.keyId && env.b2.appKey && env.b2.bucket && env.b2.endpoint);
export const uploadsDir = path.resolve(process.cwd(), 'uploads');

let client: S3Client | null = null;
const s3 = () =>
  (client ??= new S3Client({
    region: env.b2.region, endpoint: env.b2.endpoint,
    credentials: { accessKeyId: env.b2.keyId, secretAccessKey: env.b2.appKey },
  }));

export type Visibility = 'public' | 'private';
const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_');

/** Returns a presigned PUT URL the browser uploads to directly. */
export async function presignUpload(filename: string, contentType: string, visibility: Visibility) {
  const key = `${visibility}/${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${safe(filename)}`;
  if (!b2Enabled()) return { key, uploadUrl: `/api/uploads/local/${encodeURIComponent(key)}`, publicUrl: `/uploads/${key}`, mock: true };
  const uploadUrl = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: env.b2.bucket, Key: key, ContentType: contentType }), { expiresIn: 600 });
  // bucket stays private; public/ files are served through /api/media (redirects to a short-lived signed URL)
  const publicUrl = visibility === 'public' ? `/api/media/${key}` : undefined;
  return { key, uploadUrl, publicUrl };
}

/** 10 minute signed URL for private files. */
export async function signedGet(key: string) {
  if (!b2Enabled()) return `/uploads/${key}`;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.b2.bucket, Key: key }), { expiresIn: 600 });
}

/** Server-side put (used for generated PDFs such as receipts). */
export async function putBuffer(key: string, body: Buffer, contentType: string) {
  if (!b2Enabled()) {
    const file = path.join(uploadsDir, key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    return key;
  }
  await s3().send(new PutObjectCommand({ Bucket: env.b2.bucket, Key: key, Body: body, ContentType: contentType }));
  return key;
}
