import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { get } from '../../services/api';
import { Badge, Card, EmptyState, ErrorState, PageTitle, SkeletonList } from '../../components/ui';

export default function FacultyDashboard() {
  const q = useQuery({ queryKey: ['fbatches'], queryFn: () => get('/faculty/batches') });
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const rows: any[] = q.data;
  return (
    <div><PageTitle title="My classes" sub="Today's classes first" />
      {rows.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((b) => (
        <Card key={b._id} className={b.today ? 'ring-2 ring-saffron' : ''}>
          <div className="flex items-start justify-between"><h3 className="text-xl font-extrabold text-navy">{b.name}</h3>{b.today && <Badge tone="orange">Today</Badge>}</div>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink/70"><Clock size={14} />{b.days.join(', ')} · {b.startTime}–{b.endTime}</p>
          <p className="flex items-center gap-1 text-sm text-ink/70"><Users size={14} />{b.studentIds.length}/{b.capacity} students</p>
          <div className="mt-3 flex flex-wrap gap-2"><Link to={`/faculty/attendance/${b._id}`} className="btn-primary btn-sm btn">{b.markedToday ? 'Edit attendance' : 'Mark attendance'}</Link></div>
          <div className="mt-3 flex flex-wrap gap-1">{b.studentIds.slice(0, 6).map((s: any) => <Link key={s._id} to={`/faculty/students/${s._id}`} className="chip bg-sky/10 text-navy">{s.name.split(' ')[0]}</Link>)}</div>
        </Card>))}</div> : <EmptyState title="No batches assigned" hint="The admin will assign batches to you." />}
    </div>
  );
}
