import { PointsLog, Student, Batch, LeaderboardSnapshot, TestAttempt } from '../models';
import { getSettings } from './settings';
import { notifyRankUp } from './notify';

export const dayKey = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST day

export async function award(studentId: any, reason: string, points: number, refId?: string) {
  if (!points) return;
  await PointsLog.create({ studentId, reason, points, refId });
}

/** Award once per (student, reason, ref). Safe to call again. */
export async function awardOnce(studentId: any, reason: string, points: number, refId: string) {
  const exists = await PointsLog.exists({ studentId, reason, refId });
  if (!exists) await award(studentId, reason, points, refId);
}

export function periodStart(period: 'week' | 'month' | 'all'): Date {
  const now = new Date(Date.now() + 5.5 * 3600_000);
  if (period === 'all') return new Date(0);
  if (period === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3600_000);
  const dow = (now.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow) - 5.5 * 3600_000);
}

export type Scope = 'batch' | 'level' | 'all';

export async function overallBoard(opts: { period: 'week' | 'month' | 'all'; scope: Scope; level?: number; batchId?: string; since?: Date; until?: Date }) {
  const st = await getSettings();
  let filter: any = { status: 'active' };
  if (opts.scope === 'level' && opts.level) filter.abacusLevel = opts.level;
  if (opts.scope === 'batch' && opts.batchId) filter.batchIds = opts.batchId;
  let students: any[] = await Student.find(filter).select('name avatar abacusLevel parentIds batchIds').populate('parentIds', 'hideChild').lean();
  const offBatches = new Set((await Batch.find({ leaderboardOff: true }).select('_id').lean()).map((b: any) => String(b._id)));
  students = students.filter((s) => !(s.batchIds ?? []).some((b: any) => offBatches.has(String(b))));
  const from = opts.since ?? periodStart(opts.period);
  const match: any = { studentId: { $in: students.map((s) => s._id) }, at: { $gte: from } };
  if (opts.until) match.at.$lt = opts.until;
  const sums = await PointsLog.aggregate([{ $match: match }, { $group: { _id: '$studentId', points: { $sum: '$points' } } }]);
  const pts = new Map<string, number>(sums.map((s: any) => [String(s._id), s.points as number]));
  const rows = students
    .map((s) => ({
      studentId: String(s._id), name: displayName(s.name, st.leaderboard.nameMode, (s.parentIds ?? []).some((p: any) => p?.hideChild)),
      hidden: (s.parentIds ?? []).some((p: any) => p?.hideChild), avatar: s.avatar ?? 0, level: s.abacusLevel, points: pts.get(String(s._id)) ?? 0,
    }))
    .sort((a: any, b: any) => b.points - a.points || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  // rank change vs last snapshot
  const snap: any = await LeaderboardSnapshot.findOne({ scope: opts.scope === 'level' ? `level` : opts.scope, level: opts.level ?? 0 }).sort({ createdAt: -1 }).lean();
  const prev = new Map((snap?.ranks ?? []).map((r: any) => [String(r.studentId), r.rank]));
  return rows.map((r) => ({ ...r, change: prev.has(r.studentId) ? (prev.get(r.studentId) as number) - r.rank : 0 }));
}

export function displayName(name: string, mode: 'full' | 'firstInitial', hidden: boolean) {
  if (hidden) return 'Hidden Champion';
  if (mode === 'full') return name;
  const [f, ...rest] = name.split(' ');
  return rest.length ? `${f} ${rest[rest.length - 1][0]}.` : f;
}

export async function testBoard(testId: string) {
  const st = await getSettings();
  const attempts: any[] = await TestAttempt.find({ testId, submittedAt: { $ne: null } })
    .populate({ path: 'studentId', select: 'name avatar abacusLevel parentIds', populate: { path: 'parentIds', select: 'hideChild' } }).lean();
  return attempts
    .filter((a) => a.studentId)
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs)
    .map((a, i) => {
      const hidden = (a.studentId.parentIds ?? []).some((p: any) => p?.hideChild);
      return { rank: i + 1, studentId: String(a.studentId._id), name: displayName(a.studentId.name, st.leaderboard.nameMode, hidden), avatar: a.studentId.avatar ?? 0, score: a.score, stars: a.stars, durationMs: a.durationMs };
    });
}

/** Push "rank up" to parents when a student climbed since the previous weekly snapshot. */
async function pushRankUps(scope: string, level: number, rows: { studentId: any; name: string; rank: number }[]) {
  const prev: any = await LeaderboardSnapshot.findOne({ scope, level }).sort({ createdAt: -1 }).lean();
  if (!prev) return;
  const before = new Map<string, number>((prev.ranks ?? []).map((r: any) => [String(r.studentId), r.rank]));
  const climbed = rows.filter((r) => before.has(String(r.studentId)) && before.get(String(r.studentId))! > r.rank);
  if (!climbed.length) return;
  const studs: any[] = await Student.find({ _id: { $in: climbed.map((c) => c.studentId) } }).select('parentIds').lean();
  for (const c of climbed) {
    const s = studs.find((x) => String(x._id) === String(c.studentId));
    notifyRankUp(s?.parentIds ?? [], c.name, c.rank).catch(() => {});
  }
}

/** Snapshot ranks for Hall of Fame + rank change arrows. */
export async function snapshotWeekly() {
  const period = dayKey();
  const levels = (await Student.distinct('abacusLevel', { status: 'active' })) as number[];
  const jobs: Promise<any>[] = [];
  const snap = async (scope: string, level: number, rows: any[]) => {
    await pushRankUps(scope, level, rows);
    await LeaderboardSnapshot.create({ period, scope, level, ranks: rows.map((r) => ({ studentId: r.studentId, name: r.name, points: r.points, rank: r.rank })) });
  };
  for (const level of levels) jobs.push(overallBoard({ period: 'week', scope: 'level', level }).then((rows) => snap('level', level, rows)));
  jobs.push(overallBoard({ period: 'week', scope: 'all' }).then((rows) => snap('all', 0, rows)));
  await Promise.all(jobs);
  return { snapshots: levels.length + 1 };
}
