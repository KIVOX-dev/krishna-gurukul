import { useQuery } from '@tanstack/react-query';
import { Stars } from '../../components/icons';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock } from 'lucide-react';
import { get } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { Card, EmptyState, ErrorState, SkeletonList } from '../../components/ui';

export default function ParentTests() {
  const { id } = useKid();
  const q = useQuery({ queryKey: ['ptests', id], queryFn: () => get(`/parent/children/${id}/tests`), enabled: !!id });
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const { pending, results } = q.data;
  const trend = [...results].reverse().map((r: any, i: number) => ({ n: i + 1, score: r.score }));
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-extrabold text-navy">Abacus tests</h1>
      <section><h2 className="mb-2 text-xl font-bold text-navy">To do</h2>
        {pending.length ? <div className="space-y-3">{pending.map((t: any) => <Card key={t._id} className="flex items-center justify-between gap-3"><div><p className="font-display text-xl font-bold text-navy">{t.title}</p><p className="flex items-center gap-1 text-sm text-ink/60"><Clock size={14} />{t.settings.questionCount} questions · {Math.round(t.settings.timeLimit / 60)} min{t.closeAt && ` · closes ${new Date(t.closeAt).toLocaleDateString('en-IN')}`}</p></div><Link to={`/parent/tests/${t._id}/play`} className="btn-primary btn-sm btn">Start</Link></Card>)}</div> : <EmptyState mood="cheer" title="All caught up!" hint="New tests from your teacher will show up here." />}</section>
      {trend.length > 1 && <Card><h2 className="mb-2 text-xl font-bold text-navy">Score trend</h2><div className="h-48"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#e3eef7" /><XAxis dataKey="n" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#EC6206" strokeWidth={3} dot={{ r: 5, fill: '#FFA723' }} /></LineChart></ResponsiveContainer></div></Card>}
      <section><h2 className="mb-2 text-xl font-bold text-navy">Results</h2>
        {results.length ? <div className="space-y-3">{results.map((r: any) => <Link key={r.id} to={`/parent/results/${r.id}`} state={{ fresh: false }}><Card className="mb-3 transition hover:-translate-y-0.5"><div className="flex items-center justify-between"><p className="font-display text-xl font-bold text-navy">{r.title}</p><p className="font-display text-3xl font-extrabold text-saffron">{r.score}%</p></div><p className="text-sm text-ink/60"><Stars n={r.stars} /> · {new Date(r.at).toLocaleDateString('en-IN')} · {Math.round(r.durationMs / 1000)}s</p>{r.summary && <p className="mt-1 text-sm">{r.summary}</p>}</Card></Link>)}</div> : <EmptyState title="No results yet" hint="Complete a test to see the animated result here." />}</section>
    </div>
  );
}
