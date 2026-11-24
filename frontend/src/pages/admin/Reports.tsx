import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { download, get } from '../../services/api';
import { Button, Card, DataTable, ErrorState, PageTitle, SkeletonList, Stat, cx } from '../../components/ui';

type Tab = 'attendance' | 'fees' | 'tests' | 'enquiries';
export default function Reports() {
  const [tab, setTab] = useState<Tab>('attendance');
  const q = useQuery({ queryKey: ['rep', tab], queryFn: () => get(`/admin/reports/${tab}`) });
  const body = () => {
    if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
    const d = q.data;
    if (tab === 'attendance') return <><Card className="mb-4"><div className="h-56"><ResponsiveContainer><BarChart data={d}><CartesianGrid strokeDasharray="3 3" stroke="#e3eef7" /><XAxis dataKey="batch" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="percent" fill="#2BB88F" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card><DataTable rows={d.map((r: any, i: number) => ({ ...r, id: String(i) }))} cols={[{ key: 'batch', label: 'Batch', primary: true }, { key: 'present', label: 'Present' }, { key: 'total', label: 'Marks' }, { key: 'percent', label: '%' }]} /></>;
    if (tab === 'fees') return <><div className="mb-4 grid grid-cols-2 gap-3"><Stat label="Collected" value={`₹${d.collected}`} tone="green" /><Stat label="Outstanding" value={`₹${d.outstanding}`} tone="orange" /></div><DataTable rows={d.rows.map((r: any, i: number) => ({ ...r, id: String(i) }))} cols={[{ key: 'student', label: 'Student', primary: true }, { key: 'period', label: 'Period' }, { key: 'total', label: 'Total' }, { key: 'paid', label: 'Paid' }, { key: 'balance', label: 'Balance' }, { key: 'status', label: 'Status' }]} /></>;
    if (tab === 'tests') return <DataTable rows={d.map((r: any, i: number) => ({ ...r, id: String(i) }))} cols={[{ key: 'student', label: 'Student', primary: true }, { key: 'test', label: 'Test' }, { key: 'score', label: 'Score', sort: (a, b) => a.score - b.score, render: (r) => `${r.score}%` }, { key: 'stars', label: 'Stars' }, { key: 'minutes', label: 'Minutes' }]} />;
    return <div className="space-y-4"><div className="grid grid-cols-3 gap-3"><Stat label="Enquiries" value={d.total} /><Stat label="Joined" value={d.joined} tone="green" /><Stat label="Conversion" value={`${d.conversion}%`} tone="orange" /></div>
      <Card><h3 className="mb-2 font-bold text-navy">Enquiries per week</h3><div className="h-48"><ResponsiveContainer><BarChart data={d.perWeek}><XAxis dataKey="week" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="n" fill="#EC6206" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <div className="grid gap-4 md:grid-cols-2"><Card><h3 className="mb-2 font-bold text-navy">Top courses asked</h3>{d.topCourses.map((c: any) => <p key={c.name} className="flex justify-between border-t border-sky/10 py-1"><span>{c.name}</span><b>{c.n}</b></p>)}</Card><Card><h3 className="mb-2 font-bold text-navy">Top sources</h3>{d.topSources.map((c: any) => <p key={c.name} className="flex justify-between border-t border-sky/10 py-1"><span>{c.name}</span><b>{c.n}</b></p>)}</Card></div></div>;
  };
  return (
    <div><PageTitle title="Reports" right={<div className="flex gap-2 print:hidden">{tab !== 'enquiries' && <Button variant="ghost" onClick={() => download(`/admin/reports/${tab}?format=xlsx`, `${tab}.xlsx`)}><Download size={16} />Excel</Button>}<Button variant="ghost" onClick={() => window.print()}><Printer size={16} />PDF / Print</Button></div>} />
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">{(['attendance', 'fees', 'tests', 'enquiries'] as Tab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={cx('min-h-[44px] rounded-full px-5 font-display font-bold capitalize', tab === t ? 'bg-navy text-white' : 'bg-white text-navy shadow-soft')}>{t}</button>)}</div>{body()}</div>
  );
}
