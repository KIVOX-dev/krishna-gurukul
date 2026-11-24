import { useState } from 'react';
import { Trophy, Medal } from '../../components/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, put } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { useAuth, toast } from '../../store';
import { BoardList, Moved, Podium, useRankConfetti, type Row } from '../../components/Leaderboard';
import { Card, EmptyState, ErrorState, SkeletonList, cx } from '../../components/ui';

export default function ParentLeaderboard() {
  const { id } = useKid(); const user = useAuth((s) => s.user); const qc = useQueryClient();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week'); const [scope, setScope] = useState<'batch' | 'level' | 'all'>('level'); const [hide, setHide] = useState(!!user?.hideChild);
  const q = useQuery({ queryKey: ['lb', id, period, scope], queryFn: () => get(`/parent/children/${id}/leaderboard`, { period, scope }), enabled: !!id });
  const d = q.data; useRankConfetti(d?.me, id ?? '');
  const tabs = <div className="mb-3 flex flex-wrap gap-2">{([['week', 'This week'], ['month', 'This month'], ['all', 'All time']] as const).map(([k, l]) => <button key={k} onClick={() => setPeriod(k)} className={cx('min-h-[44px] rounded-full px-4 font-bold', period === k ? 'bg-navy text-white' : 'bg-white text-navy shadow-soft')}>{l}</button>)}</div>;
  const scopes = <div className="mb-4 flex flex-wrap gap-2">{([['batch', 'My batch'], ['level', 'My level'], ['all', 'Whole Gurukul']] as const).map(([k, l]) => <button key={k} onClick={() => setScope(k)} className={cx('min-h-[44px] rounded-full px-4 text-sm font-bold', scope === k ? 'bg-saffron text-white' : 'bg-white text-navy shadow-soft')}>{l}</button>)}</div>;
  async function toggleHide() { try { await put('/parent/settings', { hideChild: !hide }); setHide(!hide); useAuth.setState((s) => ({ user: s.user && { ...s.user, hideChild: !hide } })); qc.invalidateQueries({ queryKey: ['lb'] }); toast.ok(!hide ? 'Your child is now hidden' : 'Your child is visible'); } catch { toast.err('Could not save'); } }
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-3 text-3xl font-extrabold text-navy">Leaderboard <Trophy size={34} className="inline" /></h1>{tabs}{scopes}
      {q.isLoading ? <SkeletonList /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : !d.enabled ? <EmptyState title="Leaderboard is switched off" hint="Your Gurukul has paused the leaderboard for now." /> : !d.top.length ? <EmptyState mood="cheer" title="No points yet" hint="Attend class, practise and take tests to earn points!" /> : (
        <>
          <Moved me={d.me} />
          <Card className="bg-gradient-to-b from-sun/20 to-white"><Podium rows={d.podium as Row[]} /></Card>
          <div className="mt-4"><BoardList rows={d.top as Row[]} meId={d.me?.studentId} />
            {d.me && d.me.rank > 10 && <div className="mt-2 space-y-1 border-t-2 border-dashed border-sky/30 pt-2"><BoardList rows={[d.me]} meId={d.me.studentId} start={0} /></div>}
            {d.me && d.me.rank > 1 && <p className="mt-3 text-center font-bold text-saffron">{d.toNext} points to reach #{d.me.rank - 1}</p>}</div>
          {!!d.hallOfFame?.length && <Card className="mt-5"><h2 className="mb-2 font-display text-xl font-bold text-navy">Hall of Fame · last week's champions</h2>{d.hallOfFame.map((r: any) => <p key={r.rank} className="py-1"><Medal place={r.rank} size={22} className="mr-1 inline" /> {r.name} <span className="text-ink/50">· {r.points} pts</span></p>)}</Card>}
        </>
      )}
      <label className="mt-6 flex min-h-[44px] items-center gap-3 rounded-2xl bg-white p-3 shadow-soft"><input type="checkbox" className="h-5 w-5" checked={hide} onChange={toggleHide} /><span><b>Hide my child</b><span className="block text-sm text-ink/60">Shown as "Hidden Champion" to others.</span></span></label>
    </div>
  );
}
