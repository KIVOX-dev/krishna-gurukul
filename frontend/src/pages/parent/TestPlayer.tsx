import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Delete, WifiOff } from 'lucide-react';
import type { PublicQuestion } from '@kg/shared';
import { errMsg, post, put } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { useCountdown, useDevice, useOnline } from '../../hooks';
import { Button, EmptyState, Skeleton } from '../../components/ui';
import { QuestionCard } from '../../components/abacus';
import { toast } from '../../store';
import { sfx } from '../../utils/sound';

interface Ans { q: number; given: number | null; timeMs: number }
const qkey = (t: string) => `kg_pending_${t}`;

/** Full screen test player. Progress is saved on every answer; a dropped connection never loses work. */
export default function TestPlayer() {
  const { testId } = useParams(); const { id } = useKid(); const nav = useNavigate();
  const { isDesktop } = useDevice(); const online = useOnline();
  const [data, setData] = useState<any>(null); const [err, setErr] = useState<string>('');
  const [i, setI] = useState(0); const [val, setVal] = useState(''); const [busy, setBusy] = useState(false);
  const answers = useRef<Map<number, Ans>>(new Map()); const shownAt = useRef(Date.now()); const submitted = useRef(false);

  const started = useRef(false);
  useEffect(() => {
    if (!id || started.current) return; started.current = true;
    post(`/parent/children/${id}/tests/${testId}/start`).then((d) => {
      d.progress.forEach((p: Ans) => answers.current.set(p.q, p));
      const firstOpen = d.questions.findIndex((q: PublicQuestion) => !answers.current.has(q.id));
      setI(firstOpen === -1 ? 0 : firstOpen); setData(d); shownAt.current = Date.now();
    }).catch((e) => setErr(errMsg(e)));
  }, [id, testId]);

  // flush queued saves when back online
  const flush = async () => {
    if (!id || !testId) return; let list: Ans[] = []; try { list = JSON.parse(localStorage.getItem(qkey(testId)) ?? '[]'); } catch { /* ignore */ }
    const rest: Ans[] = [];
    for (const a of list) { try { await put(`/parent/children/${id}/tests/${testId}/progress`, a); } catch { rest.push(a); } }
    try { localStorage.setItem(qkey(testId), JSON.stringify(rest)); } catch { /* ignore */ }
  };
  useEffect(() => { if (online) flush(); /* eslint-disable-next-line */ }, [online, id]);

  async function save(a: Ans) {
    try { await put(`/parent/children/${id}/tests/${testId}/progress`, a); }
    catch { try { const l = JSON.parse(localStorage.getItem(qkey(testId!)) ?? '[]'); l.push(a); localStorage.setItem(qkey(testId!), JSON.stringify(l)); } catch { /* ignore */ } }
  }

  async function finish() {
    if (submitted.current) return; submitted.current = true; setBusy(true);
    try {
      await flush();
      const r = await post(`/parent/children/${id}/tests/${testId}/submit`, { answers: [...answers.current.values()] });
      try { localStorage.removeItem(qkey(testId!)); } catch { /* ignore */ }
      nav(`/parent/results/${r.attemptId}`, { replace: true, state: { fresh: true } });
    } catch (e) { submitted.current = false; setBusy(false); toast.err(errMsg(e)); }
  }

  const left = useCountdown(data?.remainingMs ?? null, () => { toast.info("Time's up! Submitting…"); finish(); });
  const total = data?.questions.length ?? 0; const q: PublicQuestion | undefined = data?.questions[i];

  function commit(skip = false) {
    if (!q) return;
    const a: Ans = { q: q.id, given: skip || val === '' || val === '-' ? null : Number(val), timeMs: Date.now() - shownAt.current };
    if (a.given !== null) { answers.current.set(q.id, a); save(a); sfx.tick(); } else answers.current.delete(q.id);
    setVal(''); shownAt.current = Date.now();
    if (i + 1 >= total) return finish(); setI(i + 1);
  }
  useEffect(() => {
    if (!isDesktop) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Enter') commit(); else if (/^\d$/.test(e.key)) setVal((v) => v + e.key); else if (e.key === 'Backspace') setVal((v) => v.slice(0, -1)); else if (e.key === '-') setVal((v) => (v ? v : '-')); };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  });

  if (err) return <div className="fixed inset-0 z-[100] grid place-items-center bg-cream p-4"><div className="max-w-md"><EmptyState mood="hug" title="Cannot start this test" hint={err} action={<Button onClick={() => nav('/parent/tests')}>Back</Button>} /></div></div>;
  if (!data || !q) return <div className="fixed inset-0 z-[100] bg-cream p-6"><Skeleton className="h-full" /></div>;
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-sky-soft to-cream">
      <header className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <p className="font-display text-lg font-bold text-navy">{i + 1} / {total}</p>
        {!online && <span className="chip bg-sun text-ink"><WifiOff size={14} className="mr-1" />Saving offline</span>}
        {data.remainingMs !== null && <p className={`font-display text-2xl font-extrabold ${left < 30000 ? 'text-saffron' : 'text-navy'}`}>⏱ {mm}:{String(ss).padStart(2, '0')}</p>}
      </header>
      <div className="mx-4 h-3 overflow-hidden rounded-full bg-white"><motion.div className="h-full grad-sun" animate={{ width: `${((i + 1) / total) * 100}%` }} /></div>
      <main className="grid flex-1 place-items-center overflow-y-auto p-4">
        <motion.div key={q.id} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card w-full max-w-lg p-6 text-center">
          <QuestionCard q={q} big />
          <div className="mx-auto mt-5 min-h-[64px] rounded-2xl border-4 border-sky/30 bg-white px-4 py-2 font-display text-5xl font-extrabold text-navy" aria-live="polite" aria-label="Your answer">{val || <span className="text-ink/20">?</span>}</div>
        </motion.div>
      </main>
      <footer className="safe-bottom bg-white p-3 shadow-[0_-8px_24px_-12px_rgba(0,69,127,.4)]">
        {!isDesktop && (
          <div className="mx-auto mb-3 grid max-w-md grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', 'del'].map((k) => <button key={k} onClick={() => (k === 'del' ? setVal((v) => v.slice(0, -1)) : setVal((v) => (k === '-' ? (v ? v : '-') : v + k)))} className="grid min-h-[56px] place-items-center rounded-2xl bg-sky/10 font-display text-3xl font-bold text-navy active:bg-sun">{k === 'del' ? <Delete /> : k}</button>)}
          </div>
        )}
        <div className="mx-auto flex max-w-md gap-2"><Button variant="ghost" onClick={() => commit(true)} disabled={busy}>Skip</Button><Button className="flex-1" loading={busy} onClick={() => commit()}>{i + 1 >= total ? 'Submit test' : 'Next'}</Button></div>
        {isDesktop && <p className="mt-1 text-center text-xs text-ink/50">Type your answer and press Enter</p>}
      </footer>
    </div>
  );
}
