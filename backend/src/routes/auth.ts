import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { Otp, User } from '../models';
import { HttpError, authenticate, parse, rateLimit, signAccess, signRefresh, wrap } from '../middleware';
import { sendOtp } from '../integrations/brevo';

export const auth = Router();
const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, secure: env.isProd, path: '/api/auth', maxAge: 7 * 86400_000 };
const devCookie = { httpOnly: true, sameSite: 'lax' as const, secure: env.isProd, path: '/', maxAge: 365 * 86400_000 };

/** App clients send `X-Client: app` and get the refresh token in the body (kept in Android secure storage). Web keeps the httpOnly cookie. */
const isApp = (req: any) => req?.headers?.['x-client'] === 'app';
const session = (res: any, u: any, req?: any) => {
  const a = { id: String(u._id), role: u.role, name: u.name };
  const refresh = signRefresh(a);
  if (!isApp(req)) res.cookie('kg_refresh', refresh, cookieOpts);
  return { accessToken: signAccess(a), ...(isApp(req) ? { refreshToken: refresh } : {}), user: { id: a.id, name: u.name, role: u.role, email: u.email, phone: u.phone, hideChild: u.hideChild } };
};

const hashOtp = (email: string, code: string) => crypto.createHash('sha256').update(`${email}:${code}:${env.accessSecret}`).digest('hex');
async function issueOtp(email: string, purpose: string, userId?: any) {
  const code = String(crypto.randomInt(100000, 999999));
  await Otp.deleteMany({ email, purpose });
  await Otp.create({ email, purpose, codeHash: hashOtp(email, code), expiresAt: new Date(Date.now() + 10 * 60_000) });
  await sendOtp(email, code, userId, purpose === "admin-device" ? "admin" : "parent");
}
async function checkOtp(email: string, purpose: string, code: string) {
  const o: any = await Otp.findOne({ email, purpose });
  if (!o) throw new HttpError(400, 'Code expired. Ask for a new one.');
  if (o.attempts >= 5) { await o.deleteOne(); throw new HttpError(429, 'Too many wrong codes. Ask for a new one.'); }
  if (o.codeHash !== hashOtp(email, code)) { o.attempts++; await o.save(); throw new HttpError(400, 'That code is not right'); }
  await o.deleteOne();
}

/** Staff: email + password. Admin on a new device gets an email OTP. */
auth.post('/staff-login', rateLimit('login', 10, 300), wrap(async (req, res) => {
  const { identifier, password } = parse(z.object({ identifier: z.string().trim().email('Please enter your email address'), password: z.string().min(1) }), req.body);
  const id = identifier.trim().toLowerCase();
  const u: any = await User.findOne({ role: { $in: ['admin', 'faculty'] }, email: id });
  if (!u || !u.passwordHash || !(await bcrypt.compare(password, u.passwordHash)) || !u.isActive) throw new HttpError(401, 'Wrong email or password');
  if (u.role === 'admin' && env.adminDeviceOtp) {
    const dev = req.cookies?.kg_device;
    if (!dev || !(u.trustedDevices ?? []).includes(dev)) {
      await issueOtp(u.email, 'admin-device', u._id);
      return res.json({ otpRequired: true, email: u.email });
    }
  }
  u.lastLogin = new Date(); await u.save();
  res.json(session(res, u, req));
}));

auth.post('/admin-verify', rateLimit('otp-verify', 10, 300), wrap(async (req, res) => {
  const { email, code } = parse(z.object({ email: z.string().email(), code: z.string().length(6) }), req.body);
  const u: any = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
  if (!u) throw new HttpError(400, 'That code is not right');
  await checkOtp(u.email, 'admin-device', code);
  const dev = crypto.randomBytes(16).toString('hex');
  u.trustedDevices = [...(u.trustedDevices ?? []).slice(-4), dev]; u.lastLogin = new Date(); await u.save();
  res.cookie('kg_device', dev, devCookie);
  res.json(session(res, u, req));
}));

/** Parent: email OTP, no password. Always answers "sent" so emails cannot be probed. */
auth.post('/parent-otp', rateLimit('otp', 5, 600), wrap(async (req, res) => {
  const { email } = parse(z.object({ email: z.string().email() }), req.body);
  const u: any = await User.findOne({ email: email.toLowerCase(), role: 'parent', isActive: true });
  if (u) await issueOtp(u.email, 'parent-login', u._id);
  res.json({ sent: true });
}));

auth.post('/parent-verify', rateLimit('otp-verify', 10, 300), wrap(async (req, res) => {
  const { email, code } = parse(z.object({ email: z.string().email(), code: z.string().length(6) }), req.body);
  const u: any = await User.findOne({ email: email.toLowerCase(), role: 'parent', isActive: true });
  if (!u) throw new HttpError(400, 'That code is not right');
  await checkOtp(u.email, 'parent-login', code);
  u.lastLogin = new Date(); await u.save();
  res.json(session(res, u, req));
}));

auth.post('/refresh', wrap(async (req, res) => {
  const h = req.headers.authorization;
  const t = req.cookies?.kg_refresh ?? (isApp(req) && h?.startsWith('Bearer ') ? h.slice(7) : undefined);
  if (!t) throw new HttpError(401, 'Please sign in');
  let payload: any;
  try { payload = jwt.verify(t, env.refreshSecret); } catch { throw new HttpError(401, 'Session expired'); }
  const u: any = await User.findById(payload.id);
  if (!u || !u.isActive) throw new HttpError(401, 'Account not active');
  res.json(session(res, u, req));
}));

auth.post('/logout', (_req, res) => { res.clearCookie('kg_refresh', { path: '/api/auth' }); res.json({ ok: true }); });

auth.get('/me', authenticate, wrap(async (req, res) => {
  const u: any = await User.findById(req.user!.id).lean();
  res.json({ id: String(u._id), name: u.name, role: u.role, email: u.email, phone: u.phone, hideChild: u.hideChild });
}));
