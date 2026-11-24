import { Router } from 'express';
import { cronAuth, wrap } from '../middleware';
import { generateInvoices, refreshFeeStatus, runReminderRules } from '../services/fees';
import { processAiQueue } from '../services/aiQueue';
import { snapshotWeekly } from '../services/points';

/** Secret protected. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export const cron = Router();
cron.use(cronAuth);
cron.get('/fee-reminders', wrap(async (_req, res) => { await generateInvoices(); await refreshFeeStatus(); res.json(await runReminderRules()); }));
cron.get('/refresh-fee-status', wrap(async (_req, res) => res.json(await refreshFeeStatus())));
cron.get('/ai-summary-sweep', wrap(async (_req, res) => res.json(await processAiQueue(8))));
cron.get('/leaderboard-weekly', wrap(async (_req, res) => res.json(await snapshotWeekly())));
