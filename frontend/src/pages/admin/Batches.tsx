import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarCheck, Users } from 'lucide-react';
import { LEVEL_PRESETS } from '@kg/shared';
import { get, put, errMsg } from '../../services/api';
import { toast } from '../../store';
import { Badge, Button, Modal } from '../../components/ui';
import { ResourcePage } from '../../components/ResourcePage';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Batch allocation: clash check (faculty) and capacity check are enforced by the server. */
export default function Batches() {
  const courses = useQuery({ queryKey: ['courses-a'], queryFn: () => get('/admin/courses') });
  const faculty = useQuery({ queryKey: ['faculty-a'], queryFn: () => get('/admin/faculty') });
  const students = useQuery({ queryKey: ['students-all'], queryFn: () => get('/admin/students', { status: 'active' }) });
  const qc = useQueryClient(); const [alloc, setAlloc] = useState<any>(null); const [sel, setSel] = useState<string[]>([]); const [drag, setDrag] = useState<string | null>(null);
  const openAlloc = (b: any) => { setAlloc(b); setSel(b.studentIds.map((s: any) => s._id)); };
  const all: any[] = students.data ?? []; const inBatch = all.filter((s) => sel.includes(s._id)); const out = all.filter((s) => !sel.includes(s._id));
  async function saveAlloc() { try { await put(`/admin/batches/${alloc._id}/students`, { studentIds: sel }); toast.ok('Batch updated'); setAlloc(null); qc.invalidateQueries({ queryKey: ['res', '/admin/batches'] }); } catch (e) { toast.err(errMsg(e)); } }
  return (
    <>
      <ResourcePage title="Batches" sub="Faculty clash and capacity are checked for you" endpoint="/admin/batches" canDelete defaults={{ days: [], mode: 'offline', capacity: 15 }}
        cols={[{ key: 'name', label: 'Batch', primary: true }, { key: 'course', label: 'Course', render: (r) => r.courseId?.name }, { key: 'faculty', label: 'Faculty', render: (r) => r.facultyId?.name ?? '–' }, { key: 'when', label: 'When', render: (r) => `${r.days.join(', ')} ${r.startTime}–${r.endTime}` }, { key: 'cap', label: 'Seats', render: (r) => <Badge tone={r.studentIds.length >= r.capacity ? 'red' : 'green'}>{r.studentIds.length}/{r.capacity}</Badge> }]}
        fields={[{ key: 'name', label: 'Batch name', required: true }, { key: 'courseId', label: 'Course', type: 'select', required: true, options: (courses.data ?? []).map((c: any) => ({ value: c._id, label: c.name })) }, { key: 'level', label: 'Level', type: 'select', options: LEVEL_PRESETS.map((l) => ({ value: l.level, label: l.name })) },
          { key: 'facultyId', label: 'Faculty', type: 'select', options: (faculty.data ?? []).map((c: any) => ({ value: c._id, label: c.name })) }, { key: 'days', label: 'Days', type: 'multi', options: DAYS.map((d) => ({ value: d, label: d })) },
          { key: 'startTime', label: 'Start', type: 'time', required: true }, { key: 'endTime', label: 'End', type: 'time', required: true }, { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'offline', label: 'Offline' }, { value: 'online', label: 'Online' }] },
          { key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'leaderboardOff', label: 'Hide leaderboard for this batch', type: 'checkbox' }]}
        toForm={(r) => ({ ...r, courseId: r.courseId?._id, facultyId: r.facultyId?._id ?? '' })}
        toPayload={(f) => ({ name: f.name, courseId: f.courseId, level: f.level ? Number(f.level) : undefined, facultyId: f.facultyId || undefined, days: f.days ?? [], startTime: f.startTime, endTime: f.endTime, mode: f.mode, capacity: Number(f.capacity) || 15, leaderboardOff: !!f.leaderboardOff })}
        rowActions={(r) => <><Button small variant="sun" onClick={() => openAlloc(r)}><Users size={16} />Students</Button><Link to={`/faculty/attendance/${r._id}`} className="btn-ghost btn-sm btn"><CalendarCheck size={16} />Attendance</Link></>}
      />
      <Modal open={!!alloc} onClose={() => setAlloc(null)} title={`Allocate: ${alloc?.name ?? ''}`} wide>
        <p className="mb-2 text-sm text-ink/60">Drag students into the batch (or tap). Capacity {alloc?.capacity}.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div onDragOver={(e) => e.preventDefault()} onDrop={() => drag && setSel((s) => [...new Set([...s, drag])])} className="min-h-[200px] rounded-2xl bg-mint/10 p-3"><p className="mb-2 font-bold text-navy">In batch ({inBatch.length})</p>{inBatch.map((s) => <button key={s._id} draggable onDragStart={() => setDrag(s._id)} onClick={() => setSel((x) => x.filter((i) => i !== s._id))} className="mb-1 mr-1 min-h-[44px] rounded-full bg-white px-3 text-sm font-bold shadow-soft">{s.name} ✕</button>)}</div>
          <div onDragOver={(e) => e.preventDefault()} onDrop={() => drag && setSel((s) => s.filter((i) => i !== drag))} className="max-h-72 min-h-[200px] overflow-y-auto rounded-2xl bg-sky/10 p-3"><p className="mb-2 font-bold text-navy">Available</p>{out.map((s) => <button key={s._id} draggable onDragStart={() => setDrag(s._id)} onClick={() => setSel((x) => [...x, s._id])} className="mb-1 mr-1 min-h-[44px] rounded-full bg-white px-3 text-sm font-bold shadow-soft">+ {s.name}</button>)}</div>
        </div>
        <Button className="mt-4 w-full" onClick={saveAlloc}>Save allocation</Button>
      </Modal>
    </>
  );
}
