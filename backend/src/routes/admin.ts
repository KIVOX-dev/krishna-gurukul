import { Router, type Request } from 'express';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { generateQuestions, presetFor, presetToSettings, recomputeAnswer, type Question } from '@kg/shared';
import {
  AbacusTest, AiUsage, Attendance, AuditLog, Batch, Cms, Course, Enquiry, FeeInvoice, FeePlan, Notification,
  PointsLog, Setting, Student, TestAttempt, User,
} from '../models';
import { HttpError, audit, authenticate, parse, requireRole, wrap } from '../middleware';
import { sendDemoConfirm, sendWelcome } from '../integrations/brevo';
import { notifyPush, notifyTestAssigned } from '../services/notify';
import { askAi, aiEnabled, poolStatus } from '../integrations/groqPool';
import { presignUpload, signedGet } from '../integrations/b2';
import { balanceOf, generateInvoices, recordPayment, sendReminder, totalOf, paidOf } from '../services/fees';
import { getSettings, saveSettings } from '../services/settings';
import { award, dayKey } from '../services/points';

export const admin = Router();
admin.use(authenticate, requireRole('admin'));

const objId = z.string().regex(/^[a-f0-9]{24}$/i);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const send = (res: any, data: any) => res.json(data);

/* ------------------------------- dashboard ------------------------------- */
admin.get('/dashboard', wrap(async (_req, res) => {
  const today = dayKey();
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const att: any[] = await Attendance.find({ date: today }).lean();
  const recs = att.flatMap((a) => a.records);
  const attendancePct = recs.length ? Math.round((recs.filter((r) => r.status === 'present' || r.status === 'late').length / recs.length) * 100) : null;
  const invoices: any[] = await FeeInvoice.find({ dueDate: { $gte: monthStart } }).lean();
  const collected = (await FeeInvoice.find({ 'payments.date': { $gte: monthStart } }).lean() as any[]).flatMap((i) => i.payments).filter((p) => new Date(p.date) >= monthStart).reduce((a, p) => a + p.amount, 0);
  const due = invoices.reduce((a, i) => a + totalOf(i), 0);
  const overdue = await FeeInvoice.countDocuments({ status: 'overdue' });
  const newEnq = await Enquiry.countDocuments({ stage: 'New' });
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const followUps = await Enquiry.find({ followUpAt: { $lte: endOfToday }, stage: { $nin: ['Joined', 'Not interested'] } }).sort({ followUpAt: 1 }).limit(10).lean();
  const tests = await AbacusTest.find({ closeAt: { $gte: new Date() } }).sort({ closeAt: 1 }).limit(5).select('title level closeAt').lean();
  // low attendance: < 75% over last 30 days
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const docs: any[] = await Attendance.find({ date: { $gte: since } }).lean();
  const agg = new Map<string, { p: number; t: number }>();
  docs.forEach((d) => d.records.forEach((r: any) => { const k = String(r.studentId); const a = agg.get(k) ?? { p: 0, t: 0 }; if (r.status !== 'leave') { a.t++; if (r.status !== 'absent') a.p++; } agg.set(k, a); }));
  const low = [...agg.entries()].filter(([, a]) => a.t >= 3 && a.p / a.t < 0.75).map(([id, a]) => ({ id, pct: Math.round((a.p / a.t) * 100) }));
  const names = new Map((await Student.find({ _id: { $in: low.map((l) => l.id) } }).select('name').lean() as any[]).map((s) => [String(s._id), s.name]));
  res.json({
    students: await Student.countDocuments({ status: 'active' }), attendancePct, collected, due, overdue, newEnquiries: newEnq,
    followUps, upcomingTests: tests, lowAttendance: low.map((l) => ({ ...l, name: names.get(l.id) })),
  });
}));

/* -------------------------------- students -------------------------------- */
const studentSchema = z.object({
  name: z.string().min(2), photo: z.string().optional(), dob: z.string().optional(),
  parentIds: z.array(objId).default([]), courseIds: z.array(objId).default([]), batchIds: z.array(objId).default([]),
  abacusLevel: z.number().int().min(1).max(10).default(1), status: z.enum(['active', 'inactive', 'alumni']).default('active'),
  parent: z.object({ name: z.string(), email: z.string().email(), phone: z.string().optional() }).optional(),
});
async function nextAdmission() {
  const n = await Student.countDocuments();
  return `KG${new Date().getFullYear().toString().slice(2)}${String(n + 1).padStart(4, '0')}`;
}
async function ensureParent(p: { name: string; email: string; phone?: string }, studentName?: string) {
  let u: any = await User.findOne({ email: p.email.toLowerCase(), role: 'parent' });
  if (!u) { u = await User.create({ ...p, email: p.email.toLowerCase(), role: 'parent' }); sendWelcome(u.email, { name: u.name, student: studentName }, u._id).catch(() => {}); }
  return u;
}
async function syncBatches(studentId: any, batchIds: string[]) {
  await Batch.updateMany({ studentIds: studentId, _id: { $nin: batchIds } }, { $pull: { studentIds: studentId } });
  for (const b of batchIds) {
    const batch: any = await Batch.findById(b);
    if (!batch) continue;
    if (!batch.studentIds.map(String).includes(String(studentId))) {
      if (batch.studentIds.length >= batch.capacity) throw new HttpError(400, `${batch.name} is full (capacity ${batch.capacity})`);
      batch.studentIds.push(studentId); await batch.save();
    }
  }
}

