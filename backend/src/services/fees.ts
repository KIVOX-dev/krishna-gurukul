import PDFDocument from 'pdfkit';
import { FeeInvoice, FeePlan, Reminder, Student, User } from '../models';
import { putBuffer } from '../integrations/b2';
import { sendFeeReceipt, sendFeeReminder } from '../integrations/brevo';
import { getSettings } from './settings';
import { HttpError } from '../middleware';

export const paidOf = (inv: any) => (inv.payments ?? []).reduce((a: number, p: any) => a + (p.amount ?? 0), 0);
export const totalOf = (inv: any) => Math.max(0, (inv.amount ?? 0) - (inv.discount ?? 0) + (inv.lateFee ?? 0));
export const balanceOf = (inv: any) => Math.max(0, totalOf(inv) - paidOf(inv));

function periodFor(cycle: string, d: Date) {
  const y = d.getFullYear(), m = d.getMonth();
  if (cycle === 'monthly') return `${y}-${String(m + 1).padStart(2, '0')}`;
  if (cycle === 'quarterly') return `${y}-Q${Math.floor(m / 3) + 1}`;
  if (cycle === 'term') return `${y}-T${m < 6 ? 1 : 2}`;
  return 'one-time';
}

/** Create invoices for all active students whose course has a fee plan. Idempotent per (student, period). */
export async function generateInvoices(date = new Date()) {
  const students: any[] = await Student.find({ status: 'active' }).lean();
  const plans: any[] = await FeePlan.find().lean();
  let created = 0;
  for (const s of students) {
    for (const cid of s.courseIds ?? []) {
      const plan = plans.find((p) => String(p.courseId) === String(cid));
      if (!plan) continue;
      const period = periodFor(plan.cycle, date);
      const exists = await FeeInvoice.exists({ studentId: s._id, planId: plan._id, period });
      if (exists) continue;
      const due = new Date(date.getFullYear(), date.getMonth(), plan.dueDay ?? 5);
      await FeeInvoice.create({ studentId: s._id, planId: plan._id, period, amount: plan.amount, dueDate: due, status: due < new Date() ? 'overdue' : 'due' });
      created++;
    }
  }
  return { created };
}

export async function refreshFeeStatus() {
  const now = new Date();
  const open: any[] = await FeeInvoice.find({ status: { $in: ['due', 'partial', 'overdue'] } }).populate('planId').lean();
  let changed = 0;
  for (const inv of open) {
    if (inv.dueDate && inv.dueDate < now && balanceOf(inv) > 0) {
      const late = inv.lateFee || inv.planId?.lateFee || 0;
      await FeeInvoice.updateOne({ _id: inv._id }, { status: paidOf(inv) > 0 ? 'partial' : 'overdue', lateFee: late });
      changed++;
    }
  }
  return { changed };
}

export async function receiptPdf(inv: any, student: any, payment: any, receiptNo: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((r) => doc.on('end', () => r(Buffer.concat(chunks))));
  doc.rect(0, 0, doc.page.width, 64).fill('#00457F');
  doc.fillColor('#fff').fontSize(20).text('Krishna Gurukul', 36, 22);
  doc.fillColor('#EC6206').fontSize(10).text('Payment Receipt', 36, 46);
  doc.fillColor('#10263c').fontSize(11).moveDown(3);
  const rows: [string, string][] = [
    ['Receipt no.', receiptNo], ['Date', new Date(payment.date).toLocaleDateString('en-IN')], ['Student', student.name],
    ['Period', inv.period], ['Amount paid', `Rs. ${payment.amount}`], ['Mode', String(payment.mode).toUpperCase() + (payment.ref ? ` (${payment.ref})` : '')],
    ['Balance', `Rs. ${balanceOf(inv)}`],
  ];
  rows.forEach(([k, v]) => { doc.fontSize(10).fillColor('#5b7186').text(k, { continued: true }).fillColor('#10263c').text(`   ${v}`); doc.moveDown(0.4); });
  doc.moveDown(2).fontSize(8).fillColor('#5b7186').text('Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011 · +91 82706 65953');
  doc.end();
  return done;
}

export async function recordPayment(invoiceId: string, data: { amount: number; mode: 'cash' | 'upi' | 'bank'; ref?: string }, receivedBy: string) {
  const inv: any = await FeeInvoice.findById(invoiceId);
  if (!inv) throw new HttpError(404, 'Invoice not found');
  if (data.amount > balanceOf(inv)) throw new HttpError(400, `Amount is more than the balance (Rs. ${balanceOf(inv)})`);
  const st = await getSettings();
  const count = await FeeInvoice.countDocuments({ 'payments.0': { $exists: true } });
  const receiptNo = `${st.receiptPrefix}-${String(count + 1).padStart(5, '0')}-${inv.payments.length + 1}`;
  const payment = { ...data, date: new Date(), receivedBy, receiptNo };
  inv.payments.push(payment);
  inv.status = balanceOf(inv) === 0 ? 'paid' : 'partial';
  const student: any = await Student.findById(inv.studentId).lean();
  const pdf = await receiptPdf(inv, student, payment, receiptNo);
  const key = await putBuffer(`private/receipts/${receiptNo}.pdf`, pdf, 'application/pdf');
  inv.receiptUrl = key;
  await inv.save();
  const parents: any[] = await User.find({ _id: { $in: student.parentIds ?? [] } }).lean();
  for (const p of parents) if (p.email) sendFeeReceipt(p.email, { student: student.name, amount: data.amount, receiptNo, period: inv.period, mode: data.mode, ref: data.ref, balance: balanceOf(inv), date: new Date().toLocaleDateString('en-IN') }, p._id).catch(() => {});
  return inv;
}

export async function sendReminder(inv: any, kind: 'before-due' | 'due' | 'overdue') {
  const student: any = await Student.findById(inv.studentId).lean();
  const parents: any[] = await User.find({ _id: { $in: student?.parentIds ?? [] } }).lean();
  let sent = 0;
  for (const p of parents) {
    if (!p.email) continue;
    await sendFeeReminder(p.email, { student: student.name, period: inv.period, total: totalOf(inv), paid: paidOf(inv), amount: balanceOf(inv), due: new Date(inv.dueDate).toLocaleDateString('en-IN'), kind: kind === 'before-due' ? 'coming up' : kind === 'due' ? 'due today' : 'overdue' }, p._id);
    sent++;
  }
  await Reminder.create({ invoiceId: inv._id, type: kind, sentAt: new Date(), status: sent ? 'sent' : 'no-email' });
  return sent;
}

/** Daily 9 AM IST cron using the editable rules. */
export async function runReminderRules() {
  const { reminderRules: r } = await getSettings();
  const invs: any[] = await FeeInvoice.find({ status: { $in: ['due', 'partial', 'overdue'] } }).lean();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let sent = 0;
  for (const inv of invs) {
    if (balanceOf(inv) <= 0 || !inv.dueDate) continue;
    const due = new Date(inv.dueDate); due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff === r.beforeDays) sent += await sendReminder(inv, 'before-due').then((n) => (n ? 1 : 0));
    else if (diff === 0 && r.onDue) sent += await sendReminder(inv, 'due').then((n) => (n ? 1 : 0));
    else if (diff < 0 && r.overdueEvery > 0 && -diff % r.overdueEvery === 0) {
      const count = await Reminder.countDocuments({ invoiceId: inv._id, type: 'overdue' });
      if (count < r.overdueMax) sent += await sendReminder(inv, 'overdue').then((n) => (n ? 1 : 0));
    }
  }
  return { sent };
}
