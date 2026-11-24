import mongoose, { Schema, Types, model } from 'mongoose';
const models = mongoose.models;

const opts = { timestamps: true } as const;
const S = (def: Record<string, any>, o: Record<string, any> = {}): Schema => new Schema(def as any, o as any);
const oid = (ref: string) => ({ type: Schema.Types.ObjectId, ref });
const mk = (name: string, schema: Schema): any => models[name] || model(name, schema);

export const User = mk('User', S({
  name: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true, index: true, sparse: true },
  phone: { type: String, index: true, sparse: true },
  role: { type: String, enum: ['admin', 'faculty', 'parent'], required: true },
  passwordHash: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  trustedDevices: [String],
  subjects: [oid('Course')], // faculty: courses they can teach
  bio: String, photo: String, experience: String,
  hideChild: { type: Boolean, default: false },
  /** Push on/off per type + the daily practice reminder time (HH:mm) the parent picked. */
  prefs: {
    push: { type: Schema.Types.Mixed, default: {} },
    practiceReminder: { type: String, default: '' },
  },
}, opts));

export const Course = mk('Course', S({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  type: { type: String, enum: ['abacus', 'vedic', 'tuition', 'music'], default: 'abacus' },
  levels: [String], description: String, ageGroup: String, duration: String, icon: String,
  feeFrom: Number, feeTo: Number,
  isPublic: { type: Boolean, default: true },
}, opts));

export const Student = mk('Student', S({
  name: { type: String, required: true },
  photo: String, dob: Date,
  parentIds: [oid('User')],
  courseIds: [oid('Course')],
  batchIds: [oid('Batch')],
  abacusLevel: { type: Number, default: 1 },
  admissionNo: { type: String, unique: true, sparse: true },
  joinDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'alumni'], default: 'active' },
  avatar: { type: Number, default: 0 }, // mascot avatar index
  streak: { type: Number, default: 0 }, lastPracticeDay: String,
}, opts).index({ parentIds: 1 }));

export const Batch = mk('Batch', S({
  name: { type: String, required: true },
  courseId: oid('Course'), level: Number, facultyId: oid('User'),
  days: [String], startTime: String, endTime: String,
  mode: { type: String, enum: ['offline', 'online'], default: 'offline' },
  studentIds: [oid('Student')], capacity: { type: Number, default: 15 },
  leaderboardOff: { type: Boolean, default: false },
}, opts));

export const Attendance = mk('Attendance', S({
  batchId: oid('Batch'), date: { type: String, required: true }, // YYYY-MM-DD
  markedBy: oid('User'),
  records: [{ studentId: oid('Student'), status: { type: String, enum: ['present', 'absent', 'late', 'leave'] }, _id: false }],
}, opts).index({ batchId: 1, date: 1 }, { unique: true }));

export const FeePlan = mk('FeePlan', S({
  courseId: oid('Course'), name: String, amount: Number,
  cycle: { type: String, enum: ['monthly', 'quarterly', 'term', 'one-time'], default: 'monthly' },
  dueDay: { type: Number, default: 5 }, lateFee: { type: Number, default: 0 },
}, opts));

export const FeeInvoice = mk('FeeInvoice', S({
  studentId: oid('Student'), planId: oid('FeePlan'), period: String, amount: Number, discount: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 }, dueDate: Date,
  status: { type: String, enum: ['due', 'partial', 'paid', 'overdue'], default: 'due' },
  payments: [{ amount: Number, mode: { type: String, enum: ['cash', 'upi', 'bank'] }, ref: String, date: Date, receivedBy: oid('User'), receiptNo: String }],
  receiptUrl: String,
}, opts).index({ studentId: 1, period: 1 }));

export const Reminder = mk('Reminder', S({
  invoiceId: oid('FeeInvoice'), type: String, channel: { type: String, default: 'email' }, sentAt: Date, status: String,
}, opts));

const question = S({ id: Number, numbers: [Number], op: String, answer: Number }, { _id: false });
export const AbacusTest = mk('AbacusTest', S({
  title: String, level: Number, batchIds: [oid('Batch')], createdBy: oid('User'),
  type: { type: String, enum: ['assigned', 'live', 'practice-set'], default: 'assigned' },
  settings: { timeLimit: Number, questionCount: Number, digits: Number, rows: Number, operations: String },
  questions: [question], source: { type: String, default: 'engine' },
  publishAt: Date, closeAt: Date, resultsReleased: { type: Boolean, default: true },
}, opts));

