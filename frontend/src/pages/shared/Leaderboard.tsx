import { useState } from 'react';
import { Trophy } from '../../components/icons';
import { useQuery } from '@tanstack/react-query';
import { Maximize2, X } from 'lucide-react';
import { LEVEL_PRESETS } from '@kg/shared';
import { get, post } from '../../services/api';
import { useAuth, toast } from '../../store';
import { BoardList, Podium, type Row } from '../../components/Leaderboard';
import { Button, Card, EmptyState, Field, Input, Modal, PageTitle, Select, SkeletonList, cx } from '../../components/ui';

/** Admin + Faculty: all levels, batches, tabs, per-test boards, Class TV mode. Admin can add bonus points. */
export default function Leaderboard() {
  const role = useAuth((s) => s.user?.role);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week'); const [scope, setScope] = useState<'all' | 'level' | 'batch'>('all');
  const [level, setLevel] = useState(1); const [batchId, setBatchId] = useState(''); const [testId, setTestId] = useState(''); const [tv, setTv] = useState(false); const [bonus, setBonus] = useState(false);
  const batches = useQuery({ queryKey: ['fbatches'], queryFn: () => get('/faculty/batches') });
  const tests = useQuery({ queryKey: ['btests'], queryFn: () => get('/faculty/board/tests') });
  const overall = useQuery({ queryKey: ['board', period, scope, level, batchId], queryFn: () => get('/faculty/board/overall', { period, scope, level, batchId }), enabled: !testId && (scope !== 'batch' || !!batchId), refetchInterval: 20000 });
  const tb = useQuery({ queryKey: ['tboard', testId], queryFn: () => get(`/faculty/board/test/${testId}`), enabled: !!testId, refetchInterval: 10000 });
  const rows: any[] = (testId ? tb.data : overall.data) ?? [];
  const score = testId ? (r: any) => `${r.score}% · ${Math.round(r.durationMs / 1000)}s` : undefined;
  const board = (big?: boolean) => (rows.length ? <><div className={cx(big && 'scale-125 py-6')}><Podium rows={rows.slice(0, 3) as Row[]} score={score} /></div><div className={cx('mt-4', big && 'text-xl')}><BoardList rows={rows as Row[]} score={score} /></div></> : <EmptyState mood="cheer" title="No scores yet" hint="Points and test submissions appear here instantly." />);
  return (
    <div>
      <PageTitle title="Leaderboard" sub="Ranked by points, effort counts as much as talent" right={<div className="flex gap-2">{role === 'admin' && <Button variant="sun" small onClick={() => setBonus(true)}>Bonus points</Button>}<Button small onClick={() => setTv(true)}><Maximize2 size={16} />Class TV</Button></div>} />
      <Card className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Board"><Select value={testId} onChange={(e) => setTestId(e.target.value)}><option value="">Overall points</option>{(tests.data ?? []).map((t: any) => <option key={t._id} value={t._id}>Test: {t.title}</option>)}</Select></Field>
        {!testId && <><Field label="Period"><Select value={period} onChange={(e) => setPeriod(e.target.value as any)}><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option></Select></Field>
          <Field label="Scope"><Select value={scope} onChange={(e) => setScope(e.target.value as any)}><option value="all">Whole Gurukul</option><option value="level">By level</option><option value="batch">By batch</option></Select></Field>
          {scope === 'level' && <Field label="Level"><Select value={level} onChange={(e) => setLevel(Number(e.target.value))}>{LEVEL_PRESETS.map((l) => <option key={l.level} value={l.level}>{l.name}</option>)}</Select></Field>}
          {scope === 'batch' && <Field label="Batch"><Select value={batchId} onChange={(e) => setBatchId(e.target.value)}><option value="">Select</option>{(batches.data ?? []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}</Select></Field>}</>}
      </Card>
      {(testId ? tb.isLoading : overall.isLoading) ? <SkeletonList /> : board()}
      {tv && <div className="fixed inset-0 z-[110] overflow-y-auto bg-gradient-to-br from-navy to-sky p-8"><button aria-label="Exit Class TV" onClick={() => setTv(false)} className="fixed right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white"><X /></button><h1 className="mb-4 text-center font-display text-6xl font-extrabold text-white"><Trophy size={64} className="mr-3 inline" /> Krishna Gurukul Champions</h1><div className="mx-auto max-w-4xl rounded-chunk bg-white/95 p-6">{board(true)}</div></div>}
      <BonusModal open={bonus} onClose={() => setBonus(false)} />
    </div>
  );
}

function BonusModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const students = useQuery({ queryKey: ['allstudents'], queryFn: () => get('/admin/students'), enabled: open });
  const [studentId, setS] = useState(''); const [points, setP] = useState('5'); const [reason, setR] = useState('');
  async function go() { try { await post('/admin/bonus-points', { studentId, points: Number(points), reason }); toast.ok('Bonus points added'); onClose(); } catch (e: any) { toast.err(e?.response?.data?.error ?? 'Failed'); } }
  return <Modal open={open} onClose={onClose} title="Bonus points"><div className="space-y-3"><Field label="Student"><Select value={studentId} onChange={(e) => setS(e.target.value)}><option value="">Select</option>{(students.data ?? []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select></Field><Field label="Points"><Input type="number" value={points} onChange={(e) => setP(e.target.value)} /></Field><Field label="Reason"><Input value={reason} onChange={(e) => setR(e.target.value)} placeholder="Competition winner" /></Field><Button className="w-full" disabled={!studentId || reason.length < 2} onClick={go}>Add points</Button></div></Modal>;
}
