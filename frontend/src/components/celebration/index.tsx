import confetti from 'canvas-confetti';
import { Trophy, Badge, Sparkle, Teacher } from '../icons';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { formatQuestion, type PublicQuestion } from '@kg/shared';
import { Mascot, type Mood } from './Mascot';
import { SeeHowPlayer } from '../abacus';
import { Button } from '../ui';
import { sfx } from '../../utils/sound';
import { reduced } from '../../utils/motion';
import { useMute } from '../../store';

export { Mascot };

/* --------------------------------- confetti --------------------------------- */
const COLORS = ['#EC6206', '#FFA723', '#2F8EE0', '#00457F', '#2BB88F'];
export function confettiBurst() { if (!reduced()) confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, colors: COLORS }); }
export function confettiCannon() {
  if (reduced()) return;
  const end = Date.now() + 2200;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.9 }, colors: COLORS, startVelocity: 70 });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.9 }, colors: COLORS, startVelocity: 70 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: COLORS, scalar: 1.2 });
}
export function sparkles() { if (!reduced()) confetti({ particleCount: 40, spread: 360, startVelocity: 18, gravity: 0.4, scalar: 0.8, shapes: ['star'], colors: ['#FFA723', '#FFF'], origin: { y: 0.4 } }); }

/* ---------------------------------- ring ---------------------------------- */
export function ScoreRing({ score, size = 190, onDone }: { score: number; size?: number; onDone?: () => void }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v));
  const stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const dash = useTransform(mv, (v) => c - (v / 100) * c);
  useEffect(() => { const a = animate(mv, score, { duration: reduced() ? 0.01 : 1.8, ease: 'easeOut', onComplete: onDone }); return () => a.stop(); }, [score, mv, onDone]);
  const color = score >= 90 ? '#2BB88F' : score >= 70 ? '#2F8EE0' : score >= 50 ? '#FFA723' : '#EC6206';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="#e3eef7" strokeWidth={stroke} fill="none" /><motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} style={{ strokeDashoffset: dash }} /></svg>
      <div className="absolute inset-0 grid place-items-center"><div className="text-center"><motion.span className="font-display text-6xl font-extrabold text-navy">{text}</motion.span><span className="font-display text-2xl font-bold text-navy/60">%</span></div></div>
    </div>
  );
}

const Star = ({ on, delay }: { on: boolean; delay: number }) => (
  <motion.svg viewBox="0 0 24 24" className="h-14 w-14" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay, type: 'spring', stiffness: 300, damping: 12 }}>
    <path d="M12 2l3 6.9 7.5.7-5.7 5 1.8 7.4L12 18l-6.6 4 1.8-7.4-5.7-5 7.5-.7z" fill={on ? '#FFA723' : '#dfe9f2'} stroke={on ? '#EC6206' : '#c5d4e2'} strokeWidth="1" />
  </motion.svg>
);

function Balloons() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden">{Array.from({ length: 7 }, (_, i) => <motion.div key={i} className="absolute bottom-[-60px] h-14 w-11 rounded-[50%]" style={{ left: `${8 + i * 13}%`, background: COLORS[i % 5], opacity: 0.8 }} animate={{ y: [0, -520], x: [0, i % 2 ? 20 : -20, 0] }} transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }} />)}</div>;
}
function TrophyDrop() { return <motion.div initial={{ y: -300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 8, stiffness: 120 }} aria-hidden><Trophy size={110} /></motion.div>; }

export interface ResultData {
  id: string; title: string; score: number; stars: number; correct: number; wrong: number; skipped: number; durationMs: number; fastestMs: number;
  improvement?: number; feedback?: string; aiSummary?: string; aiStatus?: string; remark?: string;
  review: { q: number; given: number | null; expected: number; correct: boolean; timeMs: number; numbers: number[]; op: any }[];
}
const msgFor = (s: number): { msg: string; mood: Mood } => s >= 90 ? { msg: 'Abacus Champion!', mood: 'cheer' } : s >= 70 ? { msg: 'Super work, keep going!', mood: 'thumbs' } : s >= 50 ? { msg: "Good try, you're improving!", mood: 'cheer' } : { msg: "Every champion practises. Let's try again!", mood: 'hug' };

