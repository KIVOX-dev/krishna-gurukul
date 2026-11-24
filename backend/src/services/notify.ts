import { User } from '../models';
import { sendPush, type PushPayload } from '../integrations/fcm';

/** Push types a parent can switch on/off in Settings. */
export const PUSH_TYPES = ['test-assigned', 'test-result', 'absence', 'fee', 'rank-up', 'enquiry-assigned'] as const;
export type PushType = (typeof PUSH_TYPES)[number];

/** Respects the user's per-type push preference (default on). */
export async function notifyPush(userId: any, p: PushPayload & { type: PushType }) {
  if (!userId) return;
  const u: any = await User.findById(userId).select('prefs').lean();
  if (u?.prefs?.push?.[p.type] === false) return;
  return sendPush(userId, p);
}

/** Maps an existing email template to its push, so every email trigger also pushes. */
export function pushForTemplate(template: string, d: any): (PushPayload & { type: PushType }) | null {
  switch (template) {
    case 'test-result': return { type: 'test-result', title: `${d.student}: ${d.score}% ${'⭐'.repeat(d.stars ?? 0)}`, body: `Result ready for ${d.title}`, route: '/parent/tests' };
    case 'absence': return { type: 'absence', title: 'Absent today', body: `${d.student} was marked absent in ${d.batch}`, route: '/parent/attendance' };
    case 'fee-reminder': return { type: 'fee', title: 'Fee reminder', body: `₹${d.amount} for ${d.student} is ${d.kind}`, route: '/parent/fees' };
    case 'fee-receipt': return { type: 'fee', title: 'Payment received', body: `₹${d.amount} for ${d.student}. Receipt ${d.receiptNo}`, route: '/parent/fees' };
    default: return null;
  }
}

export async function notifyTestAssigned(batchIds: any[], title: string, level?: number) {
  const { Student } = await import('../models');
  const q: any = batchIds?.length ? { batchIds: { $in: batchIds } } : level ? { abacusLevel: level } : {};
  const students: any[] = await Student.find({ ...q, status: 'active' }).select('name parentIds').lean();
  for (const s of students) for (const p of s.parentIds ?? [])
    notifyPush(p, { type: 'test-assigned', title: 'New test assigned', body: `${s.name}: ${title}`, route: '/parent/tests' }).catch(() => {});
}

export const notifyRankUp = (parentIds: any[], student: string, rank: number) =>
  Promise.all((parentIds ?? []).map((p) => notifyPush(p, { type: 'rank-up', title: `${student} moved up! 🏆`, body: `Now rank #${rank} on the leaderboard`, route: '/parent/leaderboard' })));
