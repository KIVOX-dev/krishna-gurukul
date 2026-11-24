import { useState } from 'react';
import { Stars } from '../../components/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { del, errMsg, get, post } from '../../services/api';
import { toast } from '../../store';
import { Badge, Button, Card, DataTable, EmptyState, ErrorState, Field, Input, Modal, PageTitle, Select, SkeletonList } from '../../components/ui';

/** Test builder + list + results. Grading is automatic on the server when a student submits. */
export default function Tests() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['atests'], queryFn: () => get('/admin/tests') });
  const presets = useQuery({ queryKey: ['presets'], queryFn: () => get('/admin/tests/presets') });
  const batches = useQuery({ queryKey: ['batches-a'], queryFn: () => get('/admin/batches') });
  const [build, setBuild] = useState(false); const [res, setRes] = useState<any>(null); const [busy, setBusy] = useState(false);
  const [f, setF] = useState<any>({ title: '', level: 1, batchIds: [] as string[], timeLimit: 300, questionCount: 10, digits: 1, rows: 3, operations: '+', publishAt: '', closeAt: '', useAi: false });
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const pickLevel = (l: number) => { const p = presets.data?.find((x: any) => x.level === l)?.settings; setF((s: any) => ({ ...s, level: l, ...(p ? { timeLimit: p.timeLimit, questionCount: p.questionCount, digits: p.digits, rows: p.rows, operations: p.operations } : {}) })); };

  async function create() {
    setBusy(true);
    try {
      const r = await post('/admin/tests', { title: f.title, level: Number(f.level), batchIds: f.batchIds, type: 'assigned', useAi: f.useAi, publishAt: f.publishAt ? new Date(f.publishAt).toISOString() : undefined, closeAt: f.closeAt ? new Date(f.closeAt).toISOString() : undefined, settings: { timeLimit: Number(f.timeLimit), questionCount: Number(f.questionCount), digits: Number(f.digits), rows: Number(f.rows), operations: f.operations } });
      toast.ok(`Test created with ${r.questionCount} questions (${r.source === 'ai' ? 'AI generated' : 'built-in engine'})`); setBuild(false); qc.invalidateQueries({ queryKey: ['atests'] });
    } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); }
  }
  async function results(t: any) { try { setRes({ t, ...(await get(`/admin/tests/${t._id}/results`)) }); } catch (e) { toast.err(errMsg(e)); } }
  return (
    <div>
      <PageTitle title="Abacus tests" sub="Auto graded the moment a student submits" right={<Button onClick={() => setBuild(true)}><Plus size={18} />New test</Button>} />
      {q.isLoading ? <SkeletonList /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : !q.data.length ? <EmptyState title="No tests yet" hint="Create one and assign it to batches." mood="cheer" /> : (
        <DataTable rows={q.data} cols={[{ key: 'title', label: 'Test', primary: true }, { key: 'level', label: 'Level', render: (r) => <Badge>L{r.level}</Badge> }, { key: 'batches', label: 'Batches', render: (r) => (r.batchIds ?? []).map((b: any) => b.name).join(', ') || 'Whole level' }, { key: 'src', label: 'Source', hideMobile: true, render: (r) => (r.source === 'ai' ? <Badge tone="orange">AI</Badge> : <Badge>Engine</Badge>) }, { key: 'sub', label: 'Submitted', render: (r) => `${r.submissions} · avg ${r.avgScore}%` }, { key: 'close', label: 'Closes', hideMobile: true, render: (r) => (r.closeAt ? new Date(r.closeAt).toLocaleDateString('en-IN') : '–') }]}
          actions={(r) => <><Button small variant="blue" onClick={() => results(r)}><BarChart2 size={16} />Results</Button><Button small variant="ghost" aria-label="Delete" onClick={async () => { if (!confirm('Delete this test and its results?')) return; await del(`/admin/tests/${r._id}`); qc.invalidateQueries({ queryKey: ['atests'] }); }}><Trash2 size={16} /></Button></>} />
      )}
      <Modal open={build} onClose={() => setBuild(false)} title="Test builder" wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title"><Input value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Level (fills sensible defaults)"><Select value={f.level} onChange={(e) => pickLevel(Number(e.target.value))}>{(presets.data ?? []).map((p: any) => <option key={p.level} value={p.level}>{p.name}</option>)}</Select></Field>
          <Field label="Questions"><Input type="number" value={f.questionCount} onChange={(e) => set('questionCount', e.target.value)} /></Field><Field label="Time limit (seconds, 0 = none)"><Input type="number" value={f.timeLimit} onChange={(e) => set('timeLimit', e.target.value)} /></Field>
          <Field label="Digits (1–5)"><Input type="number" min={1} max={5} value={f.digits} onChange={(e) => set('digits', e.target.value)} /></Field><Field label="Rows (2–15)"><Input type="number" min={2} max={15} value={f.rows} onChange={(e) => set('rows', e.target.value)} /></Field>
          <Field label="Operations"><Select value={f.operations} onChange={(e) => set('operations', e.target.value)}>{[['+', 'Addition'], ['-', 'Subtraction'], ['mixed', 'Mixed + −'], ['x', 'Multiplication'], ['/', 'Division']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <label className="flex min-h-[48px] items-center gap-2 self-end font-bold text-navy"><input type="checkbox" className="h-5 w-5" checked={f.useAi} onChange={(e) => set('useAi', e.target.checked)} /><Sparkles size={16} className="text-saffron" />Generate questions with AI (once, saved)</label>
          <Field label="Opens at"><Input type="datetime-local" value={f.publishAt} onChange={(e) => set('publishAt', e.target.value)} /></Field><Field label="Closes at"><Input type="datetime-local" value={f.closeAt} onChange={(e) => set('closeAt', e.target.value)} /></Field>
          <div className="sm:col-span-2"><span className="label">Assign to batches (empty = everyone at this level)</span><div className="flex flex-wrap gap-2">{(batches.data ?? []).map((b: any) => { const on = f.batchIds.includes(b._id); return <button type="button" key={b._id} onClick={() => set('batchIds', on ? f.batchIds.filter((x: string) => x !== b._id) : [...f.batchIds, b._id])} className={`min-h-[44px] rounded-full border-2 px-3 text-sm font-bold ${on ? 'border-saffron bg-saffron text-white' : 'border-navy/15 text-navy'}`}>{b.name}</button>; })}</div></div>
          <Button className="sm:col-span-2" loading={busy} disabled={f.title.length < 2} onClick={create}>Create test</Button>
        </div>
      </Modal>
      <Modal open={!!res} onClose={() => setRes(null)} title={res?.title ?? ''} wide>
        {res && <div className="space-y-4"><Card><h4 className="mb-2 font-bold text-navy">Per question accuracy</h4><div className="h-44"><ResponsiveContainer><BarChart data={res.perQuestion}><XAxis dataKey="q" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="accuracy" fill="#2F8EE0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
          {res.attempts.length ? <DataTable rows={res.attempts.map((a: any) => ({ ...a, _id: a.id }))} cols={[{ key: 'student', label: 'Student', primary: true }, { key: 'score', label: 'Score', sort: (a, b) => a.score - b.score, render: (r) => <b>{r.score}% <Stars n={r.stars} /></b> }, { key: 't', label: 'Time', render: (r) => `${Math.round(r.durationMs / 1000)}s` }, { key: 'remark', label: 'Remark', render: (r) => r.remark ?? '–' }]} /> : <EmptyState title="No submissions yet" />}</div>}
      </Modal>
    </div>
  );
}
