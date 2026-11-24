import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { Card, EmptyState, ErrorState, PageTitle, Skeleton, Stat } from '../../components/ui';

export default function Dashboard() {
  const q = useQuery({ queryKey: ['dash'], queryFn: () => get('/admin/dashboard'), refetchInterval: 60000 });
  if (q.isLoading) return <div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const d = q.data;
  return (
    <div className="space-y-5"><PageTitle title="Dashboard" sub="Today at Krishna Gurukul" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active students" value={d.students} /><Stat label="Today's attendance" value={d.attendancePct === null ? '–' : `${d.attendancePct}%`} tone="green" /><Stat label="Collected this month" value={`₹${d.collected}`} tone="green" sub={`of ₹${d.due} due`} />
        <Stat label="Overdue invoices" value={d.overdue} tone="orange" /><Stat label="New enquiries" value={d.newEnquiries} tone="yellow" /><Stat label="Upcoming tests" value={d.upcomingTests.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><h2 className="mb-2 text-xl font-bold text-navy">Today's follow-ups</h2>{d.followUps.length ? d.followUps.map((e: any) => <Link to="/admin/enquiries" key={e._id} className="flex justify-between border-t border-sky/10 py-2"><span className="font-bold">{e.name}</span><span className={new Date(e.followUpAt) < new Date(new Date().setHours(0, 0, 0, 0)) ? 'font-bold text-red-600' : 'text-ink/60'}>{new Date(e.followUpAt).toLocaleDateString('en-IN')}</span></Link>) : <EmptyState title="No follow-ups due" />}</Card>
        <Card><h2 className="mb-2 text-xl font-bold text-navy">Low attendance (30 days)</h2>{d.lowAttendance.length ? d.lowAttendance.map((s: any) => <Link to={`/admin/students/${s.id}`} key={s.id} className="flex justify-between border-t border-sky/10 py-2"><span className="font-bold">{s.name}</span><span className="font-bold text-red-600">{s.pct}%</span></Link>) : <EmptyState mood="cheer" title="Everyone is regular" />}</Card>
        <Card><h2 className="mb-2 text-xl font-bold text-navy">Upcoming tests</h2>{d.upcomingTests.length ? d.upcomingTests.map((t: any) => <div key={t._id} className="flex justify-between border-t border-sky/10 py-2"><span className="font-bold">{t.title}</span><span className="text-ink/60">closes {new Date(t.closeAt).toLocaleDateString('en-IN')}</span></div>) : <EmptyState title="No open tests" />}</Card>
      </div>
    </div>
  );
}
