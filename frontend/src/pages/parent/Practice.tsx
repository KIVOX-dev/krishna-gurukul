import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PracticeHistory } from '../../components/PracticeHistory';
import { Badge } from '../../components/icons';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, FileText, Flame, Headphones, History, Target, Zap } from 'lucide-react';
import { LEVEL_PRESETS, generateQuestions, presetFor, presetToSettings, toPublic, type Question } from '@kg/shared';
import { get, post } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { Button, Card, Field, Modal, Select } from '../../components/ui';
import { FlashCard, QuestionCard, VirtualAbacus } from '../../components/abacus';
import { ScoreRing, confettiBurst, Mascot } from '../../components/celebration';
import { sfx } from '../../utils/sound';
import { toast } from '../../store';

type Mode = 'flash' | 'listen' | 'visual' | 'sheet';
const MODES: { m: Mode | 'abacus'; label: string; emoji: ReactNode; hint: string }[] = [
  { m: 'flash', label: 'Flash', emoji: <Zap size={34} className="text-saffron" />, hint: 'Numbers flash one by one' }, { m: 'listen', label: 'Listening', emoji: <Headphones size={34} className="text-sky" />, hint: 'Numbers are read aloud' },
  { m: 'visual', label: 'Visual sheet', emoji: <FileText size={34} className="text-mint" />, hint: 'All rows at once' }, { m: 'abacus', label: 'Virtual abacus', emoji: <Calculator size={34} className="text-navy" />, hint: 'Move the beads' },
];
const QUEUE = 'kg_practice_queue';