admin.get('/students', wrap(async (req, res) => {
  const q: any = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.level) q.abacusLevel = Number(req.query.level);
  if (req.query.batch) q.batchIds = req.query.batch;
  if (req.query.q) q.name = { $regex: String(req.query.q), $options: 'i' };
  res.json(await Student.find(q).populate('parentIds', 'name email phone').populate('courseIds', 'name').populate('batchIds', 'name').sort({ name: 1 }).lean());
}));
admin.post('/students', wrap(async (req, res) => {
  const { parent, ...d } = parse(studentSchema, req.body);
  if (parent) d.parentIds.push(String((await ensureParent(parent, d.name))._id));
  const s: any = await Student.create({ ...d, admissionNo: await nextAdmission(), avatar: Math.floor(Math.random() * 8) });
  await syncBatches(s._id, d.batchIds);
  await audit(req, 'create', 'student', s._id);
  res.status(201).json(s);
}));
admin.put('/students/:id', wrap(async (req, res) => {
  const { parent, ...d } = parse(studentSchema.partial(), req.body);
  if (parent) d.parentIds = [...(d.parentIds ?? []), String((await ensureParent(parent, d.name))._id)];
  const s = await Student.findByIdAndUpdate(req.params.id, d, { new: true });
  if (d.batchIds) await syncBatches(req.params.id, d.batchIds);
  await audit(req, 'update', 'student', req.params.id, d);
  res.json(s);
}));
admin.delete('/students/:id', wrap(async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, { status: 'inactive' });
  await audit(req, 'deactivate', 'student', req.params.id);
  res.json({ ok: true });
}));
admin.post('/students/:id/promote', wrap(async (req, res) => {
  const s: any = await Student.findById(req.params.id);
  if (!s) throw new HttpError(404, 'Not found');
  s.abacusLevel = Math.min(10, s.abacusLevel + 1); await s.save();
  await audit(req, 'promote', 'student', s._id, { level: s.abacusLevel });
  res.json(s);
}));
admin.post('/students/import', wrap(async (req, res) => {
  const { file } = parse(z.object({ file: z.string().min(10) }), req.body); // base64 .xlsx
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(file, 'base64') as any);
  const ws = wb.worksheets[0];
  const header = (ws.getRow(1).values as any[]).map((v) => String(v ?? '').toLowerCase().trim());
  const col = (n: string) => header.indexOf(n);
  let created = 0; const errors: string[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (n: string) => String(row.getCell(col(n)).value ?? '').trim();
    const name = get('name');
    if (!name) continue;
    try {
      const pe = get('parent email');
      const parent = pe ? await ensureParent({ name: get('parent name') || `${name}'s parent`, email: pe, phone: get('parent phone') || undefined }, name) : null;
      await Student.create({ name, parentIds: parent ? [parent._id] : [], abacusLevel: Number(get('level')) || 1, admissionNo: await nextAdmission(), avatar: Math.floor(Math.random() * 8) });
      created++;
    } catch (e: any) { errors.push(`Row ${r}: ${e.message}`); }
  }
  await audit(req, 'import', 'student', undefined, { created });
  res.json({ created, errors });
}));
admin.get('/students/template', wrap(async (_req, res) => {
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Students');
  ws.addRow(['Name', 'Level', 'Parent Name', 'Parent Email', 'Parent Phone']); ws.addRow(['Aarav Kumar', 1, 'Priya Kumar', 'priya@example.com', '9876543210']);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="students-template.xlsx"');
  await wb.xlsx.write(res); res.end();
}));
admin.get('/students/:id/idcard', wrap(async (req, res) => {
  const s: any = await Student.findById(req.params.id).populate('courseIds', 'name').lean();
  if (!s) throw new HttpError(404, 'Not found');
  const doc = new PDFDocument({ size: [243, 153], margin: 0 });
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `inline; filename="${s.admissionNo}.pdf"`);
  doc.pipe(res);
  doc.rect(0, 0, 243, 153).fill('#EDF5FA'); doc.rect(0, 0, 243, 38).fill('#00457F'); doc.rect(0, 38, 243, 4).fill('#EC6206');
  doc.fillColor('#fff').fontSize(14).text('Krishna Gurukul', 14, 12);
  doc.fillColor('#00457F').fontSize(14).text(s.name, 14, 58, { width: 215 });
  doc.fillColor('#10263c').fontSize(9).text(`Admission no: ${s.admissionNo}`, 14, 84).text(`Abacus level: ${s.abacusLevel}`, 14, 98).text(`Courses: ${(s.courseIds ?? []).map((c: any) => c.name).join(', ') || '-'}`, 14, 112, { width: 215 });
  doc.fillColor('#5b7186').fontSize(7).text('Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore · +91 82706 65953', 14, 138);
  doc.end();
}));

