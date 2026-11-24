import { motion } from 'framer-motion';
import { Animal } from './icons';
import { ArrowDown, ArrowUp, Crown } from 'lucide-react';
import { useEffect } from 'react';
import { cx } from './ui';
import { Mascot, confettiBurst } from './celebration';

export interface Row { studentId: string; name: string; points: number; rank: number; change: number; avatar: number; level?: number }
export const Avatar = ({ i, size = 'h-10 w-10 text-xl' }: { i: number; size?: string }) => <span className={cx('grid shrink-0 place-items-center rounded-full bg-sun/30', size)}><Animal i={i} size={36} /></span>;

const Change = ({ c }: { c: number }) => c > 0 ? <span className="flex items-center text-xs font-bold text-mint"><ArrowUp size={14} />{c}</span> : c < 0 ? <span className="flex items-center text-xs font-bold text-red-500"><ArrowDown size={14} />{-c}</span> : <span className="text-xs text-ink/30">–</span>;

export function Podium({ rows, unit = 'pts', score }: { rows: Row[]; unit?: string; score?: (r: any) => string }) {
  const order = [rows[1], rows[0], rows[2]]; const medal = ['#c0c0c0', '#FFA723', '#cd7f32']; const height = ['h-28', 'h-40', 'h-20'];
  return (
    <div className="flex items-end justify-center gap-3 pt-6">
      {order.map((r, k) => r && (
        <motion.div key={r.studentId} initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 10, delay: [0.3, 0.1, 0.5][k] }} className="flex w-28 flex-col items-center text-center sm:w-36">
          <Crown style={{ color: medal[k] }} fill={medal[k]} />
          <Avatar i={r.avatar} size="h-14 w-14 text-3xl" />
          <p className="mt-1 line-clamp-1 w-full font-display text-sm font-bold text-navy sm:text-base">{r.name}</p>
          <p className="text-xs font-bold text-saffron">{score ? score(r) : `${r.points} ${unit}`}</p>
          <div className={cx('mt-1 grid w-full place-items-center rounded-t-2xl font-display text-3xl font-extrabold text-white', height[k])} style={{ background: medal[k] }}>{r.rank}</div>
        </motion.div>
      ))}
    </div>
  );
}

export function BoardList({ rows, meId, start = 4, score }: { rows: Row[]; meId?: string; start?: number; score?: (r: any) => string }) {
  return (
    <ul className="space-y-2">{rows.filter((r) => r.rank >= start).map((r) => (
      <motion.li key={r.studentId} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cx('flex items-center gap-3 rounded-2xl px-3 py-2', r.studentId === meId ? 'bg-sun/30 ring-2 ring-saffron' : 'bg-white shadow-soft')}>
        <span className="w-8 text-center font-display text-xl font-extrabold text-navy">{r.rank}</span><Avatar i={r.avatar} />
        <span className="flex-1 font-bold">{r.name}{r.studentId === meId && <span className="chip ml-2 bg-saffron text-white">You</span>}</span>
        <Change c={r.change} /><span className="w-24 text-right font-display text-lg font-bold text-navy">{score ? score(r) : `${r.points} pts`}</span>
      </motion.li>
    ))}</ul>
  );
}

/** "You moved up N places!" confetti once per rank improvement. */
export function useRankConfetti(me: Row | null | undefined, key: string) {
  useEffect(() => {
    if (!me || me.change <= 0) return;
    const k = `kg_rank_${key}`; let seen = ''; try { seen = localStorage.getItem(k) ?? ''; } catch { /* ignore */ }
    if (seen === `${me.rank}`) return; try { localStorage.setItem(k, `${me.rank}`); } catch { /* ignore */ }
    confettiBurst();
  }, [me, key]);
}
export const Moved = ({ me }: { me?: Row | null }) => me && me.change > 0 ? <div className="mb-3 flex items-center gap-2 rounded-2xl bg-mint/20 p-3 font-bold text-emerald-800"><Mascot mood="cheer" size={44} />You moved up {me.change} place{me.change > 1 ? 's' : ''}!</div> : null;
