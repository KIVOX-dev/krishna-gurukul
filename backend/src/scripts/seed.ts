import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generateQuestions, gradeAnswers, presetFor, presetToSettings, ruleFeedback } from '@kg/shared';
import { connectDb } from '../config/db';
import { AbacusTest, Attendance, Batch, Cms, Course, Enquiry, FeeInvoice, FeePlan, PointsLog, Student, TestAttempt, User } from '../models';
import { generateInvoices } from '../services/fees';

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function seed(demo: boolean) {
  const hash = (p: string) => bcrypt.hash(p, 10);
  await User.updateOne({ email: 'admin@krishnagurukul.in' }, { $setOnInsert: { name: 'Super Admin', email: 'admin@krishnagurukul.in', role: 'admin', passwordHash: await hash('Admin@123') } }, { upsert: true });

  const courseDefs = [
    { name: 'Abacus', slug: 'abacus', type: 'abacus', icon: 'abacus', ageGroup: '5 – 14 years', duration: '10 levels · ~3 months each', feeFrom: 800, feeTo: 1200, levels: Array.from({ length: 10 }, (_, i) => presetFor(i + 1).name), description: 'A levelled abacus programme that builds lightning-fast mental maths, concentration and confidence through bead-by-bead practice.' },
    { name: 'Vedic Maths', slug: 'vedic-maths', type: 'vedic', icon: 'vedic', ageGroup: '9 – 16 years', duration: '6 months', feeFrom: 900, feeTo: 1300, levels: ['Foundation', 'Intermediate', 'Advanced'], description: 'Ancient sutras for calculating faster than ever — squares, multiplication, divisibility and more.' },
    { name: 'Academic Tuition', slug: 'academic-tuition', type: 'tuition', icon: 'tuition', ageGroup: 'Class 1 – 10', duration: 'Academic year', feeFrom: 1000, feeTo: 2000, levels: ['Primary', 'Middle', 'Secondary'], description: 'Caring small-group tuition in school subjects with regular tests and personal attention.' },
    { name: 'Carnatic Music', slug: 'carnatic-music', type: 'music', icon: 'music', ageGroup: '6 years & above', duration: 'Ongoing grades', feeFrom: 800, feeTo: 1500, levels: ['Beginner', 'Grade 1', 'Grade 2', 'Grade 3'], description: 'Traditional Carnatic vocal training with Akila (8+ years of teaching) — sarali varisai to kritis.' },
  ];
  for (const c of courseDefs) await Course.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
  const courses: any[] = await Course.find().lean();
  const by = (slug: string) => courses.find((c) => c.slug === slug)!;
  for (const [slug, amount] of [['abacus', 1000], ['vedic-maths', 1100], ['academic-tuition', 1500], ['carnatic-music', 1000]] as const)
    if (!(await FeePlan.exists({ courseId: by(slug)._id }))) await FeePlan.create({ courseId: by(slug)._id, name: `${by(slug).name} monthly`, amount, cycle: 'monthly', dueDay: 5, lateFee: 50 });

  const cms = [
    ['home', 'hero', { title: 'Where Tradition Meets Modern Excellence in Learning!', subtitle: 'Abacus, Vedic Maths, Academic Tuition and Carnatic Music in Pattanam, Coimbatore.' }],
    ['home', 'pillars', { title: 'Our Pillars', items: [{ t: 'Tradition', d: 'Rooted in Indian gurukul values.' }, { t: 'Concentration', d: 'Focus built bead by bead.' }, { t: 'Confidence', d: 'Little learners who speak up.' }, { t: 'Creativity', d: 'Curiosity that keeps growing.' }] }],
    ['home', 'faculty', { title: 'The Mentors Behind Our Success', items: [{ name: 'Akila', role: 'Carnatic Music', note: '8+ years of teaching experience' }] }],
    ['home', 'testimonials', { items: [{ n: 'Priya S.', t: 'My son now solves sums faster than I can type them on a calculator!' }, { n: 'Rajesh K.', t: 'The teachers are patient and the weekly leaderboard keeps my daughter excited to practise.' }, { n: 'Meena R.', t: 'Akila madam is wonderful. Music class is my daughter’s favourite hour.' }] }],
    ['home', 'stats', { items: [{ n: 500, s: '+', l: 'Happy students' }, { n: 8, s: '+', l: 'Years of teaching' }, { n: 4, s: '', l: 'Programmes' }, { n: 10, s: '', l: 'Abacus levels' }] }],
  ] as const;
  for (const [page, section, content] of cms) await Cms.updateOne({ page, section }, { $setOnInsert: { content } }, { upsert: true });

  if (!demo) return;

  const akila: any = await User.findOneAndUpdate({ email: 'akila@krishnagurukul.in' }, { $setOnInsert: { name: 'Akila', email: 'akila@krishnagurukul.in', phone: '9000000001', role: 'faculty', passwordHash: await hash('Faculty@123'), subjects: [by('carnatic-music')._id, by('abacus')._id], experience: '8+ years' } }, { upsert: true, new: true });
  const ravi: any = await User.findOneAndUpdate({ email: 'ravi@krishnagurukul.in' }, { $setOnInsert: { name: 'Ravi Kumar', email: 'ravi@krishnagurukul.in', phone: '9000000002', role: 'faculty', passwordHash: await hash('Faculty@123'), subjects: [by('abacus')._id, by('vedic-maths')._id] } }, { upsert: true, new: true });
  const par: any = await User.findOneAndUpdate({ email: 'parent@example.com' }, { $setOnInsert: { name: 'Priya Sharma', email: 'parent@example.com', phone: '9876543210', role: 'parent' } }, { upsert: true, new: true });

  if (await Student.countDocuments()) return; // demo data already there
  const kids = [
    { name: 'Aarav Sharma', abacusLevel: 3, parentIds: [par._id] }, { name: 'Diya Sharma', abacusLevel: 3, parentIds: [par._id] },
    { name: 'Kavin Raj', abacusLevel: 3 }, { name: 'Meera Nair', abacusLevel: 5 }, { name: 'Rohan Iyer', abacusLevel: 5 },
  ];
  const students: any[] = [];
  for (const [i, k] of kids.entries()) students.push(await Student.create({ ...k, admissionNo: `KG26${String(i + 1).padStart(4, '0')}`, avatar: i, courseIds: [by('abacus')._id], streak: i === 0 ? 4 : 0 }));

  const b1: any = await Batch.create({ name: 'Abacus L3 · Evening', courseId: by('abacus')._id, level: 3, facultyId: ravi._id, days: ['Mon', 'Wed', 'Fri'], startTime: '17:00', endTime: '18:00', capacity: 12, studentIds: students.slice(0, 3).map((s) => s._id) });
  const b2: any = await Batch.create({ name: 'Abacus L5 · Weekend', courseId: by('abacus')._id, level: 5, facultyId: akila._id, days: ['Sat', 'Sun'], startTime: '10:00', endTime: '11:30', capacity: 10, studentIds: students.slice(3).map((s) => s._id) });
  await Student.updateMany({ _id: { $in: b1.studentIds } }, { batchIds: [b1._id] });
  await Student.updateMany({ _id: { $in: b2.studentIds } }, { batchIds: [b2._id] });

  // 2 weeks of attendance
  for (let d = 14; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400_000); const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    for (const b of [b1, b2]) {
      if (!b.days.includes(dow)) continue;
      const records = b.studentIds.map((sid: any, i: number) => ({ studentId: sid, status: (d + i) % 7 === 0 ? 'absent' : (d + i) % 9 === 0 ? 'late' : 'present' }));
      await Attendance.create({ batchId: b._id, date: ymd(date), markedBy: b.facultyId, records });
      for (const r of records) if (r.status !== 'absent') await PointsLog.create({ studentId: r.studentId, reason: 'Present in class', points: 1, refId: `${b._id}:${ymd(date)}`, at: date });
    }
  }

  await generateInvoices();
  const inv: any[] = await FeeInvoice.find().limit(2).lean();
  if (inv[0]) await FeeInvoice.updateOne({ _id: inv[0]._id }, { status: 'paid', payments: [{ amount: inv[0].amount, mode: 'upi', ref: 'DEMO123', date: new Date(), receiptNo: 'KG-DEMO-1' }] });
  await FeeInvoice.updateMany({ status: 'due' }, { dueDate: new Date(Date.now() - 6 * 86400_000), status: 'overdue' });

  // 2 abacus tests (one per batch) + a few auto-graded attempts so boards are alive
  for (const [b, lvl, title] of [[b1, 3, 'Level 3 · Weekly Speed Test'], [b2, 5, 'Level 5 · Multiplication Challenge']] as const) {
    const settings = presetToSettings(presetFor(lvl));
    const questions = generateQuestions(settings, lvl * 1337);
    const t: any = await AbacusTest.create({ title, level: lvl, batchIds: [b._id], createdBy: ravi._id, settings: { timeLimit: settings.timeLimit, questionCount: settings.questionCount, digits: settings.digits, rows: settings.rows, operations: settings.operations }, questions, closeAt: new Date(Date.now() + 14 * 86400_000) });
    if (lvl === 3) {
      for (const [i, sid] of (b.studentIds as any[]).slice(1).entries()) {
        const given = questions.map((q, n) => ({ q: q.id, given: (n + i) % (3 + i) === 0 ? q.answer + 1 : q.answer, timeMs: 6000 + n * 700 + i * 900 }));
        const g = gradeAnswers(questions, given);
        const att = await TestAttempt.create({ testId: t._id, studentId: sid, startedAt: new Date(Date.now() - 3600_000), submittedAt: new Date(Date.now() - 3500_000), answers: g.answers.map((a) => ({ ...a, given: a.given ?? undefined })), score: g.score, accuracy: g.accuracy, stars: g.stars, correct: g.correct, wrong: g.wrong, skipped: g.skipped, durationMs: 60000 + i * 20000, fastestMs: g.fastestMs, feedback: ruleFeedback(g, questions), aiSummary: ruleFeedback(g, questions), aiStatus: 'fallback' });
        await PointsLog.create({ studentId: sid, reason: 'Test submitted', points: Math.round(g.score / 10) + g.stars * 2, refId: String(att._id) });
      }
    }
  }
  await Enquiry.create([{ name: 'Lakshmi Devi', phone: '9812345678', email: 'lakshmi@example.com', childName: 'Anika', childAge: '7', courses: ['Abacus'], preferredTime: 'evening', source: 'Instagram', message: 'Interested in a demo class.' }, { name: 'Suresh Babu', phone: '9898989898', childName: 'Hari', childAge: 'Class 5', courses: ['Academic Tuition', 'Vedic Maths'], source: 'Friend', stage: 'Contacted', followUpAt: new Date() }]);

  // a few bonus points so the board has variety
  await PointsLog.create([{ studentId: students[0]._id, reason: 'Bonus: Competition winner', points: 10 }, { studentId: students[3]._id, reason: 'Bonus: Great behaviour', points: 6 }]);
  console.log('[seed] demo data created');
}

// CLI: npm run seed -- --demo
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seed.ts')) {
  (async () => {
    await connectDb();
    await seed(process.argv.includes('--demo'));
    console.log('[seed] done. Admin: admin@krishnagurukul.in / Admin@123' + (process.argv.includes('--demo') ? ' · Faculty: akila@krishnagurukul.in / Faculty@123 · Parent: parent@example.com (OTP printed in API console)' : ''));
    await mongoose.disconnect();
    process.exit(0);
  })().catch((e) => { console.error(e); process.exit(1); });
}
