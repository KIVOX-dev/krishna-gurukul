import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Hand, Lightbulb, RotateCcw, Star, Target } from 'lucide-react';
import { generateQuestions, type Question } from '@kg/shared';
import { QuestionCard, VirtualAbacus } from '../../components/abacus';
import { confettiBurst, Mascot } from '../../components/celebration';
import { sfx } from '../../utils/sound';
import { haptic } from '../../native/feel';
import { SITE } from './shared';

const ROUND = 60;
const TIPS = [
  'Add the numbers from top to bottom, one row at a time.',
  'Picture the abacus in your mind. Slide the beads as you add.',
  'Wrong answer? No worry. Just move to the next sum.',
  'Use the tiny abacus below to check your thinking.',
];
const verdict = (n: number) => n >= 14 ? { t: 'Abacus champion!', d: 'That is lightning fast. Imagine your speed after a few weeks of training.', mood: 'cheer' as const } : n >= 8 ? { t: 'Super work!', d: 'You are a natural. A little daily practice will make you even faster.', mood: 'thumbs' as const } : { t: 'Great start!', d: 'Every champion begins here. Regular practice builds speed step by step.', mood: 'wave' as const };

/** Free 1 minute demo round for visitors. Ends with "Book a demo class". */
export default function Demo() {
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro');
  const [qs, setQs] = useState<Question[]>([]); const [i, setI] = useState(0); const [val, setVal] = useState('');
  const [score, setScore] = useState(0); const [tried, setTried] = useState(0); const [left, setLeft] = useState(ROUND); const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const inp = useRef<HTMLInputElement>(null);

  const start = () => { setQs(generateQuestions({ timeLimit: ROUND, questionCount: 40, digits: 1, rows: 3, operations: '+', level: 1 }, Date.now())); setI(0); setScore(0); setTried(0); setLeft(ROUND); setVal(''); setPhase('play'); };
  useEffect(() => {
    if (phase !== 'play') return;
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(id); setPhase('end'); confettiBurst(); sfx.fanfare(); void haptic('celebrate'); return 0; } return l - 1; }), 1000);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => { if (phase === 'play') inp.current?.focus(); }, [phase, i]);

  function submit(e: React.FormEvent) {
    e.preventDefault(); if (val === '' || !qs[i]) return;
    const ok = Number(val) === qs[i].answer; setFlash(ok ? 'ok' : 'bad'); setTried((t) => t + 1);
    if (ok) { setScore((s) => s + 1); sfx.ding(); void haptic('ok'); } else { sfx.oops(); void haptic('wrong'); }
    setTimeout(() => setFlash(null), 380); setVal(''); setI((x) => x + 1);
  }
  const q = qs[i]; const v = verdict(score); const pct = tried ? Math.round((score / tried) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ivory px-4 pb-28 pt-28 sm:pt-32 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-marigold/25 blur-3xl" /><div className="pointer-events-none absolute -right-24 top-60 h-96 w-96 rounded-full bg-peacock/15 blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-8 text-center lg:mb-3">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">Free abacus demo</p>
          <h1 className="mt-1 text-4xl font-extrabold text-plum sm:text-5xl lg:text-4xl">Try it. <span className="text-peacock">60 seconds</span>, no sign-up.</h1>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-4">
          {/* GAME */}
          <div className="rounded-[2rem] border border-peacock/10 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(10,37,64,.45)] sm:p-8 lg:p-8">
            <AnimatePresence mode="wait">
              {phase === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                  <Mascot mood="wave" size={120} className="mx-auto" />
                  <h2 className="mt-2 text-3xl font-extrabold text-plum">Ready to play?</h2>
                  <p className="mx-auto mt-2 max-w-sm text-lg text-plum/70">Solve as many sums as you can in one minute. Each sum has three numbers to add.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[[Clock, '1 minute'], [Target, '3 numbers'], [Star, 'Score points']].map(([Icon, t]: any) => <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-peacock-soft px-4 py-2 text-sm font-extrabold text-peacock-deep"><Icon size={16} />{t}</span>)}
                  </div>
                  <button onClick={start} className="mt-7 inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-9 font-display text-xl font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] transition active:scale-95">Start the round <ArrowRight size={22} /></button>
                </motion.div>
              )}

              {phase === 'play' && q && (
                <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-marigold-soft px-4 py-2 font-display text-xl font-extrabold text-amber-800"><Star size={20} fill="currentColor" className="text-marigold" />{score}</span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xl font-extrabold tabular-nums ${left <= 10 ? 'bg-rose-soft text-rose' : 'bg-peacock-soft text-peacock-deep'}`}><Clock size={20} />{left}s</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-peacock-soft"><motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-peacock to-rose" animate={{ scaleX: left / ROUND }} transition={{ duration: 0.9, ease: 'linear' }} /></div>

                  <motion.div key={i} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.22 }}
                    className={`rounded-3xl border-2 bg-ivory px-6 py-7 text-center transition-colors [&_.text-navy]:text-plum [&_.text-saffron]:text-rose ${flash === 'ok' ? 'border-mint bg-mint/10' : flash === 'bad' ? 'shake border-rose bg-rose-soft' : 'border-peacock/10'}`}>
                    <QuestionCard q={q} big />
                  </motion.div>

                  <form onSubmit={submit} className="flex items-stretch gap-3">
                    <input ref={inp} value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d-]/g, ''))} inputMode="numeric" autoComplete="off" placeholder="Your answer" aria-label="Your answer"
                      className="min-h-16 min-w-0 flex-1 rounded-2xl border-2 border-peacock/20 bg-white px-4 text-center font-display text-3xl font-extrabold text-plum outline-none transition placeholder:text-base placeholder:font-bold placeholder:text-plum/35 focus:border-peacock focus:ring-4 focus:ring-peacock/15" />
                    <button type="submit" className="inline-flex min-h-16 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-rose px-6 font-display text-xl font-bold text-white shadow-[0_10px_24px_-10px_rgba(232,89,12,.8)] transition active:scale-95 sm:px-8">Check <ArrowRight size={20} /></button>
                  </form>

                  <div className="mx-auto w-fit max-w-full rounded-3xl bg-peacock-mist p-4">
                    <p className="mb-2 flex items-center justify-center gap-1.5 text-sm font-extrabold text-peacock-deep"><Hand size={16} />Tap the beads to try the abacus</p>
                    <div className="flex justify-center"><VirtualAbacus rods={3} compact /></div>
                  </div>
                </motion.div>
              )}

              {phase === 'end' && (
                <motion.div key="end" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                  <Mascot mood={v.mood} size={120} className="mx-auto" />
                  <p className="mt-2 font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">Time is up</p>
                  <h2 className="text-4xl font-extrabold text-plum">{v.t}</h2>
                  <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3">
                    {[[score, 'Solved'], [tried, 'Tried'], [`${pct}%`, 'Accuracy']].map(([n, l], k) => <div key={l} className={`rounded-2xl p-3 ${['bg-peacock-soft', 'bg-marigold-soft', 'bg-rose-soft'][k]}`}><p className="font-display text-3xl font-extrabold text-plum">{n}</p><p className="text-xs font-extrabold uppercase tracking-wide text-plum/60">{l}</p></div>)}
                  </div>
                  <p className="mx-auto mt-5 max-w-sm text-lg text-plum/75">{v.d}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link to="/contact#enquire" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] active:scale-95">Book a free demo class <ArrowRight size={20} /></Link>
                    <button onClick={start} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-peacock-deep/20 bg-white px-7 font-display text-lg font-bold text-peacock-deep active:scale-95"><RotateCcw size={18} />Play again</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SIDE PANEL */}
          <aside className="space-y-4 lg:space-y-3">
            <div className="rounded-[2rem] border border-peacock/10 bg-white p-6 shadow-sm lg:p-4">
              <h3 className="flex items-center gap-2 font-display text-2xl font-extrabold text-plum"><Lightbulb className="text-marigold" />Quick tips</h3>
              <ul className="mt-3 space-y-3 lg:mt-2 lg:space-y-2 lg:text-sm">{TIPS.map((t) => <li key={t} className="flex gap-2.5 leading-snug text-plum/75"><CheckCircle2 className="mt-0.5 shrink-0 text-peacock" size={20} />{t}</li>)}</ul>
            </div>
            <div className="rounded-[2rem] bg-peacock-deep p-6 text-white lg:p-4">
              <h3 className="font-display text-2xl font-extrabold">Liked it? <span className="text-marigold">Come and learn.</span></h3>
              <p className="mt-2 leading-relaxed text-white/80">In real classes children go from simple adds to lightning-fast mental maths across 10 levels, with a friendly teacher beside them.</p>
              <Link to="/courses/abacus" className="mt-4 inline-flex min-h-12 items-center gap-2 font-display font-bold text-marigold">See the abacus course <ArrowRight size={18} /></Link>
              <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="mt-1 flex min-h-12 items-center font-bold text-white/85 underline-offset-4 hover:underline">Chat with us on WhatsApp</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
