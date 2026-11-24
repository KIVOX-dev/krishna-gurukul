import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get, post, errMsg } from '../../services/api';
import { useAuth, toast } from '../../store';
import { useDevice } from '../../hooks';
import { Button, ErrorState, Input, PageTitle, SkeletonList, cx } from '../../components/ui';
import { Avatar } from '../../components/Leaderboard';

const ST = ['present', 'absent', 'late', 'leave'] as const;
const STYLE: Record<string, string> = { present: 'bg-mint text-white', absent: 'bg-red-500 text-white', late: 'bg-sun text-ink', leave: 'bg-sky text-white' };

/** Mobile: large tap rows + sticky save. Desktop: grid of the whole batch. Default all present. */
export default function Attendance() {
  const { batchId } = useParams(); const nav = useNavigate(); const { isDesktop } = useDevice(); const role = useAuth((s) => s.user?.role);
  const [date, setDate] = useState(new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10));
  const q = useQuery({ queryKey: ['att', batchId, date], queryFn: () => get(`/faculty/attendance/${batchId}`, { date }) });
  const [st, setSt] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) setSt(Object.fromEntries(q.data.students.map((s: any) => [s.id, s.status]))); }, [q.data]);
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const d = q.data; const cycle = (id: string) => setSt((s) => ({ ...s, [id]: ST[(ST.indexOf(s[id] as any) + 1) % 4] }));
  async function save() { setBusy(true); try { const r = await post(`/faculty/attendance/${batchId}`, { date, records: Object.entries(st).map(([studentId, status]) => ({ studentId, status })) }); toast.ok(`Saved for ${r.saved} students`); nav(role === 'admin' ? '/admin/batches' : '/faculty'); } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); } }
  const counts = ST.map((k) => [k, Object.values(st).filter((v) => v === k).length] as const);
  return (
    <div className="pb-24">
      <PageTitle title={d.batch.name} sub={d.canEdit ? 'Tap a student to change status' : 'Past days can only be edited by admin'} right={role === 'admin' ? <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" /> : undefined} />
      <div className="mb-3 flex flex-wrap gap-2">{counts.map(([k, n]) => <span key={k} className={cx('chip capitalize', STYLE[k])}>{k} {n}</span>)}<Button small variant="ghost" onClick={() => setSt(Object.fromEntries(d.students.map((s: any) => [s.id, 'present'])))}>All present</Button></div>
      <div className={isDesktop ? 'grid grid-cols-3 gap-3 xl:grid-cols-4' : 'space-y-2'}>
        {d.students.map((s: any) => (
          <div key={s.id} className="card flex min-h-[64px] items-center gap-3 p-3"><Avatar i={s.avatar ?? 0} /><span className="flex-1 font-bold text-navy">{s.name}</span>
            {isDesktop || true ? <div className="flex gap-1">{ST.map((k) => <button key={k} disabled={!d.canEdit} aria-label={`${s.name} ${k}`} onClick={() => setSt((x) => ({ ...x, [s.id]: k }))} className={cx('grid min-h-[44px] min-w-[44px] place-items-center rounded-xl text-sm font-extrabold uppercase transition', st[s.id] === k ? STYLE[k] : 'bg-sky/10 text-navy/50')}>{k[0]}</button>)}</div> : <button onClick={() => cycle(s.id)} />}
          </div>))}
      </div>
      <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-30 flex justify-center p-3 lg:static lg:mt-4 lg:justify-end"><Button loading={busy} disabled={!d.canEdit} onClick={save} className="w-full max-w-md lg:w-auto">Save attendance</Button></div>
    </div>
  );
}
