import { Calculator, FileText, Headphones, Zap } from 'lucide-react';
import { Card, EmptyState } from './ui';

const MODE: Record<string, { label: string; Icon: any; tone: string }> = {
  flash: { label: 'Flash', Icon: Zap, tone: 'bg-saffron/15 text-saffron' }, listen: { label: 'Listening', Icon: Headphones, tone: 'bg-sky/15 text-sky' },
  visual: { label: 'Visual sheet', Icon: FileText, tone: 'bg-mint/20 text-emerald-700' }, sheet: { label: 'Sheet', Icon: Calculator, tone: 'bg-navy/10 text-navy' },
};
const dayLabel = (d: Date) => {
  const t = new Date(); const y = new Date(Date.now() - 86400000);
  return d.toDateString() === t.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

/** Past practice sessions, newest first, grouped by day. */
export function PracticeHistory({ sessions, bare }: { sessions: any[]; bare?: boolean }) {
  const Wrap = ({ children }: { children: React.ReactNode }) => (bare ? <div>{children}</div> : <Card>{children}</Card>);
  if (!sessions?.length) return <Wrap>{!bare && <h2 className="mb-2 font-display text-xl font-bold text-navy">Practice history</h2>}<EmptyState mood="cheer" title="No practice yet" hint="Finish a round and it will show up here." /></Wrap>;
  const rows = [...sessions].reverse();
  const groups: { day: string; items: any[] }[] = [];
  for (const s of rows) { const k = dayLabel(new Date(s.createdAt)); const g = groups[groups.length - 1]; if (g?.day === k) g.items.push(s); else groups.push({ day: k, items: [s] }); }
  const best = Math.max(...rows.map((r) => r.accuracy ?? 0)); const avg = Math.round(rows.reduce((a, r) => a + (r.accuracy ?? 0), 0) / rows.length);
  return (
    <Wrap>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">{!bare && <h2 className="font-display text-xl font-bold text-navy">Practice history</h2>}
        <p className="text-sm text-ink/60">{rows.length} sessions · average {avg}% · best {best}%</p></div>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.day}><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-ink/50">{g.day}</p>
            <ul className="space-y-2">{g.items.map((s) => { const m = MODE[s.mode] ?? MODE.sheet; const Ic = m.Icon; return (
              <li key={s._id} className="flex items-center gap-3 rounded-2xl bg-sky/5 px-3 py-2">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${m.tone}`}><Ic size={20} /></span>
                <div className="min-w-0 flex-1"><p className="font-bold text-navy">{m.label} · Level {s.level}</p><p className="text-xs text-ink/60">{new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {((s.avgTimeMs ?? 0) / 1000).toFixed(1)}s per question</p></div>
                <div className="text-right"><p className={`font-display text-xl font-extrabold ${s.accuracy >= 70 ? 'text-mint' : s.accuracy >= 50 ? 'text-sun' : 'text-saffron'}`}>{Math.round(s.accuracy)}%</p></div>
              </li>); })}</ul></div>
        ))}
      </div>
    </Wrap>
  );
}
