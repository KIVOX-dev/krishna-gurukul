import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Download, Receipt, Wallet } from 'lucide-react';
import { download, errMsg, get, post } from '../../services/api';
import { toast } from '../../store';
import { Badge, Button, DataTable, ErrorState, Field, Input, Modal, PageTitle, Select, SkeletonList, statusTone, cx } from '../../components/ui';
import { ResourcePage } from '../../components/ResourcePage';

function Invoices() {
  const qc = useQueryClient(); const [status, setStatus] = useState(''); const [pay, setPay] = useState<any>(null); const [amount, setAmount] = useState(''); const [mode, setMode] = useState('cash'); const [ref, setRef] = useState(''); const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['invoices', status], queryFn: () => get('/admin/fees/invoices', { status: status || undefined }) });
  const reload = () => qc.invalidateQueries({ queryKey: ['invoices'] });
  const run = async (fn: () => Promise<any>, ok: string) => { setBusy(true); try { const r = await fn(); toast.ok(typeof ok === 'string' ? ok : ''); reload(); return r; } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); } };
  async function receipt(id: string) { try { const r = await get(`/admin/fees/invoices/${id}/receipt`); window.open(r.url, '_blank'); } catch { toast.err('No receipt yet'); } }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto"><option value="">All invoices</option>{['due', 'partial', 'paid', 'overdue'].map((s) => <option key={s}>{s}</option>)}</Select>
        <Button variant="blue" loading={busy} onClick={() => run(() => post('/admin/fees/generate'), 'Invoices generated for this cycle')}>Generate invoices</Button>
        <Button variant="sun" loading={busy} onClick={() => run(async () => { const r = await post('/admin/fees/remind-bulk'); toast.info(`${r.sent} reminders sent`); }, 'Done')}><Bell size={16} />Remind all overdue</Button>
        <Button variant="ghost" onClick={() => download('/admin/fees/defaulters.xlsx', 'defaulters.xlsx')}><Download size={16} />Defaulters Excel</Button>
      </div>
      {q.isLoading ? <SkeletonList /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : (
        <DataTable rows={q.data} cols={[
          { key: 's', label: 'Student', primary: true, render: (r) => r.studentId?.name }, { key: 'period', label: 'Period' }, { key: 'total', label: 'Total', render: (r) => `₹${r.total}` }, { key: 'paid', label: 'Paid', hideMobile: true, render: (r) => `₹${r.paid}` },
          { key: 'balance', label: 'Balance', render: (r) => <b className={cx(r.balance && 'text-saffron')}>₹{r.balance}</b> }, { key: 'due', label: 'Due', hideMobile: true, render: (r) => new Date(r.dueDate).toLocaleDateString('en-IN') }, { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> }]}
          actions={(r) => <>{r.balance > 0 && <Button small onClick={() => { setPay(r); setAmount(String(r.balance)); }}><Wallet size={16} />Pay</Button>}{r.balance > 0 && <Button small variant="ghost" onClick={() => run(() => post(`/admin/fees/invoices/${r._id}/remind`), 'Reminder sent')}><Bell size={16} /></Button>}{r.receiptUrl && <Button small variant="ghost" onClick={() => receipt(r._id)}><Receipt size={16} /></Button>}</>} />
      )}
      <Modal open={!!pay} onClose={() => setPay(null)} title={`Record payment · ${pay?.studentId?.name ?? ''}`}>
        <div className="space-y-3"><p>Balance ₹{pay?.balance}. Partial payments are fine.</p><Field label="Amount (₹)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Mode"><Select value={mode} onChange={(e) => setMode(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option></Select></Field><Field label="Reference (optional)"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI txn id" /></Field>
          <Button className="w-full" loading={busy} onClick={async () => { await run(() => post(`/admin/fees/invoices/${pay._id}/pay`, { amount: Number(amount), mode, ref: ref || undefined }), 'Payment recorded. Receipt emailed.'); setPay(null); }}>Save payment</Button></div>
      </Modal>
    </div>
  );
}

export default function Fees() {
  const [tab, setTab] = useState<'inv' | 'plans'>('inv'); const courses = useQuery({ queryKey: ['courses-a'], queryFn: () => get('/admin/courses') });
  return (
    <div><div className="mb-4 flex gap-2">{([['inv', 'Invoices'], ['plans', 'Fee plans']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('min-h-[44px] rounded-full px-5 font-display font-bold', tab === k ? 'bg-navy text-white' : 'bg-white text-navy shadow-soft')}>{l}</button>)}</div>
      {tab === 'inv' ? (<><PageTitle title="Fees" sub="Invoices, payments, receipts, reminders" /><Invoices /></>) : (
        <ResourcePage title="Fee plans" sub="One plan per course; invoices generate each cycle" endpoint="/admin/fees/plans" canDelete defaults={{ cycle: 'monthly', dueDay: 5, lateFee: 0 }}
          cols={[{ key: 'name', label: 'Plan', primary: true }, { key: 'course', label: 'Course', render: (r) => r.courseId?.name }, { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` }, { key: 'cycle', label: 'Cycle' }, { key: 'dueDay', label: 'Due day' }, { key: 'lateFee', label: 'Late fee', render: (r) => `₹${r.lateFee}` }]}
          fields={[{ key: 'name', label: 'Plan name', required: true }, { key: 'courseId', label: 'Course', type: 'select', required: true, options: (courses.data ?? []).map((c: any) => ({ value: c._id, label: c.name })) }, { key: 'amount', label: 'Amount (₹)', type: 'number', required: true }, { key: 'cycle', label: 'Cycle', type: 'select', options: ['monthly', 'quarterly', 'term', 'one-time'].map((v) => ({ value: v, label: v })) }, { key: 'dueDay', label: 'Due day of month', type: 'number' }, { key: 'lateFee', label: 'Late fee (₹)', type: 'number' }]}
          toForm={(r) => ({ ...r, courseId: r.courseId?._id })} toPayload={(f) => ({ name: f.name, courseId: f.courseId, amount: Number(f.amount), cycle: f.cycle, dueDay: Number(f.dueDay) || 5, lateFee: Number(f.lateFee) || 0 })} />
      )}
    </div>
  );
}
