import type {
  AnswerGiven, GradeResult, GradedAnswer, Operation, PublicQuestion, Question, TestSettings,
} from './types';

/** Deterministic RNG so a test's questions can be regenerated from its seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LevelPreset {
  level: number; name: string; digits: number; rows: number; operations: Operation;
  smallFriendsOnly?: boolean; noNegative: boolean; timeLimit: number; questionCount: number;
}

/** Ten abacus levels, rules grow with each level. */
export const LEVEL_PRESETS: LevelPreset[] = [
  { level: 1, name: 'Level 1 · Small Friends', digits: 1, rows: 3, operations: '+', smallFriendsOnly: true, noNegative: true, timeLimit: 300, questionCount: 10 },
  { level: 2, name: 'Level 2 · Big Friends', digits: 1, rows: 4, operations: 'mixed', noNegative: true, timeLimit: 300, questionCount: 10 },
  { level: 3, name: 'Level 3 · Two Digits', digits: 2, rows: 4, operations: 'mixed', noNegative: true, timeLimit: 360, questionCount: 10 },
  { level: 4, name: 'Level 4 · Speed Rows', digits: 2, rows: 6, operations: 'mixed', noNegative: true, timeLimit: 360, questionCount: 12 },
  { level: 5, name: 'Level 5 · Multiplication', digits: 2, rows: 2, operations: 'x', noNegative: true, timeLimit: 420, questionCount: 12 },
  { level: 6, name: 'Level 6 · Division', digits: 3, rows: 2, operations: '/', noNegative: true, timeLimit: 420, questionCount: 12 },
  { level: 7, name: 'Level 7 · Three Digits', digits: 3, rows: 6, operations: 'mixed', noNegative: true, timeLimit: 480, questionCount: 15 },
  { level: 8, name: 'Level 8 · Mental Master', digits: 3, rows: 10, operations: 'mixed', noNegative: false, timeLimit: 540, questionCount: 15 },
  { level: 9, name: 'Level 9 · Grand Master', digits: 4, rows: 10, operations: 'mixed', noNegative: false, timeLimit: 600, questionCount: 15 },
  { level: 10, name: 'Level 10 · Champion', digits: 5, rows: 15, operations: 'mixed', noNegative: false, timeLimit: 720, questionCount: 20 },
];

export const presetFor = (level: number) =>
  LEVEL_PRESETS[Math.min(Math.max(level, 1), LEVEL_PRESETS.length) - 1];

export const presetToSettings = (p: LevelPreset): TestSettings => ({
  timeLimit: p.timeLimit, questionCount: p.questionCount, digits: p.digits, rows: p.rows,
  operations: p.operations, level: p.level,
});

const clampInt = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(n)));

function randTerm(rnd: () => number, digits: number, small: boolean): number {
  if (small) return 1 + Math.floor(rnd() * 4); // 1..4 only (small friends)
  const lo = digits === 1 ? 1 : 10 ** (digits - 1);
  const hi = 10 ** digits - 1;
  return lo + Math.floor(rnd() * (hi - lo + 1));
}

export function generateQuestion(id: number, s: TestSettings, rnd: () => number): Question {
  const digits = clampInt(s.digits, 1, 5);
  const rows = clampInt(s.rows, 2, 15);
  const preset = s.level ? presetFor(s.level) : undefined;
  const small = !!preset?.smallFriendsOnly;
  const noNeg = preset ? preset.noNegative : true;
  if (s.operations === 'x') {
    const a = randTerm(rnd, digits, false);
    const b = 2 + Math.floor(rnd() * 8);
    return { id, numbers: [a, b], op: 'x', answer: a * b };
  }
  if (s.operations === '/') {
    const b = 2 + Math.floor(rnd() * 8);
    const q = randTerm(rnd, Math.max(1, digits - 1), false);
    return { id, numbers: [b * q, b], op: '/', answer: q };
  }
  const allowSub = s.operations === '-' || s.operations === 'mixed';
  const allowAdd = s.operations === '+' || s.operations === 'mixed';
  const nums: number[] = [];
  let total = 0;
  for (let i = 0; i < rows; i++) {
    const v = randTerm(rnd, digits, small);
    let sub = false;
    if (i > 0 && allowSub && (!allowAdd || rnd() < 0.42)) sub = true;
    if (sub && noNeg && total - v < 0) sub = false;
    const term = sub ? -v : v;
    nums.push(term);
    total += term;
  }
  return { id, numbers: nums, op: s.operations, answer: total };
}

export function generateQuestions(s: TestSettings, seed = Date.now()): Question[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: clampInt(s.questionCount, 1, 100) }, (_, i) => generateQuestion(i + 1, s, rnd));
}

/** Rebuild answers in code from numbers only (used for AI-supplied question sets). */
export function recomputeAnswer(numbers: number[], op: Operation): number {
  if (op === 'x') return numbers[0] * numbers[1];
  if (op === '/') return Math.round(numbers[0] / numbers[1]);
  return numbers.reduce((a, b) => a + b, 0);
}

