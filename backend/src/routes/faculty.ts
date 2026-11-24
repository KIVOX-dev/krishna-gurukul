import { Router } from 'express';
import { z } from 'zod';
import { AbacusTest, Attendance, Batch, Student, TestAttempt } from '../models';
import { HttpError, authenticate, parse, requireRole, wrap } from '../middleware';
import { attendanceSummary, markAttendance } from '../services/attendance';
import { dayKey, overallBoard, testBoard } from '../services/points';

export const faculty = Router();
faculty.use(authenticate, requireRole('faculty', 'admin'));

const dowName = (d = new Date()) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d.getTime() + 5.5 * 3600_000).getUTCDay()];

const ownFilter = (req: any) => (req.user.role === 'admin' ? {} : { facultyId: req.user.id });

/** My batches, today's classes first. */
faculty.get('/batches', wrap(async (req, res) => {
  const rows: any[] = await Batch.find(ownFilter(req)).populate('courseId', 'name').populate('studentIds', 'name abacusLevel avatar').lean();
  const today = dowName();
  const marked = new Set((await Attendance.find({ date: dayKey(), batchId: { $in: rows.map((b) => b._id) } }).select('batchId').lean() as any[]).map((a) => String(a.batchId)));
  res.json(rows.map((b) => ({ ...b, today: b.days.includes(today), markedToday: marked.has(String(b._id)) })).sort((a, b) => Number(b.today) - Number(a.today) || a.startTime.localeCompare(b.startTime)));
}));

faculty.get('/attendance/:batchId', wrap(async (req, res) => {
  const date = String(req.query.date ?? dayKey());
  const b: any = await Batch.findOne({ _id: req.params.batchId, ...ownFilter(req) }).populate('studentIds', 'name avatar').lean();
  if (!b) throw new HttpError(404, 'Batch not found');
  const att: any = await Attendance.findOne({ batchId: req.params.batchId, date }).lean();
  const map = new Map<string, string>((att?.records ?? []).map((r: any) => [String(r.studentId), r.status]));
  res.json({ date, batch: { id: b._id, name: b.name }, canEdit: req.user!.role === 'admin' || date === dayKey(), marked: !!att, students: b.studentIds.map((s: any) => ({ id: s._id, name: s.name, avatar: s.avatar, status: map.get(String(s._id)) ?? 'present' })) });
}));
faculty.post('/attendance/:batchId', wrap(async (req, res) => {
  const d = parse(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(dayKey()), records: z.array(z.object({ studentId: z.string(), status: z.enum(['present', 'absent', 'late', 'leave']) })) }), req.body);
  res.json(await markAttendance(req.params.batchId, d.date, d.records, req.user!));
}));

/** Test results of my batches (auto graded). */
faculty.get('/results', wrap(async (req, res) => {
  const batches: any[] = await Batch.find(ownFilter(req)).select('_id name studentIds').lean();
  const ids = batches.flatMap((b) => b.studentIds);
  const att: any[] = await TestAttempt.find({ studentId: { $in: ids }, submittedAt: { $ne: null } }).populate('studentId', 'name batchIds').populate('testId', 'title level').sort({ submittedAt: -1 }).limit(300).lean();
  res.json(att.map((a) => ({ id: a._id, student: a.studentId?.name, studentId: a.studentId?._id, test: a.testId?.title, testId: a.testId?._id, level: a.testId?.level, score: a.score, stars: a.stars, durationMs: a.durationMs, remark: a.remark, submittedAt: a.submittedAt, batch: batches.find((b) => b.studentIds.map(String).includes(String(a.studentId?._id)))?.name })));
}));
faculty.put('/results/:id/remark', wrap(async (req, res) => {
  const { remark } = parse(z.object({ remark: z.string().max(300) }), req.body);
  res.json(await TestAttempt.findByIdAndUpdate(req.params.id, { remark }, { new: true }).select('remark'));
}));

faculty.get('/students/:id', wrap(async (req, res) => {
  const s: any = await Student.findById(req.params.id).populate('batchIds', 'name facultyId').populate('courseIds', 'name').lean();
  if (!s) throw new HttpError(404, 'Not found');
  if (req.user!.role === 'faculty' && !s.batchIds.some((b: any) => String(b.facultyId) === req.user!.id)) throw new HttpError(403, 'Not your student');
  const { PracticeSession } = await import('../models');
  const attempts: any[] = await TestAttempt.find({ studentId: s._id, submittedAt: { $ne: null } }).populate('testId', 'title').sort({ submittedAt: 1 }).lean();
  const practice: any[] = await PracticeSession.find({ studentId: s._id }).sort({ createdAt: -1 }).limit(30).lean();
  res.json({ student: s, attendance: await attendanceSummary(String(s._id)), trend: attempts.map((a) => ({ test: a.testId?.title, score: a.score, at: a.submittedAt })), practice });
}));

/** Full leaderboard: same as admin, all levels + batches. Also used for Class TV mode. */
faculty.get('/board/overall', wrap(async (req, res) => {
  const q = z.object({ period: z.enum(['week', 'month', 'all']).default('week'), scope: z.enum(['batch', 'level', 'all']).default('all'), level: z.coerce.number().optional(), batchId: z.string().optional() }).parse(req.query);
  res.json(await overallBoard(q));
}));
faculty.get('/board/test/:testId', wrap(async (req, res) => res.json(await testBoard(req.params.testId))));
faculty.get('/board/tests', wrap(async (_req, res) => res.json(await AbacusTest.find().select('title level').sort({ createdAt: -1 }).limit(30).lean())));
