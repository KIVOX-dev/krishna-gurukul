import { Router } from 'express';
import { z } from 'zod';
import { AbacusTest, Attendance, Batch, FeeInvoice, Notification, PointsLog, PracticeSession, Student, TestAttempt, User, LeaderboardSnapshot } from '../models';
import { HttpError, authenticate, parse, requireRole, wrap } from '../middleware';
import { attendanceSummary } from '../services/attendance';
import { balanceOf, paidOf, totalOf } from '../services/fees';
import { resultFor, saveProgress, startAttempt, submitAttempt } from '../services/tests';
import { award, awardOnce, dayKey, overallBoard, testBoard } from '../services/points';
import { getSettings } from '../services/settings';
import { signedGet } from '../integrations/b2';

export const parent = Router();
parent.use(authenticate, requireRole('parent'));

/** Guard: the child must belong to this parent. */
async function child(req: any, id: string) {
  const s: any = await Student.findOne({ _id: id, parentIds: req.user.id });
  if (!s) throw new HttpError(403, 'This is not your child');
  return s;
}

parent.get('/children', wrap(async (req, res) => {
  res.json(await Student.find({ parentIds: req.user!.id, status: 'active' }).populate('batchIds', 'name days startTime endTime').populate('courseIds', 'name').lean());
}));

parent.get('/children/:id/home', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const today = dayKey();
  const att: any = await Attendance.findOne({ date: today, 'records.studentId': s._id }).lean();
  const todayStatus = att?.records.find((r: any) => String(r.studentId) === String(s._id))?.status ?? null;
  const batches: any[] = await Batch.find({ _id: { $in: s.batchIds } }).lean();
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow = new Date(Date.now() + 5.5 * 3600_000).getUTCDay();
  let next: any = null;
  for (let i = 0; i < 7 && !next; i++) { const day = names[(dow + i) % 7]; next = batches.filter((b) => b.days.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ? { day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day, batch: batches.filter((b) => b.days.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] } : null; }
  const inv: any[] = await FeeInvoice.find({ studentId: s._id, status: { $ne: 'paid' } }).lean();
  const last: any = await TestAttempt.findOne({ studentId: s._id, submittedAt: { $ne: null } }).sort({ submittedAt: -1 }).populate('testId', 'title').lean();
  const pending = await pendingTests(s);
  const total = (await PointsLog.aggregate([{ $match: { studentId: s._id } }, { $group: { _id: null, p: { $sum: '$points' } } }]))[0]?.p ?? 0;
  res.json({
    todayStatus, next: next && { when: next.day, name: next.batch.name, time: `${next.batch.startTime}–${next.batch.endTime}` },
    pendingFee: inv.reduce((a, i) => a + balanceOf(i), 0), pendingInvoices: inv.length,
    latestTest: last && { id: last._id, title: last.testId?.title, score: last.score, stars: last.stars }, pendingTests: pending.length, points: total, streak: s.streak ?? 0,
  });
}));

async function pendingTests(s: any) {
  const now = new Date();
  const tests: any[] = await AbacusTest.find({
    $or: [{ batchIds: { $in: s.batchIds } }, { batchIds: { $size: 0 }, level: s.abacusLevel }],
    $and: [{ $or: [{ publishAt: null }, { publishAt: { $lte: now } }] }, { $or: [{ closeAt: null }, { closeAt: { $gte: now } }] }],
  }).select('title level settings closeAt').lean();
  const done = new Set((await TestAttempt.find({ studentId: s._id, submittedAt: { $ne: null } }).select('testId').lean() as any[]).map((a) => String(a.testId)));
  return tests.filter((t) => !done.has(String(t._id)));
}

parent.get('/children/:id/attendance', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  res.json(await attendanceSummary(String(s._id), String(req.query.month ?? dayKey().slice(0, 7))));
}));

parent.get('/children/:id/tests', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const results: any[] = await TestAttempt.find({ studentId: s._id, submittedAt: { $ne: null } }).populate('testId', 'title level').sort({ submittedAt: -1 }).lean();
  res.json({
    pending: await pendingTests(s),
    results: results.map((a) => ({ id: a._id, title: a.testId?.title, score: a.score, accuracy: a.accuracy, stars: a.stars, durationMs: a.durationMs, summary: a.aiSummary || a.feedback, remark: a.remark, at: a.submittedAt })),
  });
}));

/* test taking: questions never include answers */
parent.post('/children/:id/tests/:testId/start', wrap(async (req, res) => { const s = await child(req, req.params.id); res.json(await startAttempt(req.params.testId, String(s._id))); }));
parent.put('/children/:id/tests/:testId/progress', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const a = parse(z.object({ q: z.number().int(), given: z.number().nullable(), timeMs: z.number().min(0) }), req.body);
  res.json(await saveProgress(req.params.testId, String(s._id), a));
}));
parent.post('/children/:id/tests/:testId/submit', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const { answers } = parse(z.object({ answers: z.array(z.object({ q: z.number().int(), given: z.number().nullable(), timeMs: z.number().min(0) })).max(100) }), req.body);
  const out = await submitAttempt(req.params.testId, String(s._id), answers);
  res.json({ ...out, result: await resultFor(out.attemptId) });
}));
parent.get('/children/:id/results/:attemptId', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const r = await resultFor(req.params.attemptId);
  if (r.studentId !== String(s._id)) throw new HttpError(403, 'Not allowed');
  res.json(r);
}));

