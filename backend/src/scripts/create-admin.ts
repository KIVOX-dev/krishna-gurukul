import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { User } from '../models';

/**
 * Create or update an admin account (in whatever database backend/.env points to).
 *   npm run create-admin -w backend -- --email you@example.com --name "Your Name" [--password "..."] [--disable-old]
 * No --password: a strong random one is generated and printed once.
 */
const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };

(async () => {
  const email = arg('email')?.toLowerCase().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { console.error('Usage: --email you@example.com [--name "Name"] [--password "..."] [--disable-old]'); process.exit(1); }
  const password = arg('password') ?? crypto.randomBytes(9).toString('base64url');
  if (password.length < 8) { console.error('Password must be at least 8 characters'); process.exit(1); }
  await connectDb();
  await User.updateOne({ email }, { $set: { name: arg('name') ?? 'Admin', email, role: 'admin', passwordHash: await bcrypt.hash(password, 10), isActive: true, trustedDevices: [] } }, { upsert: true });
  if (process.argv.includes('--disable-old')) await User.updateOne({ email: 'admin@krishnagurukul.in', role: 'admin' }, { $set: { isActive: false } });
  console.log(`\nAdmin ready.\n  login:    ${email}\n  password: ${password}\n${process.argv.includes('--disable-old') ? '  demo admin admin@krishnagurukul.in disabled\n' : ''}Change this password after the first login.`);
  await mongoose.disconnect(); process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
