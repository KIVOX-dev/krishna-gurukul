import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { del, errMsg, get, post, put } from '../services/api';
import { toast } from '../store';
import { Button, DataTable, ErrorState, Field, Input, Modal, PageTitle, Select, SkeletonList, Textarea, cx, type Col } from './ui';

export interface FieldDef {
  key: string; label: string; type?: 'text' | 'number' | 'email' | 'select' | 'multi' | 'textarea' | 'checkbox' | 'time' | 'password' | 'date';
  options?: { value: string | number; label: string }[]; required?: boolean; hint?: string; createOnly?: boolean; list?: boolean;
}

/** Config-driven list + add/edit modal. Used by students, parents, faculty, courses, batches, fee plans. */
export function ResourcePage({ title, sub, endpoint, cols, fields, empty, toForm, toPayload, rowActions, headerExtra, defaults = {}, canDelete = false, filter }: {
  title: string; sub?: string; endpoint: string; cols: Col<any>[]; fields: FieldDef[]; empty?: ReactNode;
  toForm?: (row: any) => Record<string, any>; toPayload?: (f: Record<string, any>, editing: boolean) => any;
  rowActions?: (row: any, reload: () => void) => ReactNode; headerExtra?: ReactNode; defaults?: Record<string, any>; canDelete?: boolean; filter?: (rows: any[]) => any[];
}) {
  const qc = useQueryClient(); const key = ['res', endpoint];
  const q = useQuery({ queryKey: key, queryFn: () => get(endpoint) });
  const [edit, setEdit] = useState<any | null>(null); const [f, setF] = useState<Record<string, any>>({});
  const reload = () => qc.invalidateQueries({ queryKey: key });
  const open = (row?: any) => { setEdit(row ?? {}); setF(row ? toForm?.(row) ?? row : { ...defaults }); };
  const save = useMutation({
    mutationFn: () => { const body = toPayload ? toPayload(f, !!edit?._id) : f; return edit?._id ? put(`${endpoint}/${edit._id}`, body) : post(endpoint, body); },
    onSuccess: () => { toast.ok('Saved'); setEdit(null); reload(); }, onError: (e) => toast.err(errMsg(e)),
  });
  const remove = useMutation({ mutationFn: (id: string) => del(`${endpoint}/${id}`), onSuccess: () => { toast.ok('Removed'); reload(); }, onError: (e) => toast.err(errMsg(e)) });
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const rows = q.data ? (filter ? filter(q.data) : q.data) : [];
  return (
    <div>
      <PageTitle title={title} sub={sub} right={<div className="flex flex-wrap gap-2">{headerExtra}<Button onClick={() => open()}><Plus size={18} />Add</Button></div>} />
      {q.isLoading ? <SkeletonList /> : q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : (
        <DataTable rows={rows} cols={cols} empty={empty} onRow={(r) => open(r)} actions={(r) => <>{rowActions?.(r, reload)}<Button small variant="ghost" onClick={() => open(r)}>Edit</Button>{canDelete && <Button small variant="ghost" onClick={() => confirm('Remove this?') && remove.mutate(r._id)}>Remove</Button>}</>} />
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`} wide>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-2">
          {fields.filter((x) => !(x.createOnly && edit?._id)).map((x) => (
            <div key={x.key} className={cx(['textarea', 'multi'].includes(x.type ?? '') && 'sm:col-span-2')}>
              <Field label={x.label + (x.required ? ' *' : '')} hint={x.hint}>
                {x.type === 'select' ? <Select value={f[x.key] ?? ''} onChange={(e) => set(x.key, e.target.value)} required={x.required}><option value="">Select</option>{x.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
                  : x.type === 'multi' ? <div className="flex flex-wrap gap-2">{x.options?.map((o) => { const sel: any[] = f[x.key] ?? []; const on = sel.includes(o.value); return <button type="button" key={o.value} onClick={() => set(x.key, on ? sel.filter((v) => v !== o.value) : [...sel, o.value])} className={cx('min-h-[44px] rounded-full border-2 px-3 text-sm font-bold', on ? 'border-saffron bg-saffron text-white' : 'border-navy/15 text-navy')}>{o.label}</button>; })}</div>
                    : x.type === 'textarea' ? <Textarea rows={3} value={f[x.key] ?? ''} onChange={(e) => set(x.key, e.target.value)} />
                      : x.type === 'checkbox' ? <input type="checkbox" className="h-6 w-6" checked={!!f[x.key]} onChange={(e) => set(x.key, e.target.checked)} />
                        : <Input type={x.type ?? 'text'} value={f[x.key] ?? ''} required={x.required} onChange={(e) => set(x.key, x.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />}
              </Field>
            </div>
          ))}
          <div className="sm:col-span-2"><Button type="submit" loading={save.isPending} className="w-full">Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
