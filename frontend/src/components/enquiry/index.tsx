import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { post, get, errMsg } from '../../services/api';
import { Button, Field, Input, Select, Textarea, cx } from '../ui';
import { Mascot, confettiBurst } from '../celebration';
import { toast } from '../../store';

/** Reused on Home, Contact, every course page (course preselected) and "Book a free demo" (type=demo). */
export function EnquiryForm({ course, type = 'enquiry', bare }: { course?: string; type?: 'enquiry' | 'demo'; compact?: boolean; /** no card chrome, for use inside an existing card */ bare?: boolean }) {
  const courses = useQuery({ queryKey: ['courses'], queryFn: () => get('/public/courses') });
  const [f, setF] = useState({ name: '', phone: '', email: '', childName: '', childAge: '', courses: course ? [course] : ([] as string[]), preferredTime: '', heardFrom: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = 'Enter a 10 digit mobile number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = 'Enter a valid email address';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { await post('/public/enquiry', { ...f, type }); setDone(true); confettiBurst(); }
    catch (x) { toast.err(errMsg(x)); } finally { setBusy(false); }
  }

  if (done) return (
    <div className={cx('flex flex-col items-center gap-2 p-6 text-center', !bare && 'rounded-2xl bg-white shadow-soft')}>
      <Mascot mood="wave" size={90} /><h3 className="text-2xl font-extrabold">Thank you!</h3>
      <p className="text-base opacity-80">We will call you within 24 hours.</p>
    </div>
  );

  const L = ({ t, children, wide }: { t: string; children: React.ReactNode; wide?: boolean }) => (
    <label className={cx('block', wide && 'sm:col-span-2')}><span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-current opacity-60">{t}</span>{children}</label>
  );
  const ic = '!min-h-11 !rounded-xl !border-[1.5px] !px-3 !py-2 !text-[15px]';

  return (
    <form onSubmit={submit} className={cx('space-y-3', !bare && 'rounded-2xl bg-white p-4 shadow-soft')} noValidate>
      {/* honeypot */}
      <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
      <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
        <L t="Parent name *"><Input className={ic} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Your name" />{errs.name && <p className="mt-1 text-xs font-bold text-red-600">{errs.name}</p>}</L>
        <L t="Phone *"><Input className={ic} inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} autoComplete="tel" placeholder="10 digit mobile" />{errs.phone && <p className="mt-1 text-xs font-bold text-red-600">{errs.phone}</p>}</L>
        <L t="Child name"><Input className={ic} value={f.childName} onChange={(e) => set('childName', e.target.value)} placeholder="Optional" /></L>
        <L t="Child age or class"><Input className={ic} value={f.childAge} onChange={(e) => set('childAge', e.target.value)} placeholder="e.g. 8 yrs / Class 3" /></L>
        <L t="Email *"><Input className={ic} type="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@example.com" />{errs.email && <p className="mt-1 text-xs font-bold text-red-600">{errs.email}</p>}</L>
        <L t="Preferred batch time"><Select className={ic} value={f.preferredTime} onChange={(e) => set('preferredTime', e.target.value)}><option value="">Any time</option><option value="morning">Morning</option><option value="evening">Evening</option><option value="weekend">Weekend</option></Select></L>
      </div>
      <div>
        <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-current opacity-60">Course interest</span>
        <div className="flex flex-wrap gap-1.5">{(courses.data ?? []).map((c: any) => { const on = f.courses.includes(c.name); return (
          <button type="button" key={c._id} aria-pressed={on} onClick={() => set('courses', on ? f.courses.filter((x) => x !== c.name) : [...f.courses, c.name])}
            className={cx('min-h-10 rounded-full border-[1.5px] px-3.5 text-sm font-bold transition active:scale-95', on ? 'border-rose bg-rose text-white' : 'border-peacock/25 bg-white text-peacock-deep hover:border-peacock')}>{c.name}</button>); })}</div>
      </div>
      <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
        <L t="How did you hear about us?"><Select className={ic} value={f.heardFrom} onChange={(e) => set('heardFrom', e.target.value)}><option value="">Select</option>{['Friend / family', 'Instagram', 'Facebook', 'Google', 'Banner / poster', 'School', 'Other'].map((x) => <option key={x}>{x}</option>)}</Select></L>
        <L t="Message"><Textarea rows={1} className={cx(ic, '!min-h-11 resize-none')} value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Anything we should know?" /></L>
      </div>
      <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose font-display text-base font-bold text-white shadow-[0_10px_22px_-12px_rgba(232,89,12,.9)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}{type === 'demo' ? 'Book my free demo class' : 'Send enquiry'}
      </button>
    </form>
  );
}

export const STAGES = ['New', 'Contacted', 'Demo booked', 'Demo attended', 'Joined', 'Not interested'] as const;

/** Desktop kanban (drag between stages). Mobile uses a filterable list in the page. */
export function EnquiryKanban({ rows, onMove, onOpen }: { rows: any[]; onMove: (id: string, stage: string) => void; onOpen: (e: any) => void }) {
  const [drag, setDrag] = useState<string | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {STAGES.map((s) => (
        <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) onMove(drag, s); setDrag(null); }} className="min-w-[210px] flex-1 shrink-0 rounded-chunk bg-sky/10 p-3">
          <p className="mb-2 flex justify-between font-display text-lg font-bold text-navy">{s}<span className="chip bg-white">{rows.filter((r) => r.stage === s).length}</span></p>
          <div className="min-h-[120px] space-y-2">
            <AnimatePresence>{rows.filter((r) => r.stage === s).map((r) => (
              <motion.div layout key={r._id} draggable onDragStart={() => setDrag(r._id)} onClick={() => onOpen(r)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cursor-grab rounded-2xl bg-white p-3 shadow-soft active:cursor-grabbing">
                <p className="font-bold text-navy">{r.name}{r.type === 'demo' && <span className="chip ml-2 bg-sun/30 text-amber-800">Demo</span>}</p>
                <p className="text-xs text-ink/60">{r.childName ? `${r.childName} · ` : ''}{(r.courses ?? []).join(', ')}</p>
                {r.followUpAt && <p className={cx('mt-1 text-xs font-bold', new Date(r.followUpAt) < new Date() ? 'text-red-600' : 'text-sky')}>Follow up {new Date(r.followUpAt).toLocaleDateString('en-IN')}</p>}
              </motion.div>
            ))}</AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
