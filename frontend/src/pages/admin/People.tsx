import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, FileUp, IdCard, TrendingUp } from 'lucide-react';
import { download, errMsg, get, post } from '../../services/api';
import { toast } from '../../store';
import { Badge, Button, statusTone } from '../../components/ui';
import { ResourcePage } from '../../components/ResourcePage';
import { LEVEL_PRESETS } from '@kg/shared';

const opt = (rows: any[] | undefined, label = 'name') => (rows ?? []).map((r) => ({ value: r._id, label: r[label] }));

export default function People({ kind }: { kind: 'students' | 'parents' | 'faculty' }) {
  const courses = useQuery({ queryKey: ['courses-a'], queryFn: () => get('/admin/courses') });
  const batches = useQuery({ queryKey: ['batches-a'], queryFn: () => get('/admin/batches') });
  const parents = useQuery({ queryKey: ['parents-a'], queryFn: () => get('/admin/parents'), enabled: kind === 'students' });
  const file = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false);

  async function importXlsx(f: File) {
    setBusy(true);
    try { const b64 = btoa(String.fromCharCode(...new Uint8Array(await f.arrayBuffer()))); const r = await post('/admin/students/import', { file: b64 }); toast.ok(`Imported ${r.created} students${r.errors.length ? ` (${r.errors.length} rows skipped)` : ''}`); location.reload(); } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); }
  }

  if (kind === 'students') return (
    <ResourcePage title="Students" sub="Add, import, link parents, assign batches" endpoint="/admin/students" canDelete
      defaults={{ abacusLevel: 1, status: 'active' }}
      headerExtra={<><input ref={file} type="file" accept=".xlsx" hidden onChange={(e) => e.target.files?.[0] && importXlsx(e.target.files[0])} /><Button variant="ghost" loading={busy} onClick={() => file.current?.click()}><FileUp size={18} />Import Excel</Button><Button variant="ghost" onClick={() => download('/admin/students/template', 'students-template.xlsx')}><Download size={18} />Template</Button></>}
      cols={[
        { key: 'name', label: 'Name', primary: true, sort: (a, b) => a.name.localeCompare(b.name), render: (r) => <Link to={`/admin/students/${r._id}`} className="font-bold text-navy hover:text-saffron">{r.name}</Link> },
        { key: 'admissionNo', label: 'Adm. no' }, { key: 'abacusLevel', label: 'Level', sort: (a, b) => a.abacusLevel - b.abacusLevel, render: (r) => <Badge>L{r.abacusLevel}</Badge> },
        { key: 'batches', label: 'Batches', render: (r) => (r.batchIds ?? []).map((b: any) => b.name).join(', ') || '–' },
        { key: 'parents', label: 'Parents', hideMobile: true, render: (r) => (r.parentIds ?? []).map((p: any) => p.name).join(', ') || '–' },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
      ]}
      fields={[
        { key: 'name', label: 'Student name', required: true }, { key: 'abacusLevel', label: 'Abacus level', type: 'select', options: LEVEL_PRESETS.map((l) => ({ value: l.level, label: l.name })) },
        { key: 'dob', label: 'Date of birth', type: 'date' }, { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'alumni'].map((s) => ({ value: s, label: s })) },
        { key: 'parentIds', label: 'Link existing parents', type: 'multi', options: opt(parents.data) }, { key: 'courseIds', label: 'Courses', type: 'multi', options: opt(courses.data) },
        { key: 'batchIds', label: 'Batches', type: 'multi', options: opt(batches.data) },
        { key: 'pname', label: 'New parent name', createOnly: true, hint: 'Creates a parent login (email OTP)' }, { key: 'pemail', label: 'New parent email', type: 'email', createOnly: true }, { key: 'pphone', label: 'New parent phone', createOnly: true },
      ]}
      toForm={(r) => ({ ...r, dob: r.dob?.slice(0, 10), parentIds: (r.parentIds ?? []).map((p: any) => p._id), courseIds: (r.courseIds ?? []).map((c: any) => c._id), batchIds: (r.batchIds ?? []).map((b: any) => b._id) })}
      toPayload={(f) => { const { pname, pemail, pphone, ...rest } = f; return { ...rest, abacusLevel: Number(rest.abacusLevel) || 1, dob: rest.dob || undefined, parentIds: rest.parentIds ?? [], courseIds: rest.courseIds ?? [], batchIds: rest.batchIds ?? [], ...(pemail ? { parent: { name: pname || 'Parent', email: pemail, phone: pphone || undefined } } : {}) }; }}
      rowActions={(r, reload) => <><Button small variant="sun" onClick={async () => { try { await post(`/admin/students/${r._id}/promote`); toast.ok('Promoted'); reload(); } catch (e) { toast.err(errMsg(e)); } }}><TrendingUp size={16} />Promote</Button><Button small variant="ghost" onClick={() => download(`/admin/students/${r._id}/idcard`, `${r.admissionNo}.pdf`)}><IdCard size={16} />ID</Button></>}
    />
  );

  const isFac = kind === 'faculty';
  return (
    <ResourcePage title={isFac ? 'Faculty' : 'Parents'} sub={isFac ? 'Teachers, their courses and batches' : 'Parent logins use email OTP'} endpoint={`/admin/${kind}`}
      cols={[
        { key: 'name', label: 'Name', primary: true, sort: (a, b) => a.name.localeCompare(b.name) }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone', hideMobile: true },
        isFac ? { key: 'batches', label: 'Batches', render: (r) => (r.batches ?? []).join(', ') || '–' } : { key: 'children', label: 'Children', render: (r) => (r.children ?? []).join(', ') || '–' },
        { key: 'isActive', label: 'Status', render: (r) => <Badge tone={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'active' : 'off'}</Badge> },
      ]}
      defaults={{ isActive: true }}
      fields={[{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', type: 'email', required: !isFac }, { key: 'phone', label: 'Phone' },
        ...(isFac ? [{ key: 'password', label: 'Password', type: 'password' as const, hint: 'Leave blank to keep the current one' }, { key: 'subjects', label: 'Courses they can teach', type: 'multi' as const, options: opt(courses.data) }, { key: 'experience', label: 'Experience' }, { key: 'bio', label: 'Bio', type: 'textarea' as const }] : []),
        { key: 'isActive', label: 'Active', type: 'checkbox' }]}
      toForm={(r) => ({ ...r, subjects: (r.subjects ?? []).map((s: any) => s._id) })}
      toPayload={(f) => { const o: any = { ...f }; delete o.children; delete o.batches; delete o._id; delete o.__v; delete o.createdAt; delete o.updatedAt; delete o.role; if (!o.password) delete o.password; if (!o.email) delete o.email; return o; }}
    />
  );
}
