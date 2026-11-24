import { env } from '../config/env';
import { Notification } from '../models';
import { notifyPush, pushForTemplate } from '../services/notify';
import { T } from './emailTemplates';

/** Brevo transactional email. Mock mode (no API key): logs to console + notifications collection. */
const TEMPLATE_IDS: Record<string, number | undefined> = {}; // fill with Brevo template ids if you prefer Brevo-hosted templates

interface Mail { to: string; toName?: string; subject: string; html: string; template: string; userId?: any; payload?: any }

export async function sendMail(m: Mail) {
  // every email trigger that has a user also pushes to their devices (mock-logged when FIREBASE_* is empty)
  const push = m.userId ? pushForTemplate(m.template, m.payload ?? {}) : null;
  if (push) notifyPush(m.userId, push).catch(() => {});
  const rec = await Notification.create({ userId: m.userId, template: m.template, to: m.to, subject: m.subject, payload: m.payload, status: 'queued' });
  if (!env.brevo.apiKey) {
    console.log(`\n[brevo:mock] → ${m.to} | ${m.subject}${m.payload?.otp ? `  ·  OTP ${m.payload.otp}` : ''}`);
    await Notification.updateOne({ _id: rec._id }, { status: 'mock-logged' });
    return { mock: true };
  }
  try {
    const tid = TEMPLATE_IDS[m.template];
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.brevo.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: env.brevo.senderEmail, name: env.brevo.senderName },
        to: [{ email: m.to, name: m.toName }],
        ...(tid ? { templateId: tid, params: m.payload } : { subject: m.subject, htmlContent: m.html }),
      }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    await Notification.updateOne({ _id: rec._id }, { status: 'sent' });
    return { ok: true };
  } catch (e: any) {
    await Notification.updateOne({ _id: rec._id }, { status: 'failed', error: e.message });
    return { error: e.message };
  }
}

export const sendOtp = (to: string, otp: string, userId?: any, purpose: 'parent' | 'admin' = 'parent') =>
  sendMail({ to, userId, template: 'otp', subject: `${otp} is your Krishna Gurukul login code`, payload: { otp }, html: T.otp(otp, purpose) });

export const sendFeeReminder = (to: string, d: { student: string; amount: number; due: string; kind: string; period?: string; total?: number; paid?: number }, userId?: any) =>
  sendMail({ to, userId, template: 'fee-reminder', subject: d.kind === 'overdue' ? `Overdue: fee for ${d.student}` : `Fee reminder for ${d.student}`, payload: d, html: T.feeReminder(d) });

export const sendFeeReceipt = (to: string, d: { student: string; amount: number; receiptNo: string; url?: string; period?: string; mode?: string; balance?: number; date?: string; ref?: string }, userId?: any) =>
  sendMail({ to, userId, template: 'fee-receipt', subject: `Receipt ${d.receiptNo}: payment received for ${d.student}`, payload: d, html: T.feeReceipt(d) });

export const sendTestResult = (to: string, d: { student: string; title: string; score: number; stars: number; summary: string; correct?: number; wrong?: number; skipped?: number; seconds?: number; improvement?: number }, userId?: any) =>
  sendMail({ to, userId, template: 'test-result', subject: `${d.student} scored ${d.score}% in ${d.title}`, payload: d, html: T.testResult(d) });

export const sendAbsenceAlert = (to: string, d: { student: string; batch: string; date: string }, userId?: any) =>
  sendMail({ to, userId, template: 'absence', subject: `${d.student} was marked absent today`, payload: d, html: T.absence(d) });

export const sendWelcome = (to: string, d: { name: string; student?: string }, userId?: any) =>
  sendMail({ to, userId, template: 'welcome', subject: 'Welcome to Krishna Gurukul', payload: d, html: T.welcome({ ...d, email: to }) });

export const sendEnquiryOffice = (d: any) =>
  sendMail({ to: env.officeEmail, template: 'enquiry-office', subject: `New ${d.type === 'demo' ? 'demo request' : 'enquiry'}: ${d.name} (${d.phone})`, payload: d, html: T.enquiryOffice(d) });

export const sendEnquiryAutoReply = (to: string, d: { name: string }) =>
  sendMail({ to, template: 'enquiry-reply', subject: 'Thank you for contacting Krishna Gurukul', payload: d, html: T.enquiryReply(d) });

export const sendDemoConfirm = (to: string, d: { name: string; batch: string; date: string }) =>
  sendMail({ to, template: 'demo-confirm', subject: 'Your free demo class is booked', payload: d, html: T.demoConfirm(d) });
