import { useQuery } from '@tanstack/react-query';
import { PracticeChart } from '../../components/PracticeChart';
import { Flame, Party, Stars, Trophy as TrophyIcon } from '../../components/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, IndianRupee, Star } from 'lucide-react';
import { get } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { Badge, Card, EmptyState, ErrorState, Skeleton, statusTone } from '../../components/ui';
import { Mascot } from '../../components/celebration';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function ParentHome() {
  const { kid, id, loading } = useKid();
  const q = useQuery({ queryKey: ['home', id], queryFn: () => get(`/parent/children/${id}/home`), enabled: !!id });
  if (loading || q.isLoading) return <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-40" /></div>;
  if (!kid) return <EmptyState mood="idle" title="No child linked yet" hint="Please ask the Gurukul office to link your child to this email." />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const h = q.data;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="relative overflow-hidden rounded-[28px] bg-navy px-6 pb-16 pt-6 text-white sm:px-8 sm:pt-8">
          {/* crisp abacus-rod motif */}
          <svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 opacity-30" viewBox="0 0 300 200" preserveAspectRatio="xMaxYMid slice" aria-hidden>
            {[40, 100, 160, 220, 280].map((x, i) => (
              <g key={x}><rect x={x - 1.5} y="0" width="3" height="200" fill="#fff" opacity=".5" />
                {[0, 1, 2].map((k) => <ellipse key={k} cx={x} cy={30 + k * 22 + (i % 2) * 14} rx="15" ry="9" fill={['#FFA723', '#EC6206', '#2F8EE0', '#fff', '#2BB88F'][(i + k) % 5]} />)}
                {[0, 1, 2, 3].map((k) => <ellipse key={`e${k}`} cx={x} cy={118 + k * 20 - (i % 3) * 10} rx="15" ry="9" fill={['#EC6206', '#FFA723', '#fff', '#2F8EE0', '#2BB88F'][(i + k + 2) % 5]} />)}</g>
            ))}
          </svg>
          <div className="relative flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sun">{greeting()}</p>
              <h1 className="mt-1 truncate text-4xl font-extrabold sm:text-5xl">{kid.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full bg-sun px-3 py-1 text-ink">Level {kid.abacusLevel ?? 1}</span>
                {(kid.courseIds ?? []).slice(0, 2).map((c: any) => <span key={c._id} className="rounded-full border border-white/30 px-3 py-1 text-white/90">{c.name}</span>)}
              </div>
            </div>
            <Mascot mood="wave" size={104} className="-mb-2 hidden shrink-0 sm:block" />
          </div>
        </div>
        <div className="relative -mt-10 grid grid-cols-3 gap-3 px-3 sm:px-6">
          {[[<Flame key="f" size={30} />, h.streak, 'day streak', 'bg-saffron/10'], [<TrophyIcon key="t" size={30} />, h.points, 'points', 'bg-sun/20'], [<Star key="s" size={26} className="text-sun" fill="currentColor" />, h.latestTest ? `${h.latestTest.score}%` : '–', 'last test', 'bg-sky/15']].map(([icon, v, l, bg]: any) => (
            <div key={l} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-sky/10 sm:p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 ${bg}`}>{icon}</span>
              <div className="min-w-0"><p className="font-display text-2xl font-extrabold leading-none text-navy sm:text-3xl">{v}</p><p className="mt-1 truncate text-xs font-bold text-ink/55">{l}</p></div>
            </div>
          ))}
        </div>
      </motion.section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><p className="text-xs font-extrabold uppercase text-ink/50">Today</p><div className="mt-1">{h.todayStatus ? <Badge tone={statusTone(h.todayStatus)}>{h.todayStatus}</Badge> : <span className="text-ink/60">No class marked yet</span>}</div></Card>
        <Card><p className="flex items-center gap-1 text-xs font-extrabold uppercase text-ink/50"><CalendarClock size={14} />Next class</p>{h.next ? <p className="font-display text-xl font-bold text-navy">{h.next.when} · {h.next.time}<span className="block text-sm font-normal text-ink/70">{h.next.name}</span></p> : <p className="text-ink/60">No classes scheduled</p>}</Card>
        <Link to="/parent/fees"><Card><p className="flex items-center gap-1 text-xs font-extrabold uppercase text-ink/50"><IndianRupee size={14} />Pending fee</p><p className={`font-display text-3xl font-extrabold ${h.pendingFee ? 'text-saffron' : 'text-mint'}`}>{h.pendingFee ? `₹${h.pendingFee}` : <span className="inline-flex items-center gap-2">All clear <Party size={28} /></span>}</p></Card></Link>
        <Link to="/parent/tests"><Card><p className="flex items-center gap-1 text-xs font-extrabold uppercase text-ink/50"><Star size={14} />Latest test</p>{h.latestTest ? <p className="font-display text-3xl font-extrabold text-navy">{h.latestTest.score}% <Stars n={h.latestTest.stars} size={20} /><span className="block text-sm font-normal text-ink/70">{h.latestTest.title}</span></p> : <p className="text-ink/60">No tests yet</p>}</Card></Link>
      </div>
      {h.pendingTests > 0 && <Link to="/parent/tests" className="btn-primary btn w-full">{h.pendingTests} test{h.pendingTests > 1 ? 's' : ''} waiting. Take it now!</Link>}
      <PracticeChart childId={id!} />
      <Link to="/parent/practice" className="btn-sun btn w-full">Practise abacus</Link>
    </div>
  );
}
