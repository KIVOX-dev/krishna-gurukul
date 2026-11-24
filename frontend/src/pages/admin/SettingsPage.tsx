import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { errMsg, get, put } from '../../services/api';
import { toast } from '../../store';
import { Badge, Button, Card, DataTable, ErrorState, Field, Input, PageTitle, Select, Skeleton, cx } from '../../components/ui';

const RULES: [string, string][] = [['testPerTenPercent', 'Test: points per 10% score'], ['starBonus', 'Test: points per star'], ['beatLast', 'Beat your last test'], ['practiceSession', 'Practice session (each)'], ['practiceDailyCap', 'Practice daily cap'], ['dailyGoal', 'Daily goal reached'], ['streak3', '3 day streak'], ['streak7', '7 day streak'], ['streak30', '30 day streak'], ['present', 'Present in class']];

export default function SettingsPage() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['settings'], queryFn: () => get('/admin/settings') });
  const ai = useQuery({ queryKey: ['ai-usage'], queryFn: () => get('/admin/ai/usage') });
  const audit = useQuery({ queryKey: ['audit'], queryFn: () => get('/admin/audit') });
  const [s, setS] = useState<any>(null); const [busy, setBusy] = useState(false); const [tab, setTab] = useState<'general' | 'points' | 'ai' | 'audit'>('general');
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  if (q.isLoading || !s) return <Skeleton className="h-96" />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const save = async () => { setBusy(true); try { await put('/admin/settings', s); toast.ok('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); } };
  const nest = (k: string, kk: string, v: any) => setS({ ...s, [k]: { ...s[k], [kk]: v } });
  return (
    <div><PageTitle title="Settings" right={<Button loading={busy} onClick={save}>Save changes</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">{([['general', 'General'], ['points', 'Point rules'], ['ai', 'AI'], ['audit', 'Audit log']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('min-h-[44px] rounded-full px-5 font-display font-bold', tab === k ? 'bg-navy text-white' : 'bg-white text-navy shadow-soft')}>{l}</button>)}</div>
      {tab === 'general' && <div className="grid gap-4 lg:grid-cols-2"><Card className="space-y-3"><h3 className="text-xl font-bold text-navy">Fee reminders (9 AM IST)</h3>
        <Field label="Days before due date"><Input type="number" value={s.reminderRules.beforeDays} onChange={(e) => nest('reminderRules', 'beforeDays', Number(e.target.value))} /></Field>
        <label className="flex min-h-[44px] items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5" checked={s.reminderRules.onDue} onChange={(e) => nest('reminderRules', 'onDue', e.target.checked)} />Remind on the due date</label>
        <Field label="After due: every N days"><Input type="number" value={s.reminderRules.overdueEvery} onChange={(e) => nest('reminderRules', 'overdueEvery', Number(e.target.value))} /></Field><Field label="Maximum overdue reminders"><Input type="number" value={s.reminderRules.overdueMax} onChange={(e) => nest('reminderRules', 'overdueMax', Number(e.target.value))} /></Field></Card>
        <Card className="space-y-3"><h3 className="text-xl font-bold text-navy">Receipts and leaderboard</h3><Field label="Receipt prefix"><Input value={s.receiptPrefix} onChange={(e) => setS({ ...s, receiptPrefix: e.target.value })} /></Field>
          <label className="flex min-h-[44px] items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5" checked={s.leaderboard.enabled} onChange={(e) => nest('leaderboard', 'enabled', e.target.checked)} />Leaderboard on for everyone</label>
          <Field label="Names on leaderboard"><Select value={s.leaderboard.nameMode} onChange={(e) => nest('leaderboard', 'nameMode', e.target.value)}><option value="full">Full name</option><option value="firstInitial">First name + last initial</option></Select></Field></Card></div>}
      {tab === 'points' && <Card><h3 className="mb-3 text-xl font-bold text-navy">How points are earned</h3><div className="grid gap-3 sm:grid-cols-2">{RULES.map(([k, l]) => <Field key={k} label={l}><Input type="number" value={s.pointRules[k]} onChange={(e) => nest('pointRules', k, Number(e.target.value))} /></Field>)}</div></Card>}
      {tab === 'ai' && <div className="space-y-4"><Card className="space-y-2"><h3 className="text-xl font-bold text-navy">AI features</h3>{([['enabled', 'AI master switch'], ['summaries', 'Parent progress summaries'], ['chatbot', 'Website FAQ chatbot'], ['questions', 'AI question generation'], ['monthlyComments', 'Monthly report comments']] as const).map(([k, l]) => <label key={k} className="flex min-h-[44px] items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5" checked={s.ai[k]} onChange={(e) => nest('ai', k, e.target.checked)} />{l}</label>)}</Card>
        <Card><h3 className="mb-2 text-xl font-bold text-navy">Groq key pool {ai.data && <Badge tone={ai.data.enabled ? 'green' : 'gray'}>{ai.data.enabled ? 'live' : 'mock mode (no keys)'}</Badge>}</h3>{ai.data?.pool?.length ? <DataTable rows={ai.data.pool.map((p: any) => ({ ...p, id: String(p.index) }))} cols={[{ key: 'index', label: 'Key #' }, { key: 'requestsToday', label: 'Requests' }, { key: 'cooling', label: 'Cooling', render: (r) => (r.cooling ? 'Yes' : 'No') }, { key: 'lastError', label: 'Last error', render: (r) => r.lastError ?? '–' }]} /> : <p className="text-ink/60">Add keys to GROQ_API_KEYS to enable AI. Everything works without it using rule-based text.</p>}</Card></div>}
      {tab === 'audit' && (audit.data ? <DataTable rows={audit.data.map((a: any) => ({ ...a, id: a._id }))} cols={[{ key: 'at', label: 'When', render: (r) => new Date(r.at).toLocaleString('en-IN') }, { key: 'userName', label: 'Who', primary: true }, { key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity' }]} /> : <Skeleton className="h-40" />)}
    </div>
  );
}