/** Same engine as tests. Works offline: results queue locally and sync when back online. */
export default function Practice() {
  const { id, kid } = useKid(); const loc = useLocation(); const qc = useQueryClient();
  const mistakes: Question[] | undefined = (loc.state as any)?.mistakes;
  const stats = useQuery({ queryKey: ['practice', id], queryFn: () => get(`/parent/children/${id}/practice`), enabled: !!id });
  const [mode, setMode] = useState<Mode | 'abacus' | null>(null); const [level, setLevel] = useState<number>(kid?.abacusLevel ?? 1); const [speed, setSpeed] = useState(1200);
  const [qs, setQs] = useState<Question[]>([]); const [i, setI] = useState(0); const [val, setVal] = useState(''); const [ready, setReady] = useState(false);
  const [right, setRight] = useState(0); const [times, setTimes] = useState<number[]>([]); const [done, setDone] = useState<null | { score: number; gained: any[] }>(null); const [abv, setAbv] = useState(0);
  const t0 = useRef(Date.now()); const [showHist, setShowHist] = useState(false);
  useEffect(() => { if (kid?.abacusLevel) setLevel(kid.abacusLevel); }, [kid?.abacusLevel]);
  useEffect(() => { const sync = async () => { try { const l = JSON.parse(localStorage.getItem(QUEUE) ?? '[]'); const rest = []; for (const x of l) { try { await post(`/parent/children/${x.id}/practice`, x.body); } catch { rest.push(x); } } localStorage.setItem(QUEUE, JSON.stringify(rest)); } catch { /* ignore */ } }; sync(); window.addEventListener('online', sync); return () => window.removeEventListener('online', sync); }, []);
  useEffect(() => { if (mistakes?.length) start('visual', mistakes); /* eslint-disable-next-line */ }, []);

  function start(m: Mode | 'abacus', preset?: Question[]) {
    setMode(m); setQs(preset ?? generateQuestions({ ...presetToSettings(presetFor(level)), questionCount: 8 }, Date.now())); setI(0); setRight(0); setTimes([]); setVal(''); setDone(null); setReady(m === 'visual' || m === 'abacus'); t0.current = Date.now();
  }
  async function finish(correct: number, ts: number[]) {
    const score = Math.round((correct / qs.length) * 100); const body = { mode: mode === 'abacus' ? 'visual' : mode!, level, score, accuracy: score, avgTimeMs: ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : 0 };
    let gained: any[] = [];
    try { const r = await post(`/parent/children/${id}/practice`, body); gained = r.gained; qc.invalidateQueries({ queryKey: ['practice', id] }); }
    catch { try { const l = JSON.parse(localStorage.getItem(QUEUE) ?? '[]'); l.push({ id, body }); localStorage.setItem(QUEUE, JSON.stringify(l)); toast.info('Saved offline. It will sync later.'); } catch { /* ignore */ } }
    setDone({ score, gained }); if (score >= 70) { confettiBurst(); sfx.fanfare(); }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault(); const q = qs[i]; const ok = Number(val) === q.answer; const dt = Date.now() - t0.current; const ts = [...times, dt]; setTimes(ts);
    ok ? sfx.ding() : sfx.oops(); const r = right + (ok ? 1 : 0); setRight(r); setVal(''); t0.current = Date.now();
    if (!ok) toast.info(`Answer was ${q.answer}`);
    if (i + 1 >= qs.length) finish(r, ts); else { setI(i + 1); setReady(mode === 'visual' || mode === 'abacus'); }
  }

  const trend = (stats.data?.sessions ?? []).map((s: any, n: number) => ({ n: n + 1, accuracy: Math.round(s.accuracy), speed: Math.round((s.avgTimeMs ?? 0) / 1000) }));
  if (done) return (
    <div className="mx-auto max-w-md space-y-4 text-center"><Card className="flex flex-col items-center"><Mascot mood={done.score >= 70 ? 'cheer' : 'hug'} size={100} /><ScoreRing score={done.score} size={160} /><p className="mt-2 font-display text-2xl font-bold text-navy">{done.score >= 70 ? 'Great practice!' : 'Keep going!'}</p>{done.gained.map((g) => <p key={g.reason} className="chip mt-1 bg-sun/30 text-amber-800">+{g.points} {g.reason}</p>)}</Card><Button onClick={() => start(mode!)} className="w-full">Practise again</Button><Button variant="ghost" onClick={() => { setMode(null); setDone(null); }} className="w-full">Back</Button></div>
  );
  if (mode && qs[i]) {
    const q = qs[i];
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center"><div className="flex items-center justify-between font-display font-bold text-navy"><span>Question {i + 1}/{qs.length}</span><button className="min-h-[44px] text-sm text-sky" onClick={() => setMode(null)}>Quit</button></div>
        <Card>{mode === 'flash' || mode === 'listen' ? (ready ? <QuestionCard q={toPublic({ ...q, numbers: ['x', '/'].includes(q.op) ? q.numbers : [] })} /> : null) : null}
          {(mode === 'flash' || mode === 'listen') && !ready && <FlashCard key={i} q={toPublic(q)} speedMs={speed} listen={mode === 'listen'} onDone={() => setReady(true)} />}
          {(mode === 'flash' || mode === 'listen') && ready && <p className="py-6 font-display text-3xl font-bold text-mint">What is the total?</p>}
          {(mode === 'visual' || mode === 'abacus') && <QuestionCard q={toPublic(q)} big />}
          {mode === 'abacus' && <div className="mt-4 flex justify-center"><VirtualAbacus rods={5} onChange={(n) => { setAbv(n); setVal(String(n)); }} compact /></div>}
          {mode === 'abacus' && <p className="sr-only">{abv}</p>}</Card>
        {ready && <form onSubmit={submit} className="flex gap-2"><input autoFocus value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d-]/g, ''))} inputMode="numeric" className="input text-center font-display text-3xl" aria-label="Your answer" /><Button type="submit" className="shrink-0 whitespace-nowrap">Check</Button></form>}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-navy">Practise abacus</h1><Button variant="ghost" onClick={() => setShowHist(true)}><History size={18} />Practice history</Button></div>
      <div className="grid grid-cols-2 gap-3"><Card className="flex items-center gap-3"><Flame className="text-saffron" /><div><p className="font-display text-2xl font-extrabold text-navy">{stats.data?.streak ?? 0}</p><p className="text-xs text-ink/60">day streak</p></div></Card><Card className="flex items-center gap-3"><Target className="text-sky" /><div className="flex-1"><p className="font-display text-2xl font-extrabold text-navy">{Math.min(stats.data?.todayCount ?? 0, 3)}/3</p><p className="text-xs text-ink/60">daily goal</p><div className="mt-1 h-2 overflow-hidden rounded-full bg-sky/15"><div className="h-full bg-mint" style={{ width: `${Math.min(100, ((stats.data?.todayCount ?? 0) / 3) * 100)}%` }} /></div></div></Card></div>
      <div className="grid grid-cols-2 gap-3"><Field label="Level"><Select value={level} onChange={(e) => setLevel(Number(e.target.value))}>{LEVEL_PRESETS.map((l) => <option key={l.level} value={l.level}>{l.name}</option>)}</Select></Field><Field label="Flash speed"><Select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={1800}>Slow</option><option value={1200}>Medium</option><option value={700}>Fast</option><option value={400}>Lightning</option></Select></Field></div>
      <div className="grid grid-cols-2 gap-3">{MODES.map((m) => <button key={m.m} onClick={() => start(m.m)} className="card min-h-[110px] p-4 text-left transition active:scale-95"><span className="text-4xl">{m.emoji}</span><p className="font-display text-xl font-bold text-navy">{m.label}</p><p className="text-xs text-ink/60">{m.hint}</p></button>)}</div>
      {!!stats.data?.badges?.length && <Card><h2 className="mb-2 font-display text-xl font-bold text-navy">Badges</h2><div className="flex flex-wrap gap-2">{stats.data.badges.map((b: string) => <span key={b} className="chip bg-sun/30 text-amber-800"><Badge size={16} className="mr-1 inline" /> {b}</span>)}</div></Card>}
      {trend.length > 1 && <Card><h2 className="mb-2 font-display text-xl font-bold text-navy">Accuracy and speed</h2><div className="h-48"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#e3eef7" /><XAxis dataKey="n" /><YAxis yAxisId="a" domain={[0, 100]} /><YAxis yAxisId="s" orientation="right" /><Tooltip /><Line yAxisId="a" dataKey="accuracy" stroke="#2BB88F" strokeWidth={3} /><Line yAxisId="s" dataKey="speed" stroke="#EC6206" strokeWidth={3} /></LineChart></ResponsiveContainer></div><p className="text-xs text-ink/60">Green: accuracy %. Orange: seconds per question.</p></Card>}
      <Modal open={showHist} onClose={() => setShowHist(false)} title="Practice history" wide><PracticeHistory bare sessions={stats.data?.sessions ?? []} /></Modal>
    </div>
  );
}
