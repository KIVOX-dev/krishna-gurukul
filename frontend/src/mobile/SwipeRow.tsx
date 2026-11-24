import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { haptic } from '../native/feel';

export interface SwipeAction { label: string; icon?: ReactNode; tone?: 'blue' | 'green' | 'red' | 'orange'; onTrigger: () => void }
const BG = { blue: 'bg-sky', green: 'bg-mint', red: 'bg-red-500', orange: 'bg-saffron' };
const W = 96;

/** List card with swipe actions: swipe left reveals `right`, swipe right reveals `left`. 48dp+ action targets. */
export function SwipeRow({ children, left, right }: { children: ReactNode; left?: SwipeAction; right?: SwipeAction }) {
  const x = useMotionValue(0);
  const lOp = useTransform(x, [0, W], [0, 1]); const rOp = useTransform(x, [-W, 0], [1, 0]);
  const settle = (to: number) => animate(x, to, { type: 'spring', damping: 30, stiffness: 400 });
  const fire = (a?: SwipeAction) => { if (!a) return; haptic('tap'); settle(0); a.onTrigger(); };
  return (
    <div className="relative overflow-hidden rounded-chunk">
      {left && <motion.button style={{ opacity: lOp }} onClick={() => fire(left)} className={`absolute inset-y-0 left-0 flex w-24 flex-col items-center justify-center gap-1 text-xs font-bold text-white ${BG[left.tone ?? 'green']}`}>{left.icon}{left.label}</motion.button>}
      {right && <motion.button style={{ opacity: rOp }} onClick={() => fire(right)} className={`absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-1 text-xs font-bold text-white ${BG[right.tone ?? 'red']}`}>{right.icon}{right.label}</motion.button>}
      <motion.div style={{ x, touchAction: 'pan-y' }} drag="x" dragConstraints={{ left: right ? -W : 0, right: left ? W : 0 }} dragElastic={0.1}
        onDragEnd={(_, i) => { const p = x.get() + i.velocity.x * 0.1; settle(p > W / 2 && left ? W : p < -W / 2 && right ? -W : 0); }} className="relative bg-white">
        {children}
      </motion.div>
    </div>
  );
}
