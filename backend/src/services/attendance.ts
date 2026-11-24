import { Attendance, Batch, PointsLog, Student, User } from '../models';
import { HttpError } from '../middleware';
import { sendAbsenceAlert } from '../integrations/brevo';
import { awardOnce, dayKey } from './points';
import { getSettings } from './settings';

export async function markAttendance(batchId: string, date: string, records: { studentId: string; status: string }[], user: { id: string; role: string }) {
  if (user.role !== 'admin' && date !== dayKey()) throw new HttpError(403, 'Faculty can mark attendance for today only');
  const batch: any = await Batch.findById(batchId).lean();
  if (!batch) throw new HttpError(404, 'Batch not found');
  if (user.role === 'faculty' && String(batch.facultyId) !== user.id) throw new HttpError(403, 'This is not your batch');
  const prev: any = await Attendance.findOne({ batchId, date }).lean();
  const prevMap = new Map<string, string>((prev?.records ?? []).map((r: any) => [String(r.studentId), r.status]));
  await Attendance.updateOne({ batchId, date }, { $set: { records, markedBy: user.id } }, { upsert: true });

  const st = await getSettings();
  for (const r of records) {
    const ref = `${batchId}:${date}`;
    if (r.status === 'present' || r.status === 'late') await awardOnce(r.studentId, 'Present in class', st.pointRules.present, ref);
    else await PointsLog.deleteMany({ studentId: r.studentId, reason: 'Present in class', refId: ref });
    // absence alert only when newly absent
    if (r.status === 'absent' && prevMap.get(r.studentId) !== 'absent') {
      const s: any = await Student.findById(r.studentId).lean();
      const parents: any[] = await User.find({ _id: { $in: s?.parentIds ?? [] } }).lean();
      for (const p of parents) if (p.email) sendAbsenceAlert(p.email, { student: s.name, batch: batch.name, date }, p._id).catch(() => {});
    }
  }
  return { saved: records.length };
}

export async function attendanceSummary(studentId: string, month?: string) {
  const q: any = { 'records.studentId': studentId };
  if (month) q.date = { $regex: `^${month}` };
  const docs: any[] = await Attendance.find(q).lean();
  const days = docs.map((d) => ({ date: d.date, status: d.records.find((r: any) => String(r.studentId) === String(studentId))?.status }));
  const attended = days.filter((d) => d.status === 'present' || d.status === 'late').length;
  const counted = days.filter((d) => d.status !== 'leave').length;
  return { days, percent: counted ? Math.round((attended / counted) * 100) : 0 };
}