export const TestAttempt = mk('TestAttempt', S({
  testId: oid('AbacusTest'), studentId: oid('Student'),
  startedAt: Date, deadline: Date,
  progress: [{ q: Number, given: Number, timeMs: Number, _id: false }],
  answers: [{ q: Number, given: Number, correct: Boolean, expected: Number, timeMs: Number, _id: false }],
  score: Number, accuracy: Number, stars: Number, correct: Number, wrong: Number, skipped: Number,
  durationMs: Number, fastestMs: Number, submittedAt: Date,
  gradedBy: { type: String, default: 'auto' }, remark: String, feedback: String,
  aiSummary: String, aiStatus: { type: String, enum: ['none', 'queued', 'done', 'fallback'], default: 'none' },
  improvement: Number, parentNotified: { type: Boolean, default: false },
}, opts).index({ testId: 1, studentId: 1 }, { unique: true }));

export const PracticeSession = mk('PracticeSession', S({
  studentId: oid('Student'), mode: { type: String, enum: ['flash', 'listen', 'visual', 'sheet'] }, level: Number,
  settings: Schema.Types.Mixed, score: Number, accuracy: Number, avgTimeMs: Number, day: String,
}, opts));

export const Cms = mk('Cms', S({
  page: String, section: String, content: Schema.Types.Mixed, images: [String], updatedBy: oid('User'),
}, opts).index({ page: 1, section: 1 }, { unique: true }));

export const Enquiry = mk('Enquiry', S({
  name: { type: String, required: true }, phone: String, email: String, message: String,
  childName: String, childAge: String, courses: [String], course: String,
  preferredTime: String, source: { type: String, default: 'website' }, heardFrom: String,
  type: { type: String, enum: ['enquiry', 'demo'], default: 'enquiry' },
  stage: { type: String, enum: ['New', 'Contacted', 'Demo booked', 'Demo attended', 'Joined', 'Not interested'], default: 'New' },
  assignedTo: oid('User'), followUpAt: Date, seen: { type: Boolean, default: false },
  notes: [{ by: String, text: String, at: { type: Date, default: Date.now } }],
  demo: { batchId: oid('Batch'), date: Date },
  convertedStudentId: oid('Student'),
}, opts));

export const Notification = mk('Notification', S({
  userId: oid('User'), channel: { type: String, default: 'email' }, template: String, to: String, subject: String,
  payload: Schema.Types.Mixed, status: String, error: String, read: { type: Boolean, default: false },
}, opts));

export const AuditLog = mk('AuditLog', S({
  userId: oid('User'), userName: String, action: String, entity: String, entityId: String, diff: Schema.Types.Mixed, at: { type: Date, default: Date.now },
}));

export const AiCache = mk('AiCache', S({
  hash: { type: String, unique: true }, response: String, model: String, createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 3600 },
}));
export const AiUsage = mk('AiUsage', S({
  day: String, keyIndex: Number, model: String, requests: { type: Number, default: 0 }, errors: { type: Number, default: 0 },
}).index({ day: 1, keyIndex: 1, model: 1 }, { unique: true }));

export const PointsLog = mk('PointsLog', S({
  studentId: oid('Student'), reason: String, points: Number, refId: String, at: { type: Date, default: Date.now },
}).index({ studentId: 1, at: -1 }));

export const LeaderboardSnapshot = mk('LeaderboardSnapshot', S({
  period: String, scope: String, level: Number, ranks: [{ studentId: oid('Student'), name: String, points: Number, rank: Number, _id: false }],
}, opts));

export const DeviceToken = mk('DeviceToken', S({
  userId: { ...oid('User'), index: true }, token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' }, lastSeen: { type: Date, default: Date.now },
}, opts));

export const DeletionRequest = mk('DeletionRequest', S({
  userId: oid('User'), name: String, email: String, phone: String, reason: String,
  source: { type: String, enum: ['app', 'web'], default: 'web' },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  completedAt: Date, completedBy: oid('User'),
}, opts));

export const Setting = mk('Setting', S({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, opts));
export const Otp = mk('Otp', S({
  email: String, codeHash: String, purpose: String, attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, expires: 0 },
}));
export const RateLimit = mk('RateLimit', S({ key: { type: String, unique: true }, count: Number, expiresAt: { type: Date, expires: 0 } }));

export { Types };
