import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { abacusSteps, formatQuestion, type PublicQuestion } from '@kg/shared';
import { Button, Modal } from '../ui';
import { VirtualAbacus } from './VirtualAbacus';
import { Play, SkipForward } from 'lucide-react';
import { sfx, speakAsync, stopSpeaking } from '../../utils/sound';

export { VirtualAbacus };

/** All rows shown at once (visual sheet). */
export function QuestionCard({ q, big }: { q: PublicQuestion; big?: boolean }) {
  if (q.op === 'x' || q.op === '/') return <div className={`font-display font-extrabold text-navy ${big ? 'text-6xl' : 'text-4xl'}`}>{formatQuestion(q)}</div>;
  return (
    <div className={`mx-auto inline-block text-right font-display font-extrabold leading-tight text-navy ${big ? 'text-5xl' : 'text-3xl'}`}>
      {q.numbers.map((n, i) => <div key={i} className={n < 0 ? 'text-saffron' : ''}>{n < 0 ? `− ${-n}` : i === 0 ? n : `+ ${n}`}</div>)}
      <div className="mt-1 border-t-4 border-navy/30" />
    </div>
  );
}

/** Numbers flash one by one at a set speed. In listening mode each number waits for the voice to finish, so none is skipped. */
export function FlashCard({ q, speedMs, listen, onDone }: { q: PublicQuestion; speedMs: number; listen?: boolean; onDone: () => void }) {
  const [i, setI] = useState(-1);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    let dead = false; setI(-1);
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      stopSpeaking(); await wait(600);
      for (let k = 0; k < q.numbers.length && !dead; k++) {
        setI(k); sfx.tick();
        const t0 = Date.now();
        if (listen) await speakAsync(q.numbers[k] < 0 ? `minus ${-q.numbers[k]}` : String(q.numbers[k]));
        if (dead) return;
        await wait(Math.max(listen ? 250 : 0, speedMs - (Date.now() - t0)));
      }
      if (!dead) { setI(-2); done.current(); }
    })();
    return () => { dead = true; stopSpeaking(); };
  }, [q, speedMs, listen]);
  const n = q.numbers[i];
  return (
    <div className="grid h-52 place-items-center">
      <AnimatePresence mode="wait">
        {n !== undefined && <motion.div key={i} initial={{ scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.18 }} className={`font-display text-8xl font-extrabold ${n < 0 ? 'text-saffron' : 'text-navy'}`}>{n < 0 ? `− ${-n}` : n}</motion.div>}
        {i === -1 && <motion.div key="r" className="font-display text-3xl font-bold text-sky" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8 }}>Get ready…</motion.div>}
        {i === -2 && <motion.div key="d" className="font-display text-3xl font-bold text-mint">What is the answer?</motion.div>}
      </AnimatePresence>
    </div>
  );
}

/** "See how": animates the beads on a virtual abacus, one term at a time. */
export function SeeHowPlayer({ q, open, onClose }: { q: PublicQuestion; open: boolean; onClose: () => void }) {
  const steps = abacusSteps(q);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => { if (open) { setI(0); setAuto(true); } }, [open, q]);
  useEffect(() => {
    if (!open || !auto) return;
    if (i >= steps.length - 1) { setAuto(false); return; }
    const id = setTimeout(() => setI((x) => x + 1), 1300);
    return () => clearTimeout(id);
  }, [open, auto, i, steps.length]);
  const s = steps[i];
  return (
    <Modal open={open} onClose={onClose} title="See how it is done">
      <p className="mb-3 text-center font-display text-xl font-bold text-navy"><QuestionLine q={q} /></p>
      <div className="flex justify-center"><VirtualAbacus value={s.after} interactive={false} rods={Math.max(4, String(Math.max(...steps.map((x) => x.after), 10)).length + 1)} /></div>
      <motion.p key={i} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-3 text-center text-lg font-bold text-saffron">Step {i + 1}: {s.label} → {s.after}</motion.p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="ghost" small onClick={() => { setAuto(false); setI(Math.max(0, i - 1)); }}>Back</Button>
        <Button small onClick={() => { setAuto(false); setI(Math.min(steps.length - 1, i + 1)); }}><SkipForward size={16} /> Next</Button>
        <Button variant="blue" small onClick={() => { setI(0); setAuto(true); }}><Play size={16} /> Replay</Button>
      </div>
    </Modal>
  );
}
const QuestionLine = ({ q }: { q: PublicQuestion }) => <>{formatQuestion(q)}</>;