/** The animated result: build up → ring + stars → celebration → stats → review → feedback → actions. */
export function ResultExperience({ r, animateIn = true, onPracticeMistakes, onHome, studentName }: { r: ResultData; animateIn?: boolean; onPracticeMistakes?: () => void; onHome?: () => void; studentName?: string }) {
  const [phase, setPhase] = useState<'build' | 'reveal'>(animateIn && !reduced() ? 'build' : 'reveal');
  const [ringDone, setRingDone] = useState(!animateIn || reduced());
  const { muted, toggle } = useMute();
  const { msg, mood } = msgFor(r.score);

  useEffect(() => {
    if (phase !== 'build') return;
    sfx.drum(2); const t = setTimeout(() => { setPhase('reveal'); sfx.ding(); }, 2000);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (!ringDone || !animateIn) return;
    if (r.score >= 90) { confettiCannon(); sfx.fanfare(); } else if (r.score >= 70) { confettiBurst(); sfx.fanfare(); } else if (r.score >= 50) sparkles();
  }, [ringDone, animateIn, r.score]);

  if (phase === 'build')
    return (
      <div className="grid min-h-[70vh] place-items-center text-center">
        <div>
          <div className="mb-6 flex justify-center gap-2">{[0, 1, 2, 3, 4].map((i) => <motion.div key={i} className="h-8 w-8 rounded-full" style={{ background: COLORS[i] }} animate={{ y: [0, -50, 0], scaleY: [1, 1.1, 0.8, 1] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.1 }} />)}</div>
          <p className="font-display text-3xl font-bold text-navy">Counting your beads…</p>
          <button onClick={toggle} className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-ink/60">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}{muted ? 'Sound off' : 'Sound on'}</button>
        </div>
      </div>
    );

  const mins = Math.floor(r.durationMs / 60000), secs = Math.round((r.durationMs % 60000) / 1000);
  return (
    <div className="relative mx-auto max-w-3xl space-y-6 pb-10">
      {r.score < 50 && <Balloons />}
      <section className="card relative overflow-hidden p-6 text-center">
        <div className="absolute inset-x-0 top-0 h-28 grad-sunset opacity-90" />
        <div className="relative">
          <p className="font-display text-lg font-bold text-white">{studentName ? `${studentName} · ` : ''}{r.title}</p>
          <div className="mt-6 flex justify-center rounded-full"><div className="rounded-full bg-white p-2 shadow-soft"><ScoreRing score={r.score} onDone={() => setRingDone(true)} /></div></div>
          <div className="mt-3 flex justify-center gap-1">{[1, 2, 3].map((n) => (ringDone ? <Star key={n} on={r.stars >= n} delay={n * 0.25} /> : <div key={n} className="h-14 w-14" />))}</div>
          {ringDone && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-2 flex flex-col items-center">
            {r.score >= 90 && <TrophyDrop />}
            <Mascot mood={mood} size={110} />
            <p className="font-display text-3xl font-extrabold text-saffron">{msg}</p>
            {r.score >= 90 && <p className="mt-1 rounded-full bg-sun/30 px-4 py-1 text-sm font-bold text-amber-800"><Badge size={20} className="mr-1 inline" /> Badge unlocked: Abacus Champion</p>}
          </motion.div>}
        </div>
      </section>

      <motion.section initial="h" animate={ringDone ? 'v' : 'h'} variants={{ v: { transition: { staggerChildren: 0.1, delayChildren: 1 } } }} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[['Correct', r.correct, 'text-mint'], ['Wrong', r.wrong, 'text-red-500'], ['Skipped', r.skipped, 'text-ink/50'], ['Time', `${mins}:${String(secs).padStart(2, '0')}`, 'text-navy'], ['Fastest', r.fastestMs ? `${(r.fastestMs / 1000).toFixed(1)}s` : '–', 'text-sky']].map(([l, v, c]) => (
          <motion.div key={String(l)} variants={{ h: { x: 80, opacity: 0 }, v: { x: 0, opacity: 1 } }} className="card p-4 text-center"><p className="text-xs font-extrabold uppercase text-ink/50">{l}</p><p className={`font-display text-3xl font-extrabold ${c}`}>{v}</p></motion.div>
        ))}
        {r.improvement ? <motion.div variants={{ h: { x: 80, opacity: 0 }, v: { x: 0, opacity: 1 } }} className="card flex flex-col items-center justify-center p-4 text-center"><p className="text-xs font-extrabold uppercase text-ink/50">vs last test</p><p className={`flex items-center font-display text-3xl font-extrabold ${r.improvement > 0 ? 'text-mint' : 'text-red-500'}`}>{r.improvement > 0 && <ArrowUp />}{r.improvement > 0 ? '+' : ''}{r.improvement}%</p></motion.div> : null}
      </motion.section>

      <Feedback r={r} />
      <Review r={r} />
      <div className="flex flex-wrap justify-center gap-3">
        {r.wrong + r.skipped > 0 && onPracticeMistakes && <Button onClick={onPracticeMistakes}>Practise my mistakes</Button>}
        <Button variant="sun" onClick={() => shareScore(r, studentName)}><Share2 size={18} /> Share my score</Button>
        {onHome && <Button variant="ghost" onClick={onHome}>Back home</Button>}
      </div>
    </div>
  );
}

