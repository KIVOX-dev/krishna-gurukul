import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { post, errMsg } from '../../services/api';
import { useAuth, toast } from '../../store';
import { Button, Field, Input, cx } from '../../components/ui';

export const homeFor = (role: string) => (role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/parent');

/** One login page. Staff: password. Parents: email OTP. */
export default function Login() {
  const user = useAuth((s) => s.user); const nav = useNavigate();
  const [tab, setTab] = useState<'parent' | 'staff'>('parent');
  const [step, setStep] = useState<'start' | 'otp'>('start');
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [identifier, setId] = useState(''); const [password, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [adminOtp, setAdminOtp] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const done = (d: any) => { useAuth.getState().setSession(d.accessToken, d.user); nav(homeFor(d.user.role), { replace: true }); };
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); } };

  const sendParentOtp = () => run(async () => { await post('/auth/parent-otp', { email }); toast.ok('Code sent. Check your email.'); setStep('otp'); setAdminOtp(false); });
  const verify = () => run(async () => done(await post(adminOtp ? '/auth/admin-verify' : '/auth/parent-verify', { email, code })));
  const staffLogin = () => run(async () => {
    const d = await post('/auth/staff-login', { identifier, password });
    if (d.otpRequired) { setEmail(d.email); setAdminOtp(true); setStep('otp'); toast.info('New device: we emailed you a code.'); } else done(d);
  });

  return (
    <div className="doodles relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-sky-soft via-white to-cream p-4">
      <motion.div initial={{ opacity: 0, y: 40, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: 'spring', damping: 20 }} className="card relative z-10 w-full max-w-md p-7" style={{ perspective: 1000 }}>
        <Link to="/" className="mx-auto mb-3 block w-fit" aria-label="Krishna Gurukul home"><img src="/logo-mark.png" alt="Krishna Gurukul" width={497} height={279} className="h-24 w-auto" /></Link>
        <h1 className="text-center text-3xl font-extrabold text-navy">Welcome back!</h1>
        <p className="mb-5 text-center text-ink/60">One login for parents, faculty and admin</p>
        {step === 'start' && (
          <div className="mb-5 grid grid-cols-2 rounded-full bg-sky/10 p-1">
            {(['parent', 'staff'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cx('min-h-[44px] rounded-full font-display font-bold transition', tab === t ? 'bg-navy text-white shadow-soft' : 'text-navy')}>{t === 'parent' ? "I'm a parent" : 'Faculty / Admin'}</button>)}
          </div>
        )}
        {step === 'otp' ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
            <p className="text-center text-sm">Enter the 6 digit code sent to <b>{email}</b></p>
            <Input inputMode="numeric" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="text-center font-display text-3xl tracking-[0.4em]" aria-label="One-time code" />
            <Button type="submit" loading={busy} disabled={code.length !== 6} className="w-full">Verify and sign in</Button>
            <button type="button" className="mx-auto block min-h-[44px] text-sm font-bold text-sky" onClick={() => { setStep('start'); setCode(''); }}>Back</button>
          </form>
        ) : tab === 'parent' ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); sendParentOtp(); }}>
            <Field label="Your email" hint="We will email you a one-time code. No password needed."><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Button type="submit" loading={busy} className="w-full">Send me a code</Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); staffLogin(); }}>
            <Field label="Email" hint="Use the email address the institute registered for you."><Input type="email" inputMode="email" value={identifier} onChange={(e) => setId(e.target.value)} autoComplete="username" placeholder="you@example.com" required /></Field>
            <Field label="Password"><Input type="password" value={password} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></Field>
            <Button type="submit" loading={busy} className="w-full">Sign in</Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
