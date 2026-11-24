import { isNative } from './platform';

const ID = 4201;

/** Daily practice reminder at the time the parent picks ("HH:mm"). Empty string cancels. Local notification, works offline. */
export async function setPracticeReminder(hhmm: string, childName?: string): Promise<boolean> {
  if (!isNative()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: ID }] }).catch(() => {});
  if (!hhmm) return true;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  const [h, m] = hhmm.split(':').map(Number);
  await LocalNotifications.createChannel({ id: 'kg-practice', name: 'Practice reminder', importance: 3 }).catch(() => {});
  await LocalNotifications.schedule({
    notifications: [{
      id: ID, channelId: 'kg-practice', title: 'Time to practise! 🧮', body: `${childName ?? 'Your child'}'s abacus practice is waiting.`,
      schedule: { on: { hour: h, minute: m }, allowWhileIdle: true }, extra: { route: '/parent/practice' },
    }],
  });
  return true;
}
