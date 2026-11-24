import { env } from '../config/env';
import { DeviceToken } from '../models';

/** Firebase Cloud Messaging via firebase-admin. Mock mode (no FIREBASE_* keys): logs only. */
export const fcmEnabled = () => !!(env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey);

export interface PushPayload { title: string; body: string; /** in-app route opened on tap */ route?: string; type: string; data?: Record<string, string> }

let appPromise: Promise<any> | null = null;
async function messaging() {
  appPromise ??= import('firebase-admin').then((m) => {
    const admin = (m as any).default ?? m;
    const app = admin.apps?.length ? admin.app() : admin.initializeApp({
      credential: admin.credential.cert({ projectId: env.firebase.projectId, clientEmail: env.firebase.clientEmail, privateKey: env.firebase.privateKey }),
    });
    return app.messaging();
  });
  return appPromise;
}

/** Send to every device of a user. Dead tokens are removed. Never throws. */
export async function sendPush(userId: any, p: PushPayload) {
  try {
    const rows: any[] = await DeviceToken.find({ userId }).lean();
    if (!rows.length) return { sent: 0 };
    if (!fcmEnabled()) { console.log(`[fcm:mock] → ${rows.length} device(s) | ${p.title} — ${p.body} (${p.route ?? '/'})`); return { mock: true, sent: 0 }; }
    const m = await messaging();
    const res = await m.sendEachForMulticast({
      tokens: rows.map((r) => r.token),
      notification: { title: p.title, body: p.body },
      data: { type: p.type, route: p.route ?? '/', ...(p.data ?? {}) },
      android: { priority: 'high', notification: { channelId: 'kg-default', icon: 'ic_stat_kg', color: '#EC6206' } },
    });
    const dead: string[] = [];
    res.responses.forEach((r: any, i: number) => {
      const code = r.error?.code ?? '';
      if (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) dead.push(rows[i].token);
    });
    if (dead.length) await DeviceToken.deleteMany({ token: { $in: dead } });
    return { sent: res.successCount };
  } catch (e: any) { console.error('[fcm] failed', e.message); return { error: e.message }; }
}
