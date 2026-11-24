import { Router } from 'express';
import { z } from 'zod';
import { Cms, Course, Enquiry } from '../models';
import { parse, rateLimit, wrap, HttpError } from '../middleware';
import { sendEnquiryAutoReply, sendEnquiryOffice } from '../integrations/brevo';
import { askAi } from '../integrations/groqPool';
import { getSettings } from '../services/settings';

export const pub = Router();

pub.get('/courses', wrap(async (_req, res) => res.json(await Course.find({ isPublic: true }).select('-feeFrom -feeTo').sort({ createdAt: 1 }).lean())));
pub.get('/courses/:slug', wrap(async (req, res) => {
  const c = await Course.findOne({ slug: req.params.slug, isPublic: true }).select('-feeFrom -feeTo').lean();
  if (!c) throw new HttpError(404, 'Course not found');
  res.json(c);
}));
pub.get('/cms', wrap(async (_req, res) => {
  const rows: any[] = await Cms.find().lean();
  const out: Record<string, any> = {};
  for (const r of rows) (out[r.page] ??= {})[r.section] = { ...r.content, images: r.images };
  res.json(out);
}));

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10 digit Indian mobile number'),
  email: z.string().trim().email('Please enter a valid email address'),
  childName: z.string().max(80).optional(), childAge: z.string().max(20).optional(),
  courses: z.array(z.string()).max(8).default([]),
  preferredTime: z.enum(['morning', 'evening', 'weekend', '']).optional(),
  heardFrom: z.string().max(80).optional(), message: z.string().max(800).optional(),
  type: z.enum(['enquiry', 'demo']).default('enquiry'),
  website: z.string().max(0).optional(), // honeypot
});

pub.post('/enquiry', rateLimit('enquiry', 5, 600), wrap(async (req, res) => {
  const d = parse(enquirySchema, req.body);
  if (d.website) return res.json({ ok: true }); // bot: pretend success
  const { website, ...rest } = d;
  const e: any = await Enquiry.create({ ...rest, course: d.courses[0], source: rest.heardFrom || 'website' });
  sendEnquiryOffice(e.toObject()).catch(() => {});
  if (d.email) sendEnquiryAutoReply(d.email, { name: d.name }).catch(() => {});
  res.status(201).json({ ok: true });
}));

/** FAQ chatbot: answers only from admin-entered course and fee content. */
pub.post('/chat', rateLimit('chat', 15, 600), wrap(async (req, res) => {
  const { question } = parse(z.object({ question: z.string().trim().min(2).max(300) }), req.body);
  const st = await getSettings();
  const courses: any[] = await Course.find({ isPublic: true }).lean();
  const facts = courses.map((c) => `${c.name}: ${c.description ?? ''} Age ${c.ageGroup ?? '-'}. Duration ${c.duration ?? '-'}. Levels: ${(c.levels ?? []).join(', ')}`).join('\n');
  const info = `Krishna Gurukul, Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011. Phone +91 82706 65953. Email krishnagurukul2022@gmail.com.\n${facts}`;
  const fallback = 'Please call us on +91 82706 65953 or use the enquiry form and we will get back within 24 hours.';
  if (!st.ai.enabled || !st.ai.chatbot) return res.json({ answer: fallback, ai: false });
  const r = await askAi({
    system: `You are the friendly assistant for Krishna Gurukul. Answer ONLY from the facts below in under 60 words. If unknown, say so and suggest calling.\n\n${info}`,
    user: question, maxTokens: 160, fallback,
  });
  res.json({ answer: r.text, ai: r.fromAi });
}));
