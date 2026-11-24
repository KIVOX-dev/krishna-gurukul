import { env } from '../config/env';

/** Branded, table-based HTML emails (work in Gmail, Outlook and phones). Colours match the app. */
const C = { navy: '#00457F', blue: '#2F8EE0', mist: '#EDF5FA', sun: '#FFA723', saffron: '#EC6206', ink: '#0B2238', mute: '#5b7186', line: '#dbe8f3', green: '#2BB88F', red: '#d64545' };
const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";
export const SCHOOL = {
  name: 'Krishna Gurukul', tagline: 'Where Tradition Meets Modern Excellence in Learning!',
  address: 'Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011', phone: '+91 82706 65953', tel: '+918270665953', email: 'krishnagurukul2022@gmail.com',
  maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Krishna Gurukul, Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011'),
};
const base = () => env.appUrl.replace(/\/$/, '');
const logoUrl = () => process.env.EMAIL_LOGO_URL || `${base()}/logo-mark.png`;
export const link = (path: string) => `${base()}${path}`;
const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* --------------------------------- blocks --------------------------------- */
export const p = (t: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:${C.ink}">${t}</p>`;
export const small = (t: string) => `<p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:${C.mute}">${t}</p>`;
export const h2 = (t: string) => `<h2 style="margin:22px 0 8px;font-size:18px;color:${C.navy};font-family:${FONT}">${t}</h2>`;

export const button = (label: string, url: string, color = C.saffron) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="border-radius:999px;background:${color}"><a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;color:#fff;text-decoration:none;font-family:${FONT}">${esc(label)} &rarr;</a></td></tr></table>`;

export const infoTable = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border:1px solid ${C.line};border-radius:12px;border-collapse:separate;overflow:hidden">${rows.filter(([, v]) => v !== '' && v != null).map(([k, v], i) => `<tr style="background:${i % 2 ? '#fff' : '#f6fafd'}"><td style="padding:11px 14px;font-size:13px;color:${C.mute};width:38%;border-bottom:1px solid ${C.line}">${esc(k)}</td><td style="padding:11px 14px;font-size:15px;font-weight:600;color:${C.ink};border-bottom:1px solid ${C.line}">${v}</td></tr>`).join('')}</table>`;

export const bigNumber = (value: string, label: string, color = C.navy) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td align="center" style="background:${C.mist};border-radius:16px;padding:22px 12px"><div style="font-size:46px;font-weight:800;line-height:1;color:${color};font-family:${FONT}">${value}</div><div style="margin-top:6px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.mute}">${esc(label)}</div></td></tr></table>`;

export const notice = (html: string, tone: 'info' | 'warn' | 'ok' = 'info') => {
  const t = { info: [C.mist, C.blue], warn: ['#FFF4E0', C.sun], ok: ['#E6F8F2', C.green] }[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td style="background:${t[0]};border-left:4px solid ${t[1]};border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.55;color:${C.ink}">${html}</td></tr></table>`;
};

export const stars = (n: number) => [1, 2, 3].map((k) => `<span style="font-size:26px;color:${k <= n ? C.sun : '#d9e2ec'}">&#9733;</span>`).join('');

export const steps = (items: string[]) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 14px">${items.map((t, i) => `<tr><td valign="top" style="padding:6px 12px 6px 0"><div style="width:26px;height:26px;border-radius:50%;background:${C.saffron};color:#fff;font-weight:800;font-size:14px;line-height:26px;text-align:center">${i + 1}</div></td><td style="padding:6px 0;font-size:15px;line-height:1.5;color:${C.ink}">${t}</td></tr>`).join('')}</table>`;