function Feedback({ r }: { r: ResultData }) {
  return (
    <section className="card p-5">
      <h3 className="text-xl font-extrabold text-navy">Feedback</h3>
      <p className="mt-1">{r.feedback}</p>
      <AnimatePresence>{r.aiSummary && r.aiSummary !== r.feedback && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="mt-3 rounded-2xl bg-sky/10 p-3 text-navy"><Sparkle size={18} className="mr-1 inline" /> {r.aiSummary}</motion.p>}</AnimatePresence>
      {r.aiStatus === 'queued' && <p className="mt-2 text-xs text-ink/50">A personal note for your parents is being written…</p>}
      {r.remark && <p className="mt-3 rounded-2xl bg-sun/20 p-3 text-amber-900"><Teacher size={20} className="mr-1 inline" /> Teacher: {r.remark}</p>}
    </section>
  );
}

function Review({ r }: { r: ResultData }) {
  const [how, setHow] = useState<PublicQuestion | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <section>
      <h3 className="mb-2 text-xl font-extrabold text-navy">Answer review</h3>
      <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-1 lg:overflow-visible">
        {r.review.map((a, i) => (
          <motion.div key={a.q} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`card min-w-[85%] snap-center p-4 sm:min-w-[60%] lg:min-w-0 ${a.correct ? '' : 'shake'}`}>
            <div className="flex items-center justify-between"><span className="chip bg-sky/10 text-navy">Question {i + 1}</span>{a.correct ? <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-white"><Check size={20} /></span> : <span className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white"><X size={20} /></span>}</div>
            <p className="mt-2 font-display text-2xl font-bold text-navy">{formatQuestion({ id: a.q, numbers: a.numbers, op: a.op })}</p>
            <p className="mt-1 text-sm">Your answer: <b className={a.correct ? 'text-mint' : 'text-red-500'}>{a.given ?? 'skipped'}</b>{!a.correct && <> · Correct: <b className="text-mint">{a.expected}</b></>}</p>
            {!a.correct && <Button small variant="blue" className="mt-3" onClick={() => setHow({ id: a.q, numbers: a.numbers, op: a.op })}>See how</Button>}
          </motion.div>
        ))}
      </div>
      {how && <SeeHowPlayer q={how} open onClose={() => setHow(null)} />}
    </section>
  );
}

/** Image card for WhatsApp, drawn on a canvas. */
export async function shareScore(r: ResultData, name?: string) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 900; const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 900, 900); g.addColorStop(0, '#00457F'); g.addColorStop(0.6, '#2F8EE0'); g.addColorStop(1, '#FFA723'); x.fillStyle = g; x.fillRect(0, 0, 900, 900);
  x.fillStyle = '#fff'; x.beginPath(); x.roundRect(60, 60, 780, 780, 48); x.fill();
  x.textAlign = 'center'; x.fillStyle = '#00457F'; x.font = '800 54px "Plus Jakarta Sans", system-ui, sans-serif'; x.fillText('Krishna Gurukul', 450, 150);
  x.fillStyle = '#EC6206'; x.font = '800 220px "Plus Jakarta Sans", system-ui, sans-serif'; x.fillText(`${r.score}%`, 450, 440);
  for (let k = 0; k < 3; k++) { const cx = 450 + (k - 1) * 110, cy = 520, on = k < r.stars; x.beginPath(); for (let j = 0; j < 10; j++) { const rr = j % 2 ? 22 : 50, ang = (Math.PI / 5) * j - Math.PI / 2; x.lineTo(cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)); } x.closePath(); x.fillStyle = on ? '#FFB020' : '#D9E2EC'; x.fill(); }
  x.fillStyle = '#0B2238'; x.font = '700 48px Inter, sans-serif'; x.fillText(`${name ?? 'I'} scored in ${r.title}`.slice(0, 40), 450, 660);
  x.fillStyle = '#5b7186'; x.font = '600 34px Inter, sans-serif'; x.fillText(msgFor(r.score).msg, 450, 730); x.fillText('Where Tradition Meets Modern Excellence', 450, 790);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
  const file = new File([blob], 'my-score.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: `I scored ${r.score}% at Krishna Gurukul!` }); return; } catch { /* cancelled */ } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-score.png'; a.click();
}