/* --------------------------- parents + faculty --------------------------- */
const personSchema = z.object({ name: z.string().min(2), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional(), password: z.string().min(6).optional(), isActive: z.boolean().optional(), subjects: z.array(objId).optional(), bio: z.string().optional(), photo: z.string().optional(), experience: z.string().optional() });
for (const role of ['parent', 'faculty'] as const) {
  const base = role === 'parent' ? '/parents' : '/faculty';
  admin.get(base, wrap(async (_req, res) => {
    const users: any[] = await User.find({ role }).select('-passwordHash -trustedDevices').populate('subjects', 'name').sort({ name: 1 }).lean();
    if (role === 'parent') {
      const kids: any[] = await Student.find({ parentIds: { $in: users.map((u) => u._id) } }).select('name parentIds').lean();
      return res.json(users.map((u) => ({ ...u, children: kids.filter((k) => k.parentIds.map(String).includes(String(u._id))).map((k) => k.name) })));
    }
    const batches: any[] = await Batch.find({ facultyId: { $in: users.map((u) => u._id) } }).select('name facultyId').lean();
    res.json(users.map((u) => ({ ...u, batches: batches.filter((b) => String(b.facultyId) === String(u._id)).map((b) => b.name) })));
  }));
  admin.post(base, wrap(async (req, res) => {
    const { password, ...d } = parse(personSchema, req.body);
    if (!d.email) throw new HttpError(400, 'Email is required: it is used to sign in');
    if (role === 'faculty' && !password) throw new HttpError(400, 'Faculty need a password');
    const u = await User.create({ ...d, email: d.email || undefined, role, passwordHash: password ? await bcrypt.hash(password, 10) : undefined });
    await audit(req, 'create', role, u._id);
    res.status(201).json(u);
  }));
  admin.put(`${base}/:id`, wrap(async (req, res) => {
    const { password, ...d } = parse(personSchema.partial(), req.body);
    const patch: any = { ...d }; if (password) patch.passwordHash = await bcrypt.hash(password, 10);
    const u = await User.findOneAndUpdate({ _id: req.params.id, role }, patch, { new: true });
    await audit(req, 'update', role, req.params.id);
    res.json(u);
  }));
}
admin.get('/faculty/:id/attendance-history', wrap(async (req, res) => {
  res.json(await Attendance.find({ markedBy: req.params.id }).sort({ date: -1 }).limit(60).populate('batchId', 'name').lean());
}));

/* --------------------------------- courses -------------------------------- */
const courseSchema = z.object({ name: z.string().min(2), type: z.enum(['abacus', 'vedic', 'tuition', 'music']).default('abacus'), levels: z.array(z.string()).default([]), description: z.string().optional(), ageGroup: z.string().optional(), duration: z.string().optional(), icon: z.string().optional(), feeFrom: z.number().optional(), feeTo: z.number().optional(), isPublic: z.boolean().default(true) });
admin.get('/courses', wrap(async (_req, res) => res.json(await Course.find().sort({ createdAt: 1 }).lean())));
admin.post('/courses', wrap(async (req, res) => { const d = parse(courseSchema, req.body); const c = await Course.create({ ...d, slug: slug(d.name) }); await audit(req, 'create', 'course', c._id); res.status(201).json(c); }));
admin.put('/courses/:id', wrap(async (req, res) => { const d = parse(courseSchema.partial(), req.body); res.json(await Course.findByIdAndUpdate(req.params.id, d, { new: true })); }));
admin.delete('/courses/:id', wrap(async (req, res) => { await Course.findByIdAndUpdate(req.params.id, { isPublic: false }); res.json({ ok: true }); }));

