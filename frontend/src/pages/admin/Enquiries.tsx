import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, MessageCircle, Phone, UserCheck } from 'lucide-react';
import { download, errMsg, get, post, put } from '../../services/api';
import { toast } from '../../store';
import { useDevice } from '../../hooks';
import { Badge, Button, Card, ErrorState, Field, Input, Modal, PageTitle, Select, SkeletonList, Stat, statusTone } from '../../components/ui';
import { EnquiryKanban, STAGES } from '../../components/enquiry';

export default function Enquiries() {
  const { isDesktop } = useDevice(); const qc = useQueryClient();
  const [f, setF] = useState({ q: '', stage: '', course: '', source: '' }); const [open, setOpen] = useState<any>(null); const [note, setNote] = useState('');
  const q = useQuery({ queryKey: ['enq', f], queryFn: () => get('/admin/enquiries', { ...f }) });
  const rep = useQuery({ queryKey: ['enq-rep'], queryFn: () => get('/admin/reports/enquiries') });
  const batches = useQuery({ queryKey: ['batches-a'], queryFn: () => get('/admin/batches') });
  const courses = useQuery({ queryKey: ['courses-a'], queryFn: () => get('/admin/courses') });
  const [demo, setDemo] = useState({ batchId: '', date: '' });
  useEffect(() => { post('/admin/enquiries/mark-seen').then(() => qc.invalidateQueries({ queryKey: ['enq-badge'] })).catch(() => {}); }, [qc]);
  const reload = () => { qc.invalidateQueries({ queryKey: ['enq'] }); qc.invalidateQueries({ queryKey: ['enq-rep'] }); };
  const cur = (q.data ?? []).find((e: any) => e._id === open?._id) ?? open;
  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast.ok(ok); reload(); } catch (e) { toast.err(errMsg(e)); } };
  const move = (id: string, stage: string) => act(() => put(`/admin/enquiries/${id}`, { stage }), `Moved to ${stage}`);
  const wa = (e: any) => `https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hi ${e.name}, this is Krishna Gurukul.`)}`;
  return (
    <div>
      <PageTitle title="Enquiries" sub="Mini CRM: from first call to joined" right={<Button variant="ghost" onClick={() => download('/admin/enquiries.xlsx', 'enquiries.xlsx')}><Download size={16} />Excel</Button>} />
      {rep.data && <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Total" value={rep.data.total} /><Stat label="Joined" value={rep.data.joined} tone="green" /><Stat label="Conversion" value={`${rep.data.conversion}%`} tone="orange" /><Stat label="Top course" value={rep.data.topCourses[0]?.name ?? '–'} tone="yellow" sub={`Top source: ${rep.data.topSources[0]?.name ?? '–'}`} /></div>}
      <Card className="mb-4 grid gap-3 sm:grid-cols-4"><Input placeholder="Search name or phone" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search" />
        <Select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}><option value="">All stages</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })}><option value="">All courses</option>{(courses.data ?? []).map((c: any) => <option key={c._id}>{c.name}</option>)}</Select>
        <Input placeholder="Source" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} aria-label="Source" /></Card>
      {q.isLoading ? <SkeletonList /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : isDesktop && !f.stage ? <EnquiryKanban rows={q.data} onMove={move} onOpen={setOpen} /> : (
        <div className="space-y-3">{q.data.map((e: any) => <Card key={e._id} onClick={() => setOpen(e)} className="cursor-pointer"><div className="flex items-center justify-between"><p className="font-display text-xl font-bold text-navy">{e.name}</p><Badge tone={statusTone(e.stage)}>{e.stage}</Badge></div><p className="text-sm text-ink/60">{e.childName} · {(e.courses ?? []).join(', ')} · {new Date(e.createdAt).toLocaleDateString('en-IN')}</p><div className="mt-2 flex gap-2" onClick={(x) => x.stopPropagation()}><a className="btn-blue btn-sm btn" href={`tel:${e.phone}`}><Phone size={16} />Call</a><a className="btn btn-sm bg-[#25D366] text-white" href={wa(e)} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a></div></Card>)}</div>
      )}
      <Modal open={!!cur} onClose={() => setOpen(null)} title={cur?.name ?? ''} wide>
        {cur && <div className="space-y-4">
          <div className="flex flex-wrap gap-2"><a className="btn-blue btn-sm btn" href={`tel:${cur.phone}`}><Phone size={16} />{cur.phone}</a><a className="btn btn-sm bg-[#25D366] text-white" href={wa(cur)} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>{!cur.convertedStudentId && <Button small variant="sun" onClick={() => act(async () => { const r = await post(`/admin/enquiries/${cur._id}/convert`); toast.info(`Parent login: ${r.parent.email}`); }, 'Converted to student')}><UserCheck size={16} />Convert to student</Button>}</div>
          <p className="text-sm">{cur.childName} ({cur.childAge}) · {(cur.courses ?? []).join(', ')} · prefers {cur.preferredTime || 'any'} · via {cur.source}{cur.message && <><br />“{cur.message}”</>}</p>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Stage"><Select value={cur.stage} onChange={(e) => move(cur._id, e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</Select></Field><Field label="Follow-up date"><Input type="date" value={cur.followUpAt?.slice(0, 10) ?? ''} onChange={(e) => act(() => put(`/admin/enquiries/${cur._id}`, { followUpAt: e.target.value || null }), 'Follow-up set')} /></Field></div>
          <Card className="bg-sky/5"><h4 className="mb-2 font-bold text-navy">Book a demo</h4><div className="grid gap-2 sm:grid-cols-3"><Select value={demo.batchId} onChange={(e) => setDemo({ ...demo, batchId: e.target.value })}><option value="">Batch</option>{(batches.data ?? []).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}</Select><Input type="date" value={demo.date} onChange={(e) => setDemo({ ...demo, date: e.target.value })} /><Button small disabled={!demo.batchId || !demo.date} onClick={() => act(() => post(`/admin/enquiries/${cur._id}/demo`, demo), 'Demo booked, confirmation emailed')}>Book</Button></div></Card>
          <div><h4 className="mb-2 font-bold text-navy">Notes timeline</h4><div className="mb-2 flex gap-2"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called, will visit Saturday" /><Button small disabled={!note} onClick={() => act(async () => { await post(`/admin/enquiries/${cur._id}/notes`, { text: note }); setNote(''); }, 'Note added')}>Add</Button></div>
            <ul className="space-y-1">{[...(cur.notes ?? [])].reverse().map((n: any, i: number) => <li key={i} className="rounded-xl bg-white p-2 text-sm shadow-soft"><b>{n.by}</b> · <span className="text-ink/50">{new Date(n.at).toLocaleString('en-IN')}</span><br />{n.text}</li>)}</ul></div>
        </div>}
      </Modal>
    </div>
  );
}
