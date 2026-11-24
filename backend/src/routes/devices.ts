import { Router } from 'express';
import { z } from 'zod';
import { DeviceToken, User } from '../models';
import { authenticate, parse, wrap } from '../middleware';
import { PUSH_TYPES } from '../services/notify';

/** Push device tokens + per-user notification preferences. */
export const devices = Router();
devices.use(authenticate);

devices.post('/', wrap(async (req, res) => {
  const d = parse(z.object({ token: z.string().min(20).max(4096), platform: z.enum(['android', 'ios', 'web']).default('android') }), req.body);
  // a token belongs to one user at a time (shared phone, new login)
  await DeviceToken.findOneAndUpdate({ token: d.token }, { userId: req.user!.id, platform: d.platform, lastSeen: new Date() }, { upsert: true, new: true });
  res.status(201).json({ ok: true });
}));

devices.delete('/', wrap(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(20) }), req.body ?? {});
  await DeviceToken.deleteOne({ token, userId: req.user!.id });
  res.json({ ok: true });
}));

devices.get('/prefs', wrap(async (req, res) => {
  const u: any = await User.findById(req.user!.id).select('prefs').lean();
  const push: Record<string, boolean> = {};
  for (const t of PUSH_TYPES) push[t] = u?.prefs?.push?.[t] !== false;
  res.json({ push, practiceReminder: u?.prefs?.practiceReminder ?? '' });
}));

devices.put('/prefs', wrap(async (req, res) => {
  const d = parse(z.object({
    push: z.record(z.enum(PUSH_TYPES), z.boolean()).optional(),
    practiceReminder: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal('')).optional(),
  }), req.body);
  const set: any = {};
  for (const [k, v] of Object.entries(d.push ?? {})) set[`prefs.push.${k}`] = v;
  if (d.practiceReminder !== undefined) set['prefs.practiceReminder'] = d.practiceReminder;
  await User.updateOne({ _id: req.user!.id }, { $set: set });
  res.json({ ok: true });
}));
