import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError, type ZodTypeAny } from 'zod';
import { env } from '../config/env';
import { AuditLog, RateLimit, User } from '../models';
import type { Role } from '@kg/shared';

export interface AuthUser { id: string; role: Role; name: string }
declare global { namespace Express { interface Request { user?: AuthUser } } }

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const signAccess = (u: AuthUser) => jwt.sign(u, env.accessSecret, { expiresIn: '15m' });
export const signRefresh = (u: AuthUser) => jwt.sign({ id: u.id }, env.refreshSecret, { expiresIn: '7d' });

export const authenticate: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next(new HttpError(401, 'Please sign in'));
  try {
    req.user = jwt.verify(h.slice(7), env.accessSecret) as AuthUser;
    next();
  } catch { next(new HttpError(401, 'Session expired')); }
};

export const requireRole = (...roles: Role[]): RequestHandler => (req, _res, next) =>
  req.user && roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Not allowed'));

/** zod validation: returns parsed body. */
export const parse = <T extends ZodTypeAny>(schema: T, data: unknown): ReturnType<T['parse']> => schema.parse(data);

/** Rate limit with Mongo store (works across serverless instances). */
export const rateLimit = (name: string, max: number, windowSec: number): RequestHandler => async (req, _res, next) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'ip';
    const bucket = Math.floor(Date.now() / (windowSec * 1000));
    const key = `${name}:${ip}:${bucket}`;
    const doc = await RateLimit.findOneAndUpdate(
      { key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowSec * 1000) } },
      { upsert: true, new: true },
    );
    if (doc.count > max) return next(new HttpError(429, 'Too many tries. Please wait a moment.'));
    next();
  } catch { next(); }
};

export const cronAuth: RequestHandler = (req, _res, next) => {
  const expected = env.cronSecret;
  if (!expected) return env.isProd ? next(new HttpError(500, 'CRON_SECRET not set')) : next();
  req.headers.authorization === `Bearer ${expected}` ? next() : next(new HttpError(401, 'Bad cron secret'));
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.code === 11000) return res.status(409).json({ error: 'That already exists' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};

export async function audit(req: Request, action: string, entity: string, entityId?: any, diff?: any) {
  try {
    await AuditLog.create({ userId: req.user?.id, userName: req.user?.name, action, entity, entityId: entityId ? String(entityId) : undefined, diff });
  } catch { /* never block on audit */ }
}

export async function loadUser(id: string) {
  const u = await User.findById(id);
  if (!u || !u.isActive) throw new HttpError(401, 'Account not active');
  return u;
}
