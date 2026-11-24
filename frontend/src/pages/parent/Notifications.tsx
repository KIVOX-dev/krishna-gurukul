import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { get } from '../../services/api';
import { Card, EmptyState, ErrorState, SkeletonList } from '../../components/ui';

export default function Notifications() {
  const q = useQuery({ queryKey: ['notifs'], queryFn: () => get('/parent/notifications') });
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  return (
    <div className="mx-auto max-w-2xl space-y-3"><h1 className="text-3xl font-extrabold text-navy">Notifications</h1>
      {q.data.length ? q.data.map((n: any) => <Card key={n._id} className="flex gap-3"><Bell className="mt-1 shrink-0 text-saffron" /><div><p className="font-bold text-navy">{n.subject ?? n.template}</p><p className="text-xs text-ink/50">{new Date(n.createdAt).toLocaleString('en-IN')}</p></div></Card>) : <EmptyState title="No notifications yet" hint="Fee reminders, results and absence alerts appear here." />}
    </div>
  );
}