/* --------------------------------- batches -------------------------------- */
const batchSchema = z.object({ name: z.string().min(2), courseId: objId, level: z.number().int().optional(), facultyId: objId.optional(), days: z.array(z.string()).default([]), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), mode: z.enum(['offline', 'online']).default('offline'), capacity: z.number().int().min(1).default(15), leaderboardOff: z.boolean().optional() });
async function checkClash(b: z.infer<typeof batchSchema>, selfId?: string) {
  if (!b.facultyId) return;
  const others: any[] = await Batch.find({ facultyId: b.facultyId, ...(selfId ? { _id: { $ne: selfId } } : {}) }).lean();
  for (const o of others) {
    const shareDay = o.days.some((d: string) => b.days.includes(d));
    if (shareDay && b.startTime < o.endTime && o.startTime < b.endTime) throw new HttpError(409, `Faculty clash: already teaching "${o.name}" at ${o.startTime}-${o.endTime}`);
  }
}
admin.get('/batches', wrap(async (_req, res) => res.json(await Batch.find().populate('courseId', 'name').populate('facultyId', 'name').populate('studentIds', 'name abacusLevel').sort({ name: 1 }).lean())));
admin.post('/batches', wrap(async (req, res) => { const d = parse(batchSchema, req.body); await checkClash(d); const b = await Batch.create(d); await audit(req, 'create', 'batch', b._id); res.status(201).json(b); }));
admin.put('/batches/:id', wrap(async (req, res) => {
  const cur: any = await Batch.findById(req.params.id).lean();
  const d = parse(batchSchema.partial(), req.body);
  await checkClash({ ...cur, ...d, facultyId: String(d.facultyId ?? cur.facultyId ?? '') || undefined } as any, req.params.id);
  res.json(await Batch.findByIdAndUpdate(req.params.id, d, { new: true }));
}));
admin.delete('/batches/:id', wrap(async (req, res) => { await Batch.findByIdAndDelete(req.params.id); await Student.updateMany({}, { $pull: { batchIds: req.params.id } }); res.json({ ok: true }); }));
admin.put('/batches/:id/students', wrap(async (req, res) => {
  const { studentIds } = parse(z.object({ studentIds: z.array(objId) }), req.body);
  const b: any = await Batch.findById(req.params.id);
  if (!b) throw new HttpError(404, 'Not found');
  if (studentIds.length > b.capacity) throw new HttpError(400, `Over capacity (${b.capacity})`);
  const before = b.studentIds.map(String);
  b.studentIds = studentIds; await b.save();
  await Student.updateMany({ _id: { $in: studentIds } }, { $addToSet: { batchIds: b._id } });
  await Student.updateMany({ _id: { $in: before.filter((x: string) => !studentIds.includes(x)) } }, { $pull: { batchIds: b._id } });
  res.json(b);
}));

