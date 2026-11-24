import { useState } from 'react';
import { post, errMsg } from '../services/api';
import { Button, Field, Input, Textarea } from '../components/ui';
import { Mascot } from '../components/celebration/Mascot';
import { t } from '../i18n';

/** Public web page at /delete-account (linked from the Play Console data safety form). */
export default function DeleteAccountPage() {
  const [f, setF] = useState({ name: '', email: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await post('/public/delete-request', { ...f, reason: f.reason || undefined }); setDone(true); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <main className="mx-auto max-w-xl px-4 py-8 pb-16">
      <h1 className="font-display text-4xl font-extrabold text-navy">{t('delete.title')}</h1>
      <p className="mt-3 text-base">{t('delete.intro')}</p>
      <p className="mt-2 text-base text-ink/80">{t('delete.what')}</p>
      <p className="mt-2 text-base text-ink/80">{t('delete.when')} You can also do this inside the app: <b>Settings &gt; Delete my account</b>.</p>
      {done ? (
        <div className="mt-6 flex items-center gap-3 rounded-chunk bg-mint/15 p-4"><Mascot mood="thumbs" size={72} /><p className="font-bold text-emerald-900">{t('delete.thanks')}</p></div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('delete.name')}><Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
          <Field label={t('delete.email')}><Input required type="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
          <Field label={t('delete.reason')}><Textarea rows={3} maxLength={500} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
          {err && <p role="alert" className="text-sm font-bold text-red-700">{err}</p>}
          <Button type="submit" loading={busy} className="w-full">{t('delete.send')}</Button>
        </form>
      )}
    </main>
  );
}
