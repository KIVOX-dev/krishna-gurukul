import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { errMsg, get, put, uploadFile } from '../../services/api';
import { toast } from '../../store';
import { Button, Card, ErrorState, Field, Input, PageTitle, SkeletonList, Textarea } from '../../components/ui';

/** Website CMS: hero text, pillars, faculty, testimonials, stats (JSON-free forms) and gallery images. */
export default function Cms() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['cms-a'], queryFn: () => get('/admin/cms') });
  const [busy, setBusy] = useState(false);
  if (q.isLoading) return <SkeletonList />; if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const find = (page: string, section: string) => (q.data as any[]).find((r) => r.page === page && r.section === section);
  const save = async (page: string, section: string, content: any, images?: string[]) => { setBusy(true); try { await put('/admin/cms', { page, section, content, images }); toast.ok('Website updated'); qc.invalidateQueries({ queryKey: ['cms-a'] }); qc.invalidateQueries({ queryKey: ['cms'] }); } catch (e) { toast.err(errMsg(e)); } finally { setBusy(false); } };
  const hero = find('home', 'hero')?.content ?? {}; const gal = find('gallery', 'images')?.images ?? [];
  return (
    <div className="space-y-5"><PageTitle title="Website CMS" sub="All text and images on the public site" />
      <Section title="Home hero" initial={hero} fields={[['title', 'Headline'], ['subtitle', 'Sub-headline', true]]} onSave={(c) => save('home', 'hero', c)} busy={busy} />
      <ListSection title="Pillars" page="home" section="pillars" q={q.data} fields={[['t', 'Title'], ['d', 'Description']]} extra={(c: any) => ({ ...c })} save={save} busy={busy} />
      <ListSection title="Mentors" page="home" section="faculty" photo q={q.data} fields={[['name', 'Name'], ['role', 'Role'], ['note', 'Note']]} save={save} busy={busy} />
      <ListSection title="Testimonials" page="home" section="testimonials" q={q.data} fields={[['n', 'Parent name'], ['t', 'Quote']]} save={save} busy={busy} />
      <Card><h3 className="mb-2 text-xl font-bold text-navy">Gallery images</h3>
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">{gal.map((u: string) => <div key={u} className="relative">{/\.(mp4|webm|mov|m4v|ogg)$/i.test(u) ? <video src={u} muted className="aspect-square w-full rounded-xl object-cover" /> : /\.(webp|jpe?g|png|gif|avif|bmp|svg)$/i.test(u) ? <img src={u} alt="" className="aspect-square rounded-xl object-cover" /> : <a href={u} target="_blank" rel="noreferrer" className="grid aspect-square place-items-center rounded-xl bg-sky/15 p-2 text-center text-xs font-bold text-navy">{decodeURIComponent(u.split('/').pop() ?? 'file').slice(0, 24)}</a>}<button className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-white text-xs shadow" onClick={() => save('gallery', 'images', {}, gal.filter((x: string) => x !== u))} aria-label="Remove">✕</button></div>)}</div>
        <label className="btn-blue btn cursor-pointer"><ImagePlus size={18} />Upload photos, videos or files<input type="file" multiple hidden onChange={async (e) => { const fs = [...(e.target.files ?? [])]; setBusy(true); try { const urls = []; for (const f of fs) urls.push(await uploadFile(f, 'public')); await save('gallery', 'images', {}, [...gal, ...urls]); } catch (x) { toast.err(errMsg(x)); } finally { setBusy(false); } }} /></label>
        <p className="mt-1 text-xs text-ink/60">Any format works. JPG and PNG photos are compressed to WebP in your browser; videos and other files upload as they are.</p></Card>
    </div>
  );
}

function Section({ title, initial, fields, onSave, busy }: { title: string; initial: any; fields: (readonly [string, string, boolean?])[]; onSave: (c: any) => void; busy: boolean }) {
  const [v, setV] = useState<any>(initial);
  return <Card><h3 className="mb-2 text-xl font-bold text-navy">{title}</h3><div className="grid gap-3">{fields.map(([k, l, area]) => <Field key={k} label={l}>{area ? <Textarea rows={2} value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} /> : <Input value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} />}</Field>)}</div><Button className="mt-3" loading={busy} onClick={() => onSave(v)}>Save</Button></Card>;
}

function ListSection({ title, page, section, q, fields, save, busy, photo }: any) {
  const row = (q as any[]).find((r) => r.page === page && r.section === section)?.content ?? { items: [] };
  const [items, setItems] = useState<any[]>(row.items ?? []);
  const upd = (i: number, k: string, val: string) => setItems(items.map((it, n) => (n === i ? { ...it, [k]: val } : it)));
  const [up, setUp] = useState<number | null>(null);
  async function pick(i: number, f?: File) { if (!f) return; setUp(i); try { upd(i, 'photo', await uploadFile(f, 'public')); toast.ok('Photo uploaded. Press Save to publish.'); } catch (e) { toast.err(errMsg(e)); } finally { setUp(null); } }
  return (
    <Card><h3 className="mb-2 text-xl font-bold text-navy">{title}</h3>
      {items.map((it, i) => <div key={i} className="mb-2 grid gap-2 rounded-2xl bg-sky/5 p-3 sm:grid-cols-3">{photo && <div className="flex items-center gap-3 sm:col-span-3">{it.photo ? <img src={it.photo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-sun" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-sky/15 font-display text-2xl font-bold text-navy">{(it.name ?? '?')[0]}</span>}<label className="btn-blue btn-sm btn cursor-pointer"><ImagePlus size={16} />{up === i ? 'Uploading…' : it.photo ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" hidden onChange={(e) => pick(i, e.target.files?.[0])} /></label>{it.photo && <Button small variant="ghost" onClick={() => upd(i, 'photo', '')}>Remove photo</Button>}</div>}{fields.map(([k, l]: string[]) => <Input key={k} aria-label={l} placeholder={l} value={it[k] ?? ''} onChange={(e) => upd(i, k, e.target.value)} />)}<Button small variant="ghost" onClick={() => setItems(items.filter((_, n) => n !== i))}>Remove</Button></div>)}
      <div className="flex gap-2"><Button variant="ghost" small onClick={() => setItems([...items, {}])}>+ Add</Button><Button small loading={busy} onClick={() => save(page, section, { ...row, items })}>Save</Button></div></Card>
  );
}
