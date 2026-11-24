import { isNative, platform } from './platform';
import { api } from '../services/api';

const TOKEN_KEY = 'kg_push_token';
let navigateTo: ((route: string) => void) | null = null;
export const setPushNavigator = (fn: (route: string) => void) => { navigateTo = fn; };

const saved = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };

/** Whether the friendly explainer should be shown (not yet granted/denied). */
export async function pushPermissionState(): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> {
  if (!isNative()) return 'unsupported';
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const p = await PushNotifications.checkPermissions();
  return p.receive === 'granted' ? 'granted' : p.receive === 'denied' ? 'denied' : 'prompt';
}

/** Create the channel, register with FCM and send the device token to the server. Call after the mascot explainer. */
export async function enablePush(): Promise<boolean> {
  if (!isNative()) return false;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return false;
  await PushNotifications.createChannel({ id: 'kg-default', name: 'Krishna Gurukul', description: 'Tests, attendance, fees and ranks', importance: 4, visibility: 1 }).catch(() => {});
  await PushNotifications.removeAllListeners();
  await PushNotifications.addListener('registration', async (t) => {
    try { localStorage.setItem(TOKEN_KEY, t.value); } catch { /* ignore */ }
    await api.post('/devices', { token: t.value, platform: platform() }).catch(() => {});
  });
  await PushNotifications.addListener('registrationError', () => { /* google-services.json missing or Play services unavailable */ });
  // tapping a notification deep links to the right screen
  await PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
    const route = (a.notification.data as any)?.route;
    if (route && navigateTo) navigateTo(String(route));
  });
  await PushNotifications.register();
  return true;
}

/** Already granted on a previous launch: just re-register so the token stays fresh. */
export async function refreshPushIfGranted() { if (isNative() && (await pushPermissionState()) === 'granted') await enablePush(); }

/** Called on logout so the next user on a shared phone does not get this account's alerts. */
export async function disablePush() {
  const t = saved(); if (!t) return;
  await api.delete('/devices', { data: { token: t } }).catch(() => {});
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