/* --------------------------------- layout --------------------------------- */
export function layout(o: { preheader: string; title: string; eyebrow?: string; body: string; cta?: { label: string; url: string }; footnote?: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.mist};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mist}"><tr><td align="center" style="padding:24px 12px">
 <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:22px;overflow:hidden;border:1px solid ${C.line}">
  <tr><td style="background:${C.navy};padding:22px 28px 0" align="left">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#fff;border-radius:14px;padding:8px 14px"><img src="${logoUrl()}" width="112" alt="${SCHOOL.name}" style="display:block;border:0;height:auto"></td></tr></table>
    <div style="height:22px"></div>
  </td></tr>
  <tr><td style="background:linear-gradient(90deg,${C.saffron},${C.sun});height:5px;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 30px 8px">
    ${o.eyebrow ? `<div style="font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${C.saffron};margin-bottom:6px">${esc(o.eyebrow)}</div>` : ''}
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:${C.navy};font-family:${FONT}">${o.title}</h1>
    ${o.body}
    ${o.cta ? button(o.cta.label, o.cta.url) : ''}
    ${o.footnote ? small(o.footnote) : ''}
  </td></tr>
  <tr><td style="background:${C.mist};padding:22px 30px;border-top:1px solid ${C.line}">
    <div style="font-size:15px;font-weight:800;color:${C.navy}">${SCHOOL.name}</div>
    <div style="font-size:13px;color:${C.mute};margin:2px 0 10px">${SCHOOL.tagline}</div>
    <div style="font-size:13px;line-height:1.7;color:${C.ink}">&#128205; <a href="${SCHOOL.maps}" style="color:${C.navy};text-decoration:none">${SCHOOL.address}</a><br>&#128222; <a href="tel:${SCHOOL.tel}" style="color:${C.navy};text-decoration:none">${SCHOOL.phone}</a> &nbsp;&middot;&nbsp; <a href="https://wa.me/${SCHOOL.tel.replace('+', '')}" style="color:${C.navy};text-decoration:none">WhatsApp</a><br>&#9993; <a href="mailto:${SCHOOL.email}" style="color:${C.navy};text-decoration:none">${SCHOOL.email}</a></div>
  </td></tr>
 </table>
 <div style="max-width:600px;padding:14px 8px;font-size:11px;color:${C.mute};text-align:center">You are receiving this because you are connected with ${SCHOOL.name}. Please do not reply to automated emails; call or WhatsApp us instead.</div>
