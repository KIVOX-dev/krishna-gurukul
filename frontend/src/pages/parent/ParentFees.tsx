import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { get } from '../../services/api';
import { useKid } from '../../hooks/useKid';
import { Badge, Card, EmptyState, ErrorState, SkeletonList, statusTone } from '../../components/ui';
import { toast } from '../../store';

export default function ParentFees() {
  const { id } = useKid(); const q = useQuery({ queryKey: ['pfees', id], queryFn: () => get(`/parent/children/${id}/fees`), enabled: !!id });
  const rec = async (inv: string) => { try { const r = await get(`/parent/children/${id}/fees/${inv}/receipt`); window.open(r.url, '_blank'); } catch { toast.err('Receipt not available'); } };
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const rows: any[] = q.data; const due = rows.reduce((a, r) => a + r.balance, 0);
  return (
    <div className="mx-auto max-w-2xl space-y-4"><h1 className="text-3xl font-extrabold text-navy">Fees</h1>
      <Card className="text-center"><p className="text-xs font-extrabold uppercase text-ink/50">Total pending</p><p className={`font-display text-5xl font-extrabold ${due ? 'text-saffron' : 'text-mint'}`}>₹{due}</p></Card>
      {rows.length ? rows.map((r) => <Card key={r._id}><div className="flex items-start justify-between"><div><p className="font-display text-xl font-bold text-navy">{r.planId?.name ?? 'Fee'} · {r.period}</p><p className="text-sm text-ink/60">Due {new Date(r.dueDate).toLocaleDateString('en-IN')}</p></div><Badge tone={statusTone(r.status)}>{r.status}</Badge></div>
        <p className="mt-2">Total ₹{r.total} · Paid ₹{r.paid} · <b>Balance ₹{r.balance}</b></p>
        {r.payments?.length > 0 && <ul className="mt-2 space-y-1 text-sm text-ink/70">{r.payments.map((p: any, i: number) => <li key={i}>₹{p.amount} via {p.mode} on {new Date(p.date).toLocaleDateString('en-IN')}</li>)}</ul>}
        {r.receiptUrl && <button onClick={() => rec(r._id)} className="btn-ghost btn-sm btn mt-3"><Download size={16} />Receipt</button>}</Card>) : <EmptyState title="No invoices yet" />}
    </div>
  );
}
