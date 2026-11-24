import { Router } from 'express';
import { z } from 'zod';
import { DeletionRequest, DeviceToken, Student, User } from '../models';
import { HttpError, audit, authenticate, parse, rateLimit, requireRole, wrap } from '../middleware';

/** Public web form (/delete-account). Always answers the same so emails cannot be probed. */
export const deletionPublic = Router();
deletionPublic.post('/', rateLimit('delete-req', 5, 3600), wrap(async (req, res) => {
  const d = parse(z.object({ email: z.string().email(), name: z.string().min(2).max(80), reason: z.string().max(500).optional() }), req.body);
  const u: any = await User.findOne({ email: d.email.toLowerCase() }).select('_id').lean();
  if (u) await DeletionRequest.create({ userId: u._id, name: d.name, email: d.email.toLowerCase(), reason: d.reason, source: 'web' });
  res.json({ received: true });
}));

/** In-app "Delete my account" request from Settings. */
export const deletionApp = Router();
deletionApp.use(authenticate);
deletionApp.post('/', wrap(async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().max(500).optional() }), req.body ?? {});
  const u: any = await User.findById(req.user!.id).lean();
  if (!u) throw new HttpError(404, 'Account not found');
  const open = await DeletionRequest.findOne({ userId: u._id, status: 'pending' });
  if (!open) await DeletionRequest.create({ userId: u._id, name: u.name, email: u.email, phone: u.phone, reason, source: 'app' });
  res.json({ received: true });
}));
deletionApp.get('/mine', wrap(async (req, res) => res.json(await DeletionRequest.findOne({ userId: req.user!.id }).sort({ createdAt: -1 }).select('status createdAt').lean())));

/** Admin lists and completes requests. */
export const deletionAdmin = Router();
deletionAdmin.use(authenticate, requireRole('admin'));
deletionAdmin.get('/', wrap(async (_req, res) => res.json(await DeletionRequest.find().sort({ createdAt: -1 }).limit(200).lean())));
/** Completing removes the parent's personal data; children linked only to this parent are deactivated and anonymised. */
deletionAdmin.post('/:id/complete', wrap(async (req, res) => {
  const r: any = await DeletionRequest.findById(req.params.id);
  if (!r || r.status !== 'pending') throw new HttpError(404, 'Request not found');
  const u: any = r.userId ? await User.findById(r.userId) : null;
  if (u) {
    if (u.role === 'admin') throw new HttpError(400, 'Admin accounts cannot be deleted here');
    const kids: any[] = await Student.find({ parentIds: u._id });
    for (const s of kids) {
      s.parentIds = s.parentIds.filter((p: any) => String(p) !== String(u._id));
      if (!s.parentIds.length) { s.status = 'inactive'; s.name = 'Deleted student'; s.photo = undefined; s.dob = undefined; }
      await s.save();
    }
    await DeviceToken.deleteMany({ userId: u._id });
    u.name = 'Deleted user'; u.email = undefined; u.phone = undefined; u.passwordHash = undefined; u.photo = undefined; u.isActive = false; u.trustedDevices = [];
    await u.save();
  }
  r.status = 'completed'; r.completedAt = new Date(); r.completedBy = req.user!.id; await r.save();
  await audit(req, 'delete-account', 'user', r.userId);
  res.json({ ok: true });
}));
deletionAdmin.post('/:id/reject', wrap(async (req, res) => { await DeletionRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }); res.json({ ok: true }); }));
