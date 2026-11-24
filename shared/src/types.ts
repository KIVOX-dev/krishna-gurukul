export type Role = 'admin' | 'faculty' | 'parent';
export type Operation = '+' | '-' | 'x' | '/' | 'mixed';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface TestSettings {
  timeLimit: number; // seconds, 0 = none
  questionCount: number;
  digits: number; // 1..5
  rows: number; // 2..15
  operations: Operation;
  level?: number;
}

/** Question as stored on the server (has answer). */
export interface Question {
  id: number;
  numbers: number[]; // signed terms for + / -, [a,b] for x and /
  op: Operation;
  answer: number;
}
/** Question as sent to the browser (no answer). */
export type PublicQuestion = Omit<Question, 'answer'>;

export interface AnswerGiven {
  q: number;
  given: number | null;
  timeMs: number;
}
export interface GradedAnswer extends AnswerGiven {
  correct: boolean;
  expected: number;
}
export interface GradeResult {
  score: number; // percent 0..100
  accuracy: number;
  correct: number;
  wrong: number;
  skipped: number;
  stars: 0 | 1 | 2 | 3;
  fastestMs: number;
  answers: GradedAnswer[];
}

export interface PointRules {
  testPerTenPercent: number;
  starBonus: number;
  beatLast: number;
  practiceSession: number;
  practiceDailyCap: number;
  dailyGoal: number;
  streak3: number;
  streak7: number;
  streak30: number;
  present: number;
}
export const DEFAULT_POINT_RULES: PointRules = {
  testPerTenPercent: 1,
  starBonus: 2,
  beatLast: 5,
  practiceSession: 2,
  practiceDailyCap: 10,
  dailyGoal: 3,
  streak3: 5,
  streak7: 10,
  streak30: 25,
  present: 1,
};