export const toPublic = (q: Question): PublicQuestion => ({ id: q.id, numbers: q.numbers, op: q.op });

export function formatQuestion(q: PublicQuestion): string {
  if (q.op === 'x') return `${q.numbers[0]} × ${q.numbers[1]}`;
  if (q.op === '/') return `${q.numbers[0]} ÷ ${q.numbers[1]}`;
  return q.numbers.map((n, i) => (i === 0 ? `${n}` : n < 0 ? `− ${-n}` : `+ ${n}`)).join(' ');
}

export const starsFor = (accuracy: number): 0 | 1 | 2 | 3 =>
  accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;

/** Server-side grading. Never run in the browser with real answers. */
export function gradeAnswers(questions: Question[], given: AnswerGiven[]): GradeResult {
  const byQ = new Map(given.map((g) => [g.q, g]));
  let correct = 0, wrong = 0, skipped = 0, fastest = Infinity;
  const answers: GradedAnswer[] = questions.map((q) => {
    const g = byQ.get(q.id);
    const has = g && g.given !== null && g.given !== undefined && !Number.isNaN(g.given);
    if (!has) { skipped++; return { q: q.id, given: null, timeMs: g?.timeMs ?? 0, correct: false, expected: q.answer }; }
    const ok = Number(g!.given) === q.answer;
    if (ok) { correct++; fastest = Math.min(fastest, g!.timeMs || Infinity); } else wrong++;
    return { q: q.id, given: Number(g!.given), timeMs: g!.timeMs, correct: ok, expected: q.answer };
  });
  const total = questions.length || 1;
  const score = Math.round((correct / total) * 100);
  return { score, accuracy: score, correct, wrong, skipped, stars: starsFor(score), fastestMs: Number.isFinite(fastest) ? fastest : 0, answers };
}

const kindOf = (q: Question) =>
  q.op === 'x' ? 'multiplication' : q.op === '/' ? 'division' : q.numbers.some((n) => n < 0) ? 'subtraction' : 'addition';

/** Rule-based feedback shown instantly, no AI needed. */
export function ruleFeedback(g: GradeResult, questions: Question[]): string {
  const stat: Record<string, { ok: number; bad: number }> = {};
  g.answers.forEach((a, i) => {
    const kind = kindOf(questions[i]);
    stat[kind] ??= { ok: 0, bad: 0 };
    if (a.correct) stat[kind].ok++; else stat[kind].bad++;
  });
  const perfect = Object.entries(stat).filter(([, v]) => v.bad === 0 && v.ok > 0).map(([k]) => k);
  const slips = Object.entries(stat).filter(([, v]) => v.bad > 0).map(([k, v]) => `${v.bad} ${k} slip${v.bad > 1 ? 's' : ''}`);
  const parts: string[] = [];
  if (perfect.length) parts.push(`You got all ${perfect.join(' and ')} right`);
  if (slips.length) parts.push(slips.join(', '));
  if (g.skipped) parts.push(`${g.skipped} unanswered`);
  return parts.join(', ') + '.';
}

/* ------------------------------ virtual abacus ------------------------------ */
export interface BeadState { heaven: 0 | 1; earth: number }
export const digitToBeads = (d: number): BeadState => ({ heaven: d >= 5 ? 1 : 0, earth: d % 5 });
export const beadsToDigit = (b: BeadState) => b.heaven * 5 + b.earth;

export function numberToRods(n: number, rods = 7): BeadState[] {
  const s = String(Math.max(0, Math.abs(Math.trunc(n)))).padStart(rods, '0').slice(-rods);
  return [...s].map((c) => digitToBeads(Number(c)));
}
export const rodsToNumber = (rods: BeadState[]) => rods.reduce((a, r) => a * 10 + beadsToDigit(r), 0);

export interface AbacusStep { label: string; term: number; before: number; after: number; rods: BeadState[] }
/** Step by step method for "See how": apply each term to the abacus. */
export function abacusSteps(q: PublicQuestion, rods = 7): AbacusStep[] {
  if (q.op === 'x' || q.op === '/') {
    const ans = q.op === 'x' ? q.numbers[0] * q.numbers[1] : q.numbers[0] / q.numbers[1];
    return [{ label: `${formatQuestion(q)} = ${ans}`, term: ans, before: 0, after: ans, rods: numberToRods(ans, rods) }];
  }
  const steps: AbacusStep[] = [];
  let total = 0;
  for (const t of q.numbers) {
    const before = total;
    total += t;
    steps.push({ label: t >= 0 ? `Add ${t}` : `Subtract ${-t}`, term: t, before, after: total, rods: numberToRods(total, rods) });
  }
  return steps;
}

/** Practice-my-mistakes: build a question set from wrong answers. */
export function mistakesToQuestions(qs: Question[], wrongIds: number[]): Question[] {
  return qs.filter((q) => wrongIds.includes(q.id)).map((q, i) => ({ ...q, id: i + 1 }));
}