/* practice (engine runs in the browser; results sync here) */
parent.post('/children/:id/practice', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const d = parse(z.object({ mode: z.enum(['flash', 'listen', 'visual', 'sheet']), level: z.number().int().min(1).max(10), score: z.number().min(0).max(100), accuracy: z.number().min(0).max(100), avgTimeMs: z.number().min(0), settings: z.any().optional() }), req.body);
  const day = dayKey();
  await PracticeSession.create({ studentId: s._id, ...d, day });
  const st = await getSettings(); const pr = st.pointRules;
  const todayLogs = await PracticeSession.countDocuments({ studentId: s._id, day });
  const earnedToday = Math.min(pr.practiceDailyCap, todayLogs * pr.practiceSession);
  const prior = Math.min(pr.practiceDailyCap, (todayLogs - 1) * pr.practiceSession);
  const gained: { reason: string; points: number }[] = [];
  if (earnedToday - prior > 0) { await award(s._id, 'Practice session', earnedToday - prior, day); gained.push({ reason: 'Practice session', points: earnedToday - prior }); }
  if (todayLogs === 3) { await awardOnce(s._id, 'Daily goal reached', pr.dailyGoal, day); gained.push({ reason: 'Daily goal reached', points: pr.dailyGoal }); }
  // streak
  if (s.lastPracticeDay !== day) {
    const yest = dayKey(new Date(Date.now() - 86400_000));
    s.streak = s.lastPracticeDay === yest ? (s.streak ?? 0) + 1 : 1; s.lastPracticeDay = day; await s.save();
    const m: Record<number, number> = { 3: pr.streak3, 7: pr.streak7, 30: pr.streak30 };
    if (m[s.streak]) { await awardOnce(s._id, `Streak ${s.streak} days`, m[s.streak], `${s.streak}:${day}`); gained.push({ reason: `${s.streak} day streak`, points: m[s.streak] }); }
  }
  res.json({ ok: true, gained, streak: s.streak, sessionsToday: todayLogs });
}));
parent.get('/children/:id/practice', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const rows: any[] = await PracticeSession.find({ studentId: s._id }).sort({ createdAt: -1 }).limit(60).lean();
  const day = dayKey();
  res.json({ sessions: rows.reverse(), streak: s.streak ?? 0, todayCount: rows.filter((r) => r.day === day).length, goal: 3, badges: [...new Set(rows.filter((r) => r.accuracy >= 90).map((r) => r.level))].map((l) => `Level ${l} Star`) });
}));

/* fees */
parent.get('/children/:id/fees', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const rows: any[] = await FeeInvoice.find({ studentId: s._id }).populate('planId', 'name').sort({ dueDate: -1 }).lean();
  res.json(rows.map((i) => ({ ...i, total: totalOf(i), paid: paidOf(i), balance: balanceOf(i) })));
}));
parent.get('/children/:id/fees/:invoiceId/receipt', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const inv: any = await FeeInvoice.findOne({ _id: req.params.invoiceId, studentId: s._id }).lean();
  if (!inv?.receiptUrl) throw new HttpError(404, 'No receipt yet');
  res.json({ url: await signedGet(inv.receiptUrl) });
}));

/* notifications + settings */
parent.get('/notifications', wrap(async (req, res) => res.json(await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50).lean())));
parent.put('/settings', wrap(async (req, res) => {
  const { hideChild } = parse(z.object({ hideChild: z.boolean() }), req.body);
  await User.findByIdAndUpdate(req.user!.id, { hideChild });
  res.json({ hideChild });
}));

/* leaderboard for the child */
parent.get('/children/:id/leaderboard', wrap(async (req, res) => {
  const s = await child(req, req.params.id);
  const st = await getSettings();
  if (!st.leaderboard.enabled) return res.json({ enabled: false });
  const q = z.object({ period: z.enum(['week', 'month', 'all']).default('week'), scope: z.enum(['batch', 'level', 'all']).default('level') }).parse(req.query);
  const batchId = String(s.batchIds?.[0] ?? '');
  const off = batchId ? (await Batch.findById(batchId).select('leaderboardOff').lean() as any)?.leaderboardOff : false;
  if (off) return res.json({ enabled: false });
  const rows = await overallBoard({ ...q, level: s.abacusLevel, batchId });
  const me = rows.find((r) => r.studentId === String(s._id)) ?? null;
  const above = me && me.rank > 1 ? rows[me.rank - 2] : null;
  const snap: any = await LeaderboardSnapshot.findOne({ scope: 'level', level: s.abacusLevel }).sort({ createdAt: -1 }).lean();
  res.json({ enabled: true, top: rows.slice(0, 10), podium: rows.slice(0, 3), me, toNext: me && above ? Math.max(1, above.points - me.points + 1) : 0, total: rows.length, hallOfFame: (snap?.ranks ?? []).slice(0, 3) });
}));
parent.get('/children/:id/tests/:testId/board', wrap(async (req, res) => { await child(req, req.params.id); res.json(await testBoard(req.params.testId)); }));
