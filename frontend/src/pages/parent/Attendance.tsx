import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { get } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { Card, EmptyState, ErrorState, Skeleton, cx } from '../../components/ui';

const COLOR: Record<string, string> = { present: 'bg-mint text-white', absent: 'bg-red-500 text-white', late: 'bg-sun text-ink', leave: 'bg-sky/40 text-navy' };

export default function ParentAttendance() {
  const { id } = useKid(); const [m, setM] = useState(() => new Date().toISOString().slice(0, 7));
  const q = useQuery({ queryKey: ['att', id, m], queryFn: () => get(`/parent/children/${id}/attendance`, { month: m }), enabled: !!id });
  const [y, mo] = m.split('-').map(Number); const first = new Date(y, mo - 1, 1); const days = new Date(y, mo, 0).getDate(); const lead = (first.getDay() + 6) % 7;
  const map = new Map<string, string>((q.data?.days ?? []).map((d: any) => [d.date, d.status]));
  const shift = (n: number) => { const d = new Date(y, mo - 1 + n, 1); setM(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between"><button aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-soft" onClick={() => shift(-1)}><ChevronLeft /></button><h1 className="text-2xl font-extrabold text-navy">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h1><button aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-soft" onClick={() => shift(1)}><ChevronRight /></button></div>
      {q.isLoading ? <Skeleton className="h-72" /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : (
        <>
          <Card className="text-center"><p className="text-xs font-extrabold uppercase text-ink/50">Monthly attendance</p><p className="font-display text-5xl font-extrabold text-navy">{q.data.percent}%</p></Card>
          <Card><div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-ink/50">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="mt-1 grid grid-cols-7 gap-1.5">{Array.from({ length: lead }).map((_, i) => <span key={i} />)}{Array.from({ length: days }, (_, i) => { const d = `${m}-${String(i + 1).padStart(2, '0')}`; const s = map.get(d); return <div key={d} title={s} className={cx('grid aspect-square place-items-center rounded-xl text-sm font-bold', s ? COLOR[s] : 'bg-sky/5 text-ink/40')}>{i + 1}</div>; })}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.keys(COLOR).map((k) => <span key={k} className={cx('chip capitalize', COLOR[k])}>{k}</span>)}</div></Card>
          {!q.data.days.length && <EmptyState title="No classes this month" hint="Attendance appears here once your child's batch is marked." />}
        </>
      )}
    </div>
  );
}