</td></tr></table></body></html>`;
}

/* ------------------------------ the templates ------------------------------ */
const inr = (n: number) => '&#8377;' + Number(n).toLocaleString('en-IN');

export const T = {
  otp: (code: string, purpose: 'parent' | 'admin' = 'parent') => layout({
    preheader: `Your Krishna Gurukul code is ${code}. It expires in 10 minutes.`, eyebrow: 'Secure sign in', title: 'Your one-time login code',
    body: p(purpose === 'admin' ? 'We noticed a sign in from a new device. Enter this code to confirm it is you.' : 'Use this code to sign in to the Krishna Gurukul parent portal. No password needed.')
      + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td align="center" style="background:${C.mist};border:2px dashed ${C.blue};border-radius:16px;padding:22px"><div style="font-size:42px;font-weight:800;letter-spacing:12px;color:${C.saffron};font-family:'Courier New',monospace">${esc(code)}</div><div style="margin-top:6px;font-size:13px;color:${C.mute}">Valid for 10 minutes</div></td></tr></table>`
      + notice('<b>Keep it private.</b> Krishna Gurukul staff will never ask for this code. If you did not try to sign in, you can safely ignore this email.', 'warn'),
  }),

  feeReminder: (d: { student: string; amount: number; due: string; kind: string; period?: string; total?: number; paid?: number }) => {
    const overdue = d.kind === 'overdue';
    return layout({
      preheader: `${inr(d.amount).replace('&#8377;', 'Rs. ')} for ${d.student} is ${d.kind}.`, eyebrow: overdue ? 'Payment overdue' : 'Fee reminder', title: overdue ? `A fee for ${esc(d.student)} is overdue` : `A fee for ${esc(d.student)} is ${esc(d.kind)}`,
      body: p('Dear parent,') + p(overdue ? `This is a gentle reminder that the fee below is past its due date. Please clear it at your earliest convenience so ${esc(d.student)}'s classes continue without interruption.` : `This is a friendly reminder about an upcoming fee for ${esc(d.student)}.`)
        + bigNumber(inr(d.amount), 'Amount payable', overdue ? C.red : C.navy)
        + infoTable([['Student', esc(d.student)], ['Fee period', esc(d.period ?? '')], ['Total fee', d.total != null ? inr(d.total) : ''], ['Paid so far', d.paid ? inr(d.paid) : ''], ['Due date', esc(d.due)]])
        + h2('How to pay') + steps(['Pay by cash, UPI or bank transfer at the Gurukul office.', 'Quote your child\'s name and fee period.', 'You will receive a receipt by email straight away.'])
        + notice('Already paid? Thank you! Please ignore this reminder; it can take a few hours to update.', 'info'),
      cta: { label: 'View fee details', url: link('/parent/fees') },
    });
  },

  feeReceipt: (d: { student: string; amount: number; receiptNo: string; period?: string; mode?: string; balance?: number; date?: string; ref?: string }) => layout({
    preheader: `Payment of Rs. ${d.amount} received for ${d.student}. Receipt ${d.receiptNo}.`, eyebrow: 'Payment received', title: 'Thank you, we have received your payment',
    body: p(`Dear parent, we have received a payment for <b>${esc(d.student)}</b>. Your receipt details are below. A PDF copy is available in the parent portal.`)
      + bigNumber(inr(d.amount), 'Amount received', C.green)
      + infoTable([['Receipt no.', esc(d.receiptNo)], ['Student', esc(d.student)], ['Fee period', esc(d.period ?? '')], ['Payment mode', esc((d.mode ?? '').toUpperCase())], ['Reference', esc(d.ref ?? '')], ['Date', esc(d.date ?? new Date().toLocaleDateString('en-IN'))], ['Balance due', d.balance != null ? (d.balance > 0 ? inr(d.balance) : 'Nil. Fully paid') : '']])
      + (d.balance && d.balance > 0 ? notice(`A balance of <b>${inr(d.balance)}</b> remains for this period.`, 'warn') : notice('This invoice is now fully paid. Thank you!', 'ok')),
    cta: { label: 'Download receipt', url: link('/parent/fees') },
  }),

  testResult: (d: { student: string; title: string; score: number; stars: number; summary: string; correct?: number; wrong?: number; skipped?: number; seconds?: number; improvement?: number }) => layout({
    preheader: `${d.student} scored ${d.score}% in ${d.title}.`, eyebrow: 'Abacus test result', title: `${esc(d.student)} scored ${d.score}%`,
    body: p(`<b>${esc(d.student)}</b> has just completed <b>${esc(d.title)}</b>. The test was marked automatically and the full animated result is ready in the portal.`)
      + bigNumber(`${d.score}%`, 'Score', d.score >= 70 ? C.green : d.score >= 50 ? C.sun : C.saffron) + `<div style="text-align:center;margin:-6px 0 14px">${stars(d.stars)}</div>`
      + infoTable([['Correct answers', d.correct != null ? String(d.correct) : ''], ['Wrong answers', d.wrong != null ? String(d.wrong) : ''], ['Skipped', d.skipped ? String(d.skipped) : ''], ['Time taken', d.seconds != null ? `${Math.floor(d.seconds / 60)}m ${d.seconds % 60}s` : ''], ['Compared to last test', d.improvement ? `${d.improvement > 0 ? '&#9650; +' : '&#9660; '}${d.improvement}%` : '']])
      + h2('Teacher\'s feedback') + notice(esc(d.summary), 'ok')
      + small('Tip: a few short practice rounds each day help most. Children earn points and badges for practising.'),
    cta: { label: 'See the full result', url: link('/parent/tests') },
  }),

  absence: (d: { student: string; batch: string; date: string }) => layout({
    preheader: `${d.student} was marked absent today.`, eyebrow: 'Attendance alert', title: `${esc(d.student)} was marked absent`,
    body: p('Dear parent,') + p(`<b>${esc(d.student)}</b> was marked absent in today's class. If this is unexpected, please let us know so we can help.`)
      + infoTable([['Student', esc(d.student)], ['Class', esc(d.batch)], ['Date', esc(d.date)]])
      + notice('Planned leave? You can WhatsApp us before class next time so we can note it as leave. Missed lessons can be caught up with the practice section of the portal.', 'info'),
    cta: { label: 'View attendance', url: link('/parent/attendance') },
  }),

  welcome: (d: { name: string; student?: string; email?: string }) => layout({
    preheader: `Your Krishna Gurukul parent account is ready${d.student ? ` for ${d.student}` : ''}.`, eyebrow: 'Welcome', title: `Welcome to Krishna Gurukul, ${esc(d.name)}!`,
    body: p(`Your parent account is ready${d.student ? ` for <b>${esc(d.student)}</b>` : ''}. Here is how to get started:`)
      + steps(['Open the Krishna Gurukul parent login page.', `Enter your email${d.email ? ` (<b>${esc(d.email)}</b>)` : ''} and tap "Send me a code".`, 'Type the 6 digit code we email you. No password to remember.', 'See attendance, test results, fees, practice and the leaderboard.'])
      + notice('Your child can take tests and practise abacus from the same login, in the Tests and Practice tabs.', 'info'),
    cta: { label: 'Sign in to the portal', url: link('/login') },
  }),

  enquiryOffice: (d: any) => layout({
    preheader: `New ${d.type === 'demo' ? 'demo request' : 'enquiry'} from ${d.name} (${d.phone}).`, eyebrow: d.type === 'demo' ? 'New demo request' : 'New enquiry', title: `${esc(d.name)} has contacted us`,
    body: p('A new enquiry came in from the website. Please call within 24 hours.')
      + infoTable([['Parent', esc(d.name)], ['Phone', `<a href="tel:${esc(d.phone)}" style="color:${C.navy}">${esc(d.phone)}</a>`], ['Email', d.email ? esc(d.email) : ''], ['Child', [d.childName, d.childAge].filter(Boolean).map(esc).join(' &middot; ')], ['Courses', (d.courses ?? []).map(esc).join(', ')], ['Preferred time', esc(d.preferredTime ?? '')], ['Heard about us', esc(d.heardFrom ?? '')], ['Message', esc(d.message ?? '')]])
      + `<p style="margin:0 0 6px"><a href="https://wa.me/91${esc(d.phone)}" style="color:${C.green};font-weight:700">Chat on WhatsApp</a></p>`,
    cta: { label: 'Open in enquiries', url: link('/admin/enquiries') },
  }),

  enquiryReply: (d: { name: string }) => layout({
    preheader: 'Thank you for contacting Krishna Gurukul. We will call you within 24 hours.', eyebrow: 'Enquiry received', title: `Thank you, ${esc(d.name)}!`,
    body: p('We have received your enquiry and one of our team will call you <b>within 24 hours</b>.') + h2('What happens next') + steps(['We call to understand your child\'s age and interests.', 'We suggest the right course and batch timings.', 'Your child joins a free demo class, with no obligation.'])
      + h2('Visit us') + p(`${SCHOOL.address}<br><a href="${SCHOOL.maps}" style="color:${C.navy};font-weight:700">Open in Google Maps</a>`),
    cta: { label: 'Try the free abacus demo', url: link('/demo') },
  }),

  demoConfirm: (d: { name: string; batch: string; date: string }) => layout({
    preheader: `Your free demo class is booked for ${d.date}.`, eyebrow: 'Demo class confirmed', title: 'Your free demo class is booked',
    body: p(`Hi ${esc(d.name)}, we are looking forward to meeting your child.`) + infoTable([['Class', esc(d.batch)], ['Date', esc(d.date)], ['Venue', esc(SCHOOL.address)], ['Phone', SCHOOL.phone]])
      + h2('What to bring') + steps(['Your child, in comfortable clothes.', 'A notebook and pencil.', 'Please arrive 10 minutes early.'])
      + notice('Cannot make it? Call or WhatsApp us and we will happily reschedule.', 'info'),
    cta: { label: 'Get directions', url: SCHOOL.maps },
  }),
};
