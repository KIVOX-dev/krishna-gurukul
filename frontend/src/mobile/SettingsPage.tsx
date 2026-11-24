import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, put, errMsg } from '../services/api';
import { toast, useAuth } from '../store';
import { Button, Card } from '../components/ui';
import { BottomSheet } from './BottomSheet';
import { useTheme } from './theme';
import { biometricAvailable, biometricEnabled, setBiometricEnabled, biometricUnlock } from '../native/feel';
import { disablePush, enablePush, pushPermissionState } from '../native/push';
import { setPracticeReminder } from '../native/reminders';
import { isNative } from '../native/platform';
import { t } from '../i18n';

const VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

const Row = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div className="flex min-h-14 items-center justify-between gap-3 py-2">
    <div className="min-w-0"><p className="text-base font-bold text-navy">{title}</p>{hint && <p className="text-sm text-ink/60">{hint}</p>}</div>{children}
  </div>
);
const Switch = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-saffron' : 'bg-navy/20'}`}>
    <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : ''}`} />
  </button>
);

/** Parent/faculty/admin settings: notification types, practice reminder, dark mode, biometrics, sign out, delete account. */
export default function SettingsPage() {
  const nav = useNavigate();
  const user = useAuth((s) => s.user); const logout = useAuth((s) => s.logout);
  const theme = useTheme();
  const [push, setPush] = useState<Record<string, boolean>>({});
  const [reminder, setReminder] = useState('');
  const [bio, setBio] = useState(biometricEnabled());
  const [bioOk, setBioOk] = useState(false);
  const [del, setDel] = useState(false);
  const [delState, setDelState] = useState<string | null>(null);

  useEffect(() => {
    get('/devices/prefs').then((p) => { setPush(p.push); setReminder(p.practiceReminder); }).catch(() => {});
    get('/account/delete-request/mine').then((r) => setDelState(r?.status ?? null)).catch(() => {});
    biometricAvailable().then(setBioOk);
  }, []);

  const keys = (user?.role === 'admin' ? ['enquiry-assigned', 'fee'] : user?.role === 'faculty' ? ['absence'] : ['test-assigned', 'test-result', 'absence', 'fee', 'rank-up']);

  const toggle = async (k: string, v: boolean) => {
    setPush((p) => ({ ...p, [k]: v }));
    try { await put('/devices/prefs', { push: { [k]: v } }); if (v && isNative() && (await pushPermissionState()) !== 'granted') await enablePush(); } catch (e) { toast.err(errMsg(e)); setPush((p) => ({ ...p, [k]: !v })); }
  };
  const saveReminder = async (v: string) => {
    setReminder(v);
    try { await put('/devices/prefs', { practiceReminder: v }); if (!(await setPracticeReminder(v)) && v && isNative()) toast.info('Allow notifications in phone settings for reminders'); } catch (e) { toast.err(errMsg(e)); }
  };
  const toggleBio = async (v: boolean) => { if (v && !(await biometricUnlock('Turn on unlock'))) return; setBiometricEnabled(v); setBio(v); };
  const requestDelete = async () => { try { await post('/account/delete-request'); setDelState('pending'); setDel(false); toast.ok(t('settings.deleteSent')); } catch (e) { toast.err(errMsg(e)); } };
  const signOut = async () => { await disablePush(); logout(); nav('/login', { replace: true }); };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-extrabold text-navy">{t('settings.title')}</h1>

      <Card>
        <h2 className="font-display text-lg font-bold text-saffron">{t('settings.notifications')}</h2>
        <div className="divide-y divide-navy/10">
          {keys.map((k) => <Row key={k} title={t(`settings.push.${k}`)}><Switch on={push[k] !== false} onChange={(v) => void toggle(k, v)} label={t(`settings.push.${k}`)} /></Row>)}
          {user?.role === 'parent' && (
            <Row title={t('settings.reminder')} hint={t('settings.reminderHint')}>
              <div className="flex items-center gap-2">
                <input type="time" aria-label={t('settings.reminder')} value={reminder} onChange={(e) => void saveReminder(e.target.value)} className="input !w-32" />
                {reminder && <button className="min-h-12 px-2 text-sm font-bold text-navy underline" onClick={() => void saveReminder('')}>{t('settings.reminderOff')}</button>}
              </div>
            </Row>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold text-saffron">{t('settings.appearance')}</h2>
        <Row title={t('settings.dark')}><Switch on={theme.mode === 'dark' || (theme.mode === 'system' && theme.dark)} onChange={(v) => theme.setMode(v ? 'dark' : 'light')} label={t('settings.dark')} /></Row>
      </Card>

      {bioOk && (
        <Card>
          <h2 className="font-display text-lg font-bold text-saffron">{t('settings.security')}</h2>
          <Row title={t('settings.biometric')} hint={t('settings.biometricHint')}><Switch on={bio} onChange={(v) => void toggleBio(v)} label={t('settings.biometric')} /></Row>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-bold text-saffron">{t('settings.account')}</h2>
        <div className="space-y-3 pt-2">
          <Button variant="blue" className="w-full" onClick={() => void signOut()}>{t('settings.signOut')}</Button>
          {user?.role === 'parent' && (delState === 'pending'
            ? <p className="rounded-2xl bg-sun/20 p-3 text-sm font-bold text-amber-900">{t('settings.deletePending')}</p>
            : <button className="min-h-12 w-full rounded-full border-2 border-red-300 px-4 font-bold text-red-700 active:bg-red-50" onClick={() => setDel(true)}>{t('settings.deleteAccount')}</button>)}
        </div>
        <p className="mt-4 text-center text-xs text-ink/50">{t('settings.version', { v: VERSION })}</p>
      </Card>

      <BottomSheet open={del} onClose={() => setDel(false)} title={t('settings.deleteAccount')} footer={<div className="grid grid-cols-2 gap-3"><Button variant="ghost" onClick={() => setDel(false)}>{t('common.cancel')}</Button><Button onClick={() => void requestDelete()} className="!bg-red-600">{t('common.confirm')}</Button></div>}>
        <p className="text-base text-ink/80">{t('settings.deleteHint')}</p>
      </BottomSheet>
    </div>
  );
}
