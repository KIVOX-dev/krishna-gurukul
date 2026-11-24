import { useParams } from 'react-router-dom';
import { Flame } from '../../components/icons';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../../services/api';
import { Card, ErrorState, PageTitle, Skeleton, Stat } from '../../components/ui';

export default function StudentProfile() {
  const { id } = useParams(); const q = useQuery({ queryKey: ['sprofile', id], queryFn: () => get(`/faculty/students/${id}`) });
  if (q.isLoading) return <Skeleton className="h-96" />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const { student: s, attendance, trend, practice } = q.data;
  const days = practice.reduce((m: Record<string, number>, p: any) => ((m[p.day] = (m[p.day] ?? 0) + 1), m), {}); const act = Object.entries(days).sort().map(([d, n]) => ({ d: d.slice(5), n }));
  return (
    <div className="space-y-4"><PageTitle title={s.name} sub={`Admission ${s.admissionNo ?? '-'} · Abacus level ${s.abacusLevel}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Attendance" value={`${attendance.percent}%`} tone="green" /><Stat label="Tests taken" value={trend.length} /><Stat label="Streak" value={<span className="inline-flex items-center gap-1">{s.streak ?? 0}<Flame size={26} /></span>} tone="orange" /><Stat label="Practice sessions" value={practice.length} tone="yellow" /></div>
      <Card><h2 className="mb-2 text-xl font-bold text-navy">Test trend</h2>{trend.length ? <div className="h-56"><ResponsiveContainer><LineChart data={trend.map((t: any, i: number) => ({ ...t, n: i + 1 }))}><CartesianGrid strokeDasharray="3 3" stroke="#e3eef7" /><XAxis dataKey="n" /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="score" stroke="#EC6206" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <p className="text-ink/60">No tests yet.</p>}</Card>
      <Card><h2 className="mb-2 text-xl font-bold text-navy">Practice activity</h2>{act.length ? <div className="h-48"><ResponsiveContainer><BarChart data={act}><XAxis dataKey="d" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="n" fill="#2F8EE0" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="text-ink/60">No practice yet.</p>}</Card>
    </div>
  );
}
