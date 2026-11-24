import { DEFAULT_POINT_RULES, type PointRules } from '@kg/shared';
import { Setting } from '../models';

export interface ReminderRules { beforeDays: number; onDue: boolean; overdueEvery: number; overdueMax: number }
export interface AppSettings {
  pointRules: PointRules;
  reminderRules: ReminderRules;
  receiptPrefix: string;
  ai: { enabled: boolean; summaries: boolean; chatbot: boolean; questions: boolean; monthlyComments: boolean };
  leaderboard: { enabled: boolean; nameMode: 'full' | 'firstInitial' };
  logoUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  pointRules: DEFAULT_POINT_RULES,
  reminderRules: { beforeDays: 3, onDue: true, overdueEvery: 5, overdueMax: 4 },
  receiptPrefix: 'KG',
  ai: { enabled: true, summaries: true, chatbot: true, questions: true, monthlyComments: true },
  leaderboard: { enabled: true, nameMode: 'full' },
  logoUrl: '/logo.png',
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await Setting.find().lean();
  const out: any = structuredClone(DEFAULT_SETTINGS);
  for (const r of rows as any[]) out[r.key] = typeof r.value === 'object' && !Array.isArray(r.value) ? { ...out[r.key], ...r.value } : r.value;
  return out;
}

export async function saveSettings(patch: Partial<AppSettings>) {
  for (const [key, value] of Object.entries(patch)) await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
  return getSettings();
}
