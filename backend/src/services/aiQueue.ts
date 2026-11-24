import { askAi } from '../integrations/groqPool';
import { TestAttempt } from '../models';
import { getSettings } from './settings';

/** Parent AI summaries. Queue lives in Mongo (aiStatus: queued). No in-memory queue on Vercel. */
export async function processAiQueue(limit = 4) {
  const st = await getSettings();
  const jobs: any[] = await TestAttempt.find({ aiStatus: 'queued' }).sort({ submittedAt: 1 }).limit(limit)
    .populate('studentId', 'name abacusLevel').populate('testId', 'title level').lean();
  let done = 0;
  for (const a of jobs) {
    if (!st.ai.enabled || !st.ai.summaries) {
      await TestAttempt.updateOne({ _id: a._id }, { aiStatus: 'fallback', aiSummary: a.feedback });
      continue;
    }
    const wrong = (a.answers ?? []).filter((x: any) => !x.correct).length;
    const res = await askAi({
      system: 'You write one short, warm, plain-language progress note (max 45 words) for the parent of a child learning abacus. Be specific, encouraging, no jargon, no emojis.',
      user: `Child: ${a.studentId?.name}. Test: ${a.testId?.title} (level ${a.testId?.level}). Score ${a.score}%, correct ${a.correct}, wrong ${wrong}, skipped ${a.skipped}, avg time ${Math.round((a.durationMs ?? 0) / Math.max(1, a.answers?.length ?? 1) / 1000)}s per question. Rule-based notes: ${a.feedback}. Improvement vs last test: ${a.improvement ?? 0}%.`,
      maxTokens: 160, fallback: a.feedback ?? '',
    });
    await TestAttempt.updateOne({ _id: a._id }, { aiSummary: res.text, aiStatus: res.fromAi ? 'done' : 'fallback' });
    done++;
  }
  return { processed: jobs.length, ai: done };
}
