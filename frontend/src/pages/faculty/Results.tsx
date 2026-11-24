import { useState } from 'react';
import { Stars } from '../../components/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { get, put, errMsg } from '../../services/api';
import { toast } from '../../store';
import { Button, DataTable, ErrorState, Input, Modal, PageTitle, SkeletonList, type Col } from '../../components/ui';

export default function Results() {
  const q = useQuery({ queryKey: ['fresults'], queryFn: () => get('/faculty/results') }); const qc = useQueryClient();
  const [row, setRow] = useState<any>(null); const [remark, setRemark] = useState('');
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const cols: Col<any>[] = [
    { key: 'student', label: 'Student', primary: true, sort: (a, b) => a.student.localeCompare(b.student), render: (r) => <Link className="text-sky" to={`/faculty/students/${r.studentId}`}>{r.student}</Link> },
    { key: 'test', label: 'Test' }, { key: 'batch', label: 'Batch', hideMobile: true },
    { key: 'score', label: 'Score', sort: (a, b) => a.score - b.score, render: (r) => <b className="text-saffron">{r.score}% <Stars n={r.stars} /></b> },
    { key: 'time', label: 'Time', hideMobile: true, render: (r) => `${Math.round(r.durationMs / 1000)}s` }, { key: 'remark', label: 'Remark', render: (r) => r.remark ?? '–' },
  ];
  async function save() { try { await put(`/faculty/results/${row.id}/remark`, { remark }); toast.ok('Remark saved. Parents can see it now.'); setRow(null); qc.invalidateQueries({ queryKey: ['fresults'] }); } catch (e) { toast.err(errMsg(e)); } }
  return (
    <div><PageTitle title="Test results" sub="Graded automatically the moment a student submits" />
      <DataTable rows={q.data.map((r: any) => ({ ...r, _id: r.id }))} cols={cols} actions={(r) => <Button small variant="ghost" onClick={() => { setRow(r); setRemark(r.remark ?? ''); }}>Remark</Button>} />
      <Modal open={!!row} onClose={() => setRow(null)} title={`Remark for ${row?.student ?? ''}`}><div className="space-y-3"><Input value={remark} onChange={(e) => setRemark(e.target.value)} maxLength={300} placeholder="Great speed, watch the 3 digit subtraction" /><Button onClick={save} className="w-full">Save remark</Button></div></Modal>
    </div>
  );
}
