import fs from 'node:fs';
import path from 'node:path';
import { T } from '../integrations/emailTemplates';

// Writes every email to ../email-previews so you can open them in a browser.
const out = path.resolve(process.cwd(), '..', 'email-previews');
fs.mkdirSync(out, { recursive: true });
const logo = path.resolve(process.cwd(), '..', 'frontend/public/logo-mark.png');
const fix = (h: string) => h.replace(/src="[^"]*logo-mark\.png"/, `src="file:///${logo.split(String.fromCharCode(92)).join("/")}"`);
const mails: Record<string, string> = {
  '1-otp-parent': T.otp('482915'), '2-otp-admin': T.otp('730264', 'admin'),
  '3-fee-reminder': T.feeReminder({ student: 'Aarav Sharma', amount: 1000, due: '5 Dec 2026', kind: 'coming up', period: '2026-12', total: 1000, paid: 0 }),
  '4-fee-overdue': T.feeReminder({ student: 'Aarav Sharma', amount: 600, due: '5 Nov 2026', kind: 'overdue', period: '2026-11', total: 1050, paid: 450 }),
  '5-fee-receipt': T.feeReceipt({ student: 'Aarav Sharma', amount: 450, receiptNo: 'KG-00012-1', period: '2026-11', mode: 'upi', ref: 'UPI8271', balance: 600, date: '24 Nov 2026' }),
  '6-test-result': T.testResult({ student: 'Aarav Sharma', title: 'Level 3 Weekly Speed Test', score: 90, stars: 3, summary: 'You got all addition right, 1 subtraction slip. Great speed this week!', correct: 9, wrong: 1, skipped: 0, seconds: 214, improvement: 12 }),
  '7-absence': T.absence({ student: 'Aarav Sharma', batch: 'Abacus L3 Evening', date: '2026-11-24' }),
  '8-welcome': T.welcome({ name: 'Priya Sharma', student: 'Aarav Sharma', email: 'priya@example.com' }),
  '9-enquiry-office': T.enquiryOffice({ type: 'demo', name: 'Lakshmi Devi', phone: '9812345678', email: 'lakshmi@example.com', childName: 'Anika', childAge: '7', courses: ['Abacus', 'Vedic Maths'], preferredTime: 'evening', heardFrom: 'Instagram', message: 'Interested in a demo class this weekend.' }),
  '10-enquiry-reply': T.enquiryReply({ name: 'Lakshmi' }), '11-demo-confirm': T.demoConfirm({ name: 'Lakshmi', batch: 'Abacus L1 Weekend', date: 'Sat, 29 Nov 2026' }),
};
for (const [k, h] of Object.entries(mails)) fs.writeFileSync(path.join(out, `${k}.html`), fix(h));
fs.writeFileSync(path.join(out, 'index.html'), `<h1 style="font-family:sans-serif">Email previews</h1><ul style="font-family:sans-serif;line-height:2">${Object.keys(mails).map((k) => `<li><a href="${k}.html">${k}</a></li>`).join('')}</ul>`);
console.log('wrote', Object.keys(mails).length, 'previews to', out);