/* ---------------------------------- fees ---------------------------------- */
const planSchema = z.object({ courseId: objId, name: z.string().min(2), amount: z.number().positive(), cycle: z.enum(['monthly', 'quarterly', 'term', 'one-time']).default('monthly'), dueDay: z.number().int().min(1).max(28).default(5), lateFee: z.number().min(0).default(0) });
admin.get('/fees/plans', wrap(async (_req, res) => res.json(await FeePlan.find().populate('courseId', 'name').lean())));
admin.post('/fees/plans', wrap(async (req, res) => res.status(201).json(await FeePlan.create(parse(planSchema, req.body)))));
admin.put('/fees/plans/:id', wrap(async (req, res) => res.json(await FeePlan.findByIdAndUpdate(req.params.id, parse(planSchema.partial(), req.body), { new: true }))));
admin.delete('/fees/plans/:id', wrap(async (req, res) => { await FeePlan.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
const invoiceView = (i: any) => ({ ...i, total: totalOf(i), paid: paidOf(i), balance: balanceOf(i) });
admin.get('/fees/invoices', wrap(async (req, res) => {
  const q: any = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.studentId) q.studentId = req.query.studentId;
  if (req.query.period) q.period = req.query.period;
  const rows: any[] = await FeeInvoice.find(q).populate('studentId', 'name admissionNo').populate('planId', 'name').sort({ dueDate: -1 }).limit(500).lean();
  res.json(rows.map(invoiceView));
}));
admin.post('/fees/generate', wrap(async (req, res) => { const r = await generateInvoices(); await audit(req, 'generate', 'invoices', undefined, r); res.json(r); }));
admin.post('/fees/invoices', wrap(async (req, res) => {
  const d = parse(z.object({ studentId: objId, planId: objId.optional(), period: z.string(), amount: z.number().positive(), dueDate: z.string() }), req.body);
  res.status(201).json(await FeeInvoice.create({ ...d, dueDate: new Date(d.dueDate) }));
}));
admin.put('/fees/invoices/:id', wrap(async (req, res) => {
  const d = parse(z.object({ discount: z.number().min(0).optional(), lateFee: z.number().min(0).optional(), dueDate: z.string().optional() }), req.body);
  const inv: any = await FeeInvoice.findByIdAndUpdate(req.params.id, { ...d, ...(d.dueDate ? { dueDate: new Date(d.dueDate) } : {}) }, { new: true });
  if (inv && balanceOf(inv) === 0 && inv.payments.length) { inv.status = 'paid'; await inv.save(); }
  await audit(req, 'update', 'invoice', req.params.id, d);
  res.json(inv);
}));
admin.post('/fees/invoices/:id/pay', wrap(async (req, res) => {
  const d = parse(z.object({ amount: z.number().positive(), mode: z.enum(['cash', 'upi', 'bank']), ref: z.string().optional() }), req.body);
  const inv = await recordPayment(req.params.id, d, req.user!.id);
  await audit(req, 'payment', 'invoice', req.params.id, d);
  res.json(invoiceView(inv.toObject()));
}));
admin.get('/fees/invoices/:id/receipt', wrap(async (req, res) => {
  const inv: any = await FeeInvoice.findById(req.params.id).lean();
  if (!inv?.receiptUrl) throw new HttpError(404, 'No receipt yet');
  res.json({ url: await signedGet(inv.receiptUrl) });
}));
admin.post('/fees/invoices/:id/remind', wrap(async (req, res) => {
  const inv: any = await FeeInvoice.findById(req.params.id).lean();
  if (!inv) throw new HttpError(404, 'Not found');
  const sent = await sendReminder(inv, inv.dueDate < new Date() ? 'overdue' : 'due');
  res.json({ sent });
}));
admin.post('/fees/remind-bulk', wrap(async (req, res) => {
  const invs: any[] = await FeeInvoice.find({ status: { $in: ['overdue', 'partial'] } }).lean();
  let sent = 0; for (const i of invs) sent += await sendReminder(i, 'overdue');
  res.json({ sent, invoices: invs.length });
}));
admin.get('/fees/defaulters.xlsx', wrap(async (_req, res) => {
  const rows: any[] = await FeeInvoice.find({ status: { $in: ['overdue', 'partial'] } }).populate('studentId', 'name admissionNo').lean();
  await sheet(res, 'Defaulters', ['Student', 'Admission no', 'Period', 'Total', 'Paid', 'Balance', 'Due date'], rows.map((i) => [i.studentId?.name, i.studentId?.admissionNo, i.period, totalOf(i), paidOf(i), balanceOf(i), new Date(i.dueDate).toLocaleDateString('en-IN')]));
}));

async function sheet(res: any, name: string, headers: string[], rows: any[][]) {
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet(name);
  ws.addRow(headers).font = { bold: true }; rows.forEach((r) => ws.addRow(r)); ws.columns.forEach((c) => (c.width = 20));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${name.toLowerCase()}.xlsx"`);
  await wb.xlsx.write(res); res.end();
}

/* -------------------------------- enquiries -------------------------------- */
admin.get('/enquiries', wrap(async (req, res) => {
  const q: any = {};
  for (const k of ['stage', 'source', 'type']) if (req.query[k]) q[k] = req.query[k];
  if (req.query.course) q.courses = req.query.course;
  if (req.query.from) q.createdAt = { $gte: new Date(String(req.query.from)) };
  if (req.query.q) q.$or = [{ name: { $regex: String(req.query.q), $options: 'i' } }, { phone: { $regex: String(req.query.q) } }];
  res.json(await Enquiry.find(q).populate('assignedTo', 'name').sort({ createdAt: -1 }).limit(500).lean());
}));
admin.get('/enquiries/badge', wrap(async (_req, res) => res.json({ count: await Enquiry.countDocuments({ seen: false }) })));
admin.post('/enquiries/mark-seen', wrap(async (_req, res) => { await Enquiry.updateMany({ seen: false }, { seen: true }); res.json({ ok: true }); }));
admin.post('/enquiries', wrap(async (req, res) => { const d = parse(z.object({ name: z.string().min(2), phone: z.string().optional(), email: z.string().optional(), courses: z.array(z.string()).default([]), message: z.string().optional(), source: z.string().default('walk-in'), childName: z.string().optional(), childAge: z.string().optional() }), req.body); res.status(201).json(await Enquiry.create({ ...d, seen: true })); }));
admin.put('/enquiries/:id', wrap(async (req, res) => {
  const d = parse(z.object({ stage: z.enum(['New', 'Contacted', 'Demo booked', 'Demo attended', 'Joined', 'Not interested']).optional(), assignedTo: objId.optional().nullable(), followUpAt: z.string().optional().nullable() }), req.body);
  const patch: any = { ...d, ...(d.followUpAt !== undefined ? { followUpAt: d.followUpAt ? new Date(d.followUpAt) : null } : {}) };
  const before: any = d.assignedTo ? await Enquiry.findById(req.params.id).select('assignedTo').lean() : null;
  const updated: any = await Enquiry.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (d.assignedTo && String(before?.assignedTo ?? '') !== String(d.assignedTo))
    notifyPush(d.assignedTo, { type: 'enquiry-assigned', title: 'Enquiry assigned to you', body: `${updated?.name ?? 'New enquiry'}${updated?.phone ? ' · ' + updated.phone : ''}`, route: '/admin/enquiries' }).catch(() => {});
  res.json(updated);
}));
admin.post('/enquiries/:id/notes', wrap(async (req, res) => {
  const { text } = parse(z.object({ text: z.string().min(1).max(500) }), req.body);
  res.json(await Enquiry.findByIdAndUpdate(req.params.id, { $push: { notes: { by: req.user!.name, text, at: new Date() } } }, { new: true }));
}));
admin.post('/enquiries/:id/demo', wrap(async (req, res) => {
  const { batchId, date } = parse(z.object({ batchId: objId, date: z.string() }), req.body);
  const e: any = await Enquiry.findByIdAndUpdate(req.params.id, { demo: { batchId, date: new Date(date) }, stage: 'Demo booked' }, { new: true });
  const b: any = await Batch.findById(batchId).lean();
  if (e?.email) sendDemoConfirm(e.email, { name: e.name, batch: b?.name ?? 'our team', date: new Date(date).toLocaleDateString('en-IN') }).catch(() => {});
  res.json(e);
}));
admin.post('/enquiries/:id/convert', wrap(async (req, res) => {
  const e: any = await Enquiry.findById(req.params.id);
  if (!e) throw new HttpError(404, 'Not found');
  if (e.convertedStudentId) throw new HttpError(409, 'Already converted');
  const courses = await Course.find({ name: { $in: e.courses ?? [] } }).select('_id').lean();
  const parentEmail = e.email || `parent.${e.phone}@placeholder.local`;
  const parent = await ensureParent({ name: e.name, email: parentEmail, phone: e.phone }, e.childName);
  const s: any = await Student.create({ name: e.childName || `${e.name}'s child`, parentIds: [parent._id], courseIds: courses.map((c: any) => c._id), admissionNo: await nextAdmission(), avatar: Math.floor(Math.random() * 8) });
  e.convertedStudentId = s._id; e.stage = 'Joined'; await e.save();
  await audit(req, 'convert', 'enquiry', e._id, { student: s._id });
  res.json({ student: s, parent: { id: parent._id, email: parent.email } });
}));
admin.get('/enquiries.xlsx', wrap(async (_req, res) => {
  const rows: any[] = await Enquiry.find().sort({ createdAt: -1 }).lean();
  await sheet(res, 'Enquiries', ['Date', 'Name', 'Phone', 'Email', 'Child', 'Courses', 'Stage', 'Source'], rows.map((e) => [new Date(e.createdAt).toLocaleDateString('en-IN'), e.name, e.phone, e.email, e.childName, (e.courses ?? []).join(', '), e.stage, e.source]));
}));
admin.get('/reports/enquiries', wrap(async (_req, res) => {
  const all: any[] = await Enquiry.find().lean();
  const joined = all.filter((e) => e.stage === 'Joined').length;
  const count = (f: (e: any) => string[]) => Object.entries(all.flatMap(f).reduce((m: any, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([name, n]) => ({ name, n }));
  const weeks: Record<string, number> = {};
  all.forEach((e) => { const d = new Date(e.createdAt); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = d.toISOString().slice(0, 10); weeks[k] = (weeks[k] ?? 0) + 1; });
  res.json({ total: all.length, joined, conversion: all.length ? Math.round((joined / all.length) * 100) : 0, topCourses: count((e) => e.courses ?? []), topSources: count((e) => [e.source ?? 'website']), perWeek: Object.entries(weeks).sort().slice(-8).map(([week, n]) => ({ week, n })) });
}));

/* ---------------------------------- tests --------------------------------- */
const testSchema = z.object({
  title: z.string().min(2), level: z.number().int().min(1).max(10),
  batchIds: z.array(objId).default([]), type: z.enum(['assigned', 'live', 'practice-set']).default('assigned'),
  settings: z.object({ timeLimit: z.number().int().min(0).default(300), questionCount: z.number().int().min(1).max(60), digits: z.number().int().min(1).max(5), rows: z.number().int().min(2).max(15), operations: z.enum(['+', '-', 'x', '/', 'mixed']) }),
  publishAt: z.string().optional(), closeAt: z.string().optional(), useAi: z.boolean().default(false),
});
async function aiQuestions(s: any, level: number): Promise<Question[] | null> {
  const st = await getSettings();
  if (!aiEnabled() || !st.ai.enabled || !st.ai.questions) return null;
  const r = await askAi({
    system: 'You generate abacus practice questions as strict JSON: {"questions":[{"numbers":[ints],"op":"+|-|x|/|mixed"}]}. Positive and negative integers for +/-, [a,b] for x and /. No answers.',
    user: `Level ${level}. Count ${s.questionCount}. Digits ${s.digits}. Rows ${s.rows}. Operations ${s.operations}. Running total must never go negative.`,
    maxTokens: 1500, json: true, fallback: '',
  }, { skipCache: true });
  if (!r.fromAi) return null;
  try {
    const parsed = JSON.parse(r.text).questions as { numbers: number[]; op: any }[];
    // use ONLY the numbers returned; recompute answers in code
    return parsed.slice(0, s.questionCount).filter((q) => Array.isArray(q.numbers) && q.numbers.every(Number.isInteger)).map((q, i) => ({ id: i + 1, numbers: q.numbers, op: q.op, answer: recomputeAnswer(q.numbers, q.op) }));
  } catch { return null; }
}
admin.get('/tests/presets', (_req, res) => res.json([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => ({ ...presetFor(l), settings: presetToSettings(presetFor(l)) }))));
admin.get('/tests', wrap(async (_req, res) => {
  const tests: any[] = await AbacusTest.find().select('-questions').populate('batchIds', 'name').sort({ createdAt: -1 }).lean();
  const counts = await TestAttempt.aggregate([{ $match: { submittedAt: { $ne: null } } }, { $group: { _id: '$testId', n: { $sum: 1 }, avg: { $avg: '$score' } } }]);
  res.json(tests.map((t) => ({ ...t, submissions: counts.find((c: any) => String(c._id) === String(t._id))?.n ?? 0, avgScore: Math.round(counts.find((c: any) => String(c._id) === String(t._id))?.avg ?? 0) })));
}));
admin.post('/tests', wrap(async (req, res) => {
  const d = parse(testSchema, req.body);
  let questions: Question[] | null = d.useAi ? await aiQuestions(d.settings, d.level) : null;
  const source = questions ? 'ai' : 'engine';
  questions ??= generateQuestions({ ...d.settings, level: d.level } as any, Date.now());
  const { useAi, ...rest } = d;
  const t = await AbacusTest.create({ ...rest, questions, source, createdBy: req.user!.id, publishAt: d.publishAt ? new Date(d.publishAt) : undefined, closeAt: d.closeAt ? new Date(d.closeAt) : undefined });
  await audit(req, 'create', 'test', t._id);
  notifyTestAssigned(d.batchIds ?? [], d.title, d.level).catch(() => {});
  res.status(201).json({ id: t._id, source, questionCount: questions.length });
}));
admin.get('/tests/:id', wrap(async (req, res) => res.json(await AbacusTest.findById(req.params.id).populate('batchIds', 'name').lean())));
admin.delete('/tests/:id', wrap(async (req, res) => { await AbacusTest.findByIdAndDelete(req.params.id); await TestAttempt.deleteMany({ testId: req.params.id }); await audit(req, 'delete', 'test', req.params.id); res.json({ ok: true }); }));
admin.get('/tests/:id/results', wrap(async (req, res) => {
  const t: any = await AbacusTest.findById(req.params.id).lean();
  const att: any[] = await TestAttempt.find({ testId: req.params.id, submittedAt: { $ne: null } }).populate('studentId', 'name batchIds').lean();
  const perQuestion = (t.questions as Question[]).map((q) => {
    const answered = att.map((a) => a.answers.find((x: any) => x.q === q.id)).filter(Boolean);
    return { q: q.id, accuracy: answered.length ? Math.round((answered.filter((x: any) => x.correct).length / answered.length) * 100) : 0 };
  });
  res.json({ title: t.title, attempts: att.map((a) => ({ id: a._id, student: a.studentId?.name, score: a.score, stars: a.stars, durationMs: a.durationMs, remark: a.remark, batchIds: a.studentId?.batchIds })), perQuestion });
}));

/* ------------------------------ leaderboard admin ------------------------------ */
admin.post('/bonus-points', wrap(async (req, res) => {
  const d = parse(z.object({ studentId: objId, points: z.number().int().min(-50).max(100), reason: z.string().min(2).max(120) }), req.body);
  await award(d.studentId, `Bonus: ${d.reason}`, d.points, `manual:${Date.now()}`);
  await audit(req, 'bonus', 'points', d.studentId, d);
  res.json({ ok: true });
}));
admin.get('/points-log/:studentId', wrap(async (req, res) => res.json(await PointsLog.find({ studentId: req.params.studentId }).sort({ at: -1 }).limit(100).lean())));

/* ----------------------------------- cms ----------------------------------- */
admin.put('/cms', wrap(async (req, res) => {
  const d = parse(z.object({ page: z.string(), section: z.string(), content: z.record(z.any()), images: z.array(z.string()).optional() }), req.body);
  res.json(await Cms.findOneAndUpdate({ page: d.page, section: d.section }, { content: d.content, ...(d.images ? { images: d.images } : {}), updatedBy: req.user!.id }, { upsert: true, new: true }));
}));
admin.get('/cms', wrap(async (_req, res) => res.json(await Cms.find().lean())));

/* ----------------------------------- reports ----------------------------------- */
admin.get('/reports/attendance', wrap(async (req, res) => {
  const month = String(req.query.month ?? dayKey().slice(0, 7));
  const docs: any[] = await Attendance.find({ date: { $regex: `^${month}` } }).populate('batchId', 'name').lean();
  const by = new Map<string, { name: string; p: number; t: number }>();
  docs.forEach((d) => { const k = String(d.batchId?._id); const a = by.get(k) ?? { name: d.batchId?.name, p: 0, t: 0 }; d.records.forEach((r: any) => { a.t++; if (r.status === 'present' || r.status === 'late') a.p++; }); by.set(k, a); });
  const rows = [...by.values()].map((a) => ({ batch: a.name, present: a.p, total: a.t, percent: a.t ? Math.round((a.p / a.t) * 100) : 0 }));
  if (req.query.format === 'xlsx') return sheet(res, 'Attendance', ['Batch', 'Present', 'Total', '%'], rows.map((r) => [r.batch, r.present, r.total, r.percent]));
  res.json(rows);
}));
admin.get('/reports/fees', wrap(async (req, res) => {
  const inv: any[] = await FeeInvoice.find().populate('studentId', 'name').lean();
  const rows = inv.map((i) => ({ student: i.studentId?.name, period: i.period, total: totalOf(i), paid: paidOf(i), balance: balanceOf(i), status: i.status }));
  if (req.query.format === 'xlsx') return sheet(res, 'Fees', ['Student', 'Period', 'Total', 'Paid', 'Balance', 'Status'], rows.map((r) => Object.values(r)));
  res.json({ rows, collected: rows.reduce((a, r) => a + r.paid, 0), outstanding: rows.reduce((a, r) => a + r.balance, 0) });
}));
admin.get('/reports/tests', wrap(async (req, res) => {
  const att: any[] = await TestAttempt.find({ submittedAt: { $ne: null } }).populate('studentId', 'name').populate('testId', 'title').sort({ submittedAt: -1 }).limit(300).lean();
  const rows = att.map((a) => ({ student: a.studentId?.name, test: a.testId?.title, score: a.score, stars: a.stars, minutes: Math.round(a.durationMs / 6000) / 10 }));
  if (req.query.format === 'xlsx') return sheet(res, 'Tests', ['Student', 'Test', 'Score', 'Stars', 'Minutes'], rows.map((r) => Object.values(r)));
  res.json(rows);
}));
admin.get('/reports/weekly-winners', wrap(async (_req, res) => {
  const { LeaderboardSnapshot } = await import('../models');
  res.json(await LeaderboardSnapshot.find({ scope: 'level' }).sort({ createdAt: -1 }).limit(10).lean());
}));

/* ------------------------------ settings / audit / ai ------------------------------ */
admin.get('/settings', wrap(async (_req, res) => res.json(await getSettings())));
admin.put('/settings', wrap(async (req, res) => { const s = await saveSettings(req.body); await audit(req, 'update', 'settings'); res.json(s); }));
admin.get('/audit', wrap(async (_req, res) => res.json(await AuditLog.find().sort({ at: -1 }).limit(200).lean())));
admin.get('/ai/usage', wrap(async (_req, res) => res.json({ pool: poolStatus(), enabled: aiEnabled(), usage: await AiUsage.find().sort({ day: -1 }).limit(60).lean() })));
admin.get('/notifications', wrap(async (_req, res) => res.json(await Notification.find().sort({ createdAt: -1 }).limit(100).lean())));
admin.post('/uploads/presign', wrap(async (req, res) => {
  const d = parse(z.object({ filename: z.string(), contentType: z.string(), visibility: z.enum(['public', 'private']).default('public') }), req.body);
  res.json(await presignUpload(d.filename, d.contentType, d.visibility));
}));
export const unusedSend = send; // keep helper referenced
export type { Request };
void Setting;
