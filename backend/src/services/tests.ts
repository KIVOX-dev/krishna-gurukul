import { gradeAnswers, ruleFeedback, toPublic, type AnswerGiven, type Question } from '@kg/shared';
import { waitUntil } from '@vercel/functions';
import { AbacusTest, Student, TestAttempt, User } from '../models';
import { HttpError } from '../middleware';
import { sendTestResult } from '../integrations/brevo';
import { award, awardOnce } from './points';
import { getSettings } from './settings';
import { processAiQueue } from './aiQueue';

const GRACE_MS = 8000;

export async function assertAssigned(testId: string, studentId: string) {
  const test: any = await AbacusTest.findById(testId);
  if (!test) throw new HttpError(404, 'Test not found');
  const s: any = await Student.findById(studentId).lean();
  if (!s) throw new HttpError(404, 'Student not found');
  const inBatch = (test.batchIds ?? []).some((b: any) => (s.batchIds ?? []).map(String).includes(String(b)));
  const levelOpen = !(test.batchIds?.length) && (!test.level || test.level === s.abacusLevel);
  if (!inBatch && !levelOpen) throw new HttpError(403, 'This test is not assigned to this child');
  const now = new Date();
  if (test.publishAt && test.publishAt > now) throw new HttpError(403, 'This test has not opened yet');
  if (test.closeAt && test.closeAt < now) throw new HttpError(403, 'This test is closed');
  return test;
}

/** Start or resume. Questions are sent WITHOUT answers. */
export async function startAttempt(testId: string, studentId: string) {
  const test = await assertAssigned(testId, studentId);
  const startedAt = new Date();
  const limit = test.settings?.timeLimit ?? 0;
  // atomic upsert: two simultaneous starts (double request, StrictMode) must not collide on the unique index
  const att: any = await TestAttempt.findOneAndUpdate(
    { testId, studentId },
    { $setOnInsert: { testId, studentId, startedAt, ...(limit ? { deadline: new Date(startedAt.getTime() + limit * 1000) } : {}) } },
    { upsert: true, new: true },
  );
  if (att.submittedAt) throw new HttpError(409, 'Already submitted');
  const remainingMs = att.deadline ? Math.max(0, att.deadline.getTime() - Date.now()) : null;
  return {
    attemptId: String(att._id), title: test.title, settings: test.settings, remainingMs,
    questions: (test.questions as Question[]).map(toPublic),
    progress: att.progress ?? [],
  };
}

export async function saveProgress(testId: string, studentId: string, answer: AnswerGiven) {
  await assertAssigned(testId, studentId).catch(() => {});
  const att: any = await TestAttempt.findOne({ testId, studentId });
  if (!att || att.submittedAt) throw new HttpError(409, 'Attempt not active');
  const next = (att.progress ?? []).filter((p: any) => p.q !== answer.q);
  next.push({ q: answer.q, given: answer.given as number, timeMs: answer.timeMs });
  await TestAttempt.updateOne({ _id: att._id }, { progress: next });
  return { saved: true };
}

export async function submitAttempt(testId: string, studentId: string, answers: AnswerGiven[]) {
  const test: any = await AbacusTest.findById(testId);
  const att: any = await TestAttempt.findOne({ testId, studentId });
  if (!test || !att) throw new HttpError(404, 'Start the test first');
  if (att.submittedAt) throw new HttpError(409, 'Already submitted');
  // merge saved progress with whatever the client sent last
  const merged = new Map<number, AnswerGiven>();
  for (const p of att.progress ?? []) merged.set(p.q, { q: p.q, given: p.given, timeMs: p.timeMs });
  const late = att.deadline && Date.now() > att.deadline.getTime() + GRACE_MS;
  if (!late) for (const a of answers) merged.set(a.q, a);
  const grade = gradeAnswers(test.questions as Question[], [...merged.values()]);
  const feedback = ruleFeedback(grade, test.questions as Question[]);
  const durationMs = Date.now() - att.startedAt.getTime();

  // improvement vs previous test
  const prev: any = await TestAttempt.findOne({ studentId, submittedAt: { $ne: null } }).sort({ submittedAt: -1 }).lean();
  const improvement = prev ? grade.score - prev.score : 0;
  const st = await getSettings();
  const aiOn = st.ai.enabled && st.ai.summaries;

  Object.assign(att, {
    answers: grade.answers.map((a) => ({ ...a, given: a.given ?? undefined })), score: grade.score, accuracy: grade.accuracy, stars: grade.stars,
    correct: grade.correct, wrong: grade.wrong, skipped: grade.skipped, durationMs, fastestMs: grade.fastestMs,
    submittedAt: new Date(), gradedBy: 'auto', feedback, improvement,
    aiStatus: aiOn ? 'queued' : 'fallback', aiSummary: aiOn ? undefined : feedback,
  });
  await att.save();

  // points: instantly, in code
  const pr = st.pointRules;
  const base = Math.min(10, Math.round(grade.score / 10) * pr.testPerTenPercent) + grade.stars * pr.starBonus;
  await awardOnce(studentId, 'Test submitted', base, String(att._id));
  if (prev && grade.score > prev.score) await awardOnce(studentId, 'Beat your last test', pr.beatLast, String(att._id));

  // parent email + queued AI summary (small batch after response, hourly cron sweeps the rest)
  const student: any = await Student.findById(studentId).lean();
  const parents: any[] = await User.find({ _id: { $in: student?.parentIds ?? [] } }).lean();
  for (const p of parents) if (p.email) sendTestResult(p.email, { student: student.name, title: test.title, score: grade.score, stars: grade.stars, summary: feedback, correct: grade.correct, wrong: grade.wrong, skipped: grade.skipped, seconds: Math.round(durationMs / 1000), improvement }, p._id).catch(() => {});
  await AbacusTest.updateOne({ _id: test._id }, {}); // touch
  try { waitUntil(processAiQueue(3)); } catch { processAiQueue(3).catch(() => {}); }

  return { attemptId: String(att._id) };
}

/** Full result including answer review (only after submit). */
export async function resultFor(attemptId: string) {
  const att: any = await TestAttempt.findById(attemptId).populate('testId').lean();
  if (!att?.submittedAt) throw new HttpError(404, 'No result yet');
  const qs: Question[] = att.testId.questions;
  return {
    id: String(att._id), studentId: String(att.studentId), title: att.testId.title, level: att.testId.level,
    score: att.score, accuracy: att.accuracy, stars: att.stars, correct: att.correct, wrong: att.wrong, skipped: att.skipped,
    durationMs: att.durationMs, fastestMs: att.fastestMs, improvement: att.improvement, feedback: att.feedback,
    aiSummary: att.aiSummary, aiStatus: att.aiStatus, remark: att.remark, submittedAt: att.submittedAt,
    review: att.answers.map((a: any) => {
      const q = qs.find((x) => x.id === a.q)!;
      return { ...a, numbers: q.numbers, op: q.op };
    }),
  };
}
